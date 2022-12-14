/**
 * @author David Menger
 */
'use strict';

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const BotAppSender = require('./BotAppSender');
const Processor = require('./Processor');
const ReturnSender = require('./ReturnSender');
const headersToAuditMeta = require('./utils/headersToAuditMeta');
const onInteractionHandler = require('./analytics/onInteractionHandler');

const DEFAULT_API_URL = 'https://orchestrator-api.wingbot.ai';

/** @typedef {import('./ReducerWrapper')} ReducerWrapper */
/** @typedef {import('./Router')} Router */
/** @typedef {import('./Processor').ProcessorOptions} ProcessorOptions */
/** @typedef {import('./ReturnSender').ChatLogStorage} ChatLogStorage */
/** @typedef {import('./Request')} Request */
/** @typedef {import('./Responder')} Responder */
/** @typedef {import('./Processor').Plugin} Plugin */

/** @typedef {import('./CallbackAuditLog')} AuditLog */
/** @typedef {import('./BotAppSender').TlsOptions} TlsOptions */
/** @typedef {import('./ReturnSender').ReturnSenderOptions} ReturnSenderOptions */

/** @typedef {import('./analytics/onInteractionHandler').IAnalyticsStorage} IAnalyticsStorage */
/** @typedef {import('./analytics/onInteractionHandler').HandlerConfig} HandlerConfig */
/** @typedef {import('./analytics/onInteractionHandler').OnEventHandler} OnEventHandler */
/** @typedef {import('./analytics/onInteractionHandler').Event} Event */

/**
 * @typedef {object} BotAppOptions
 * @prop {string|Promise<string>} secret
 * @prop {string} [appId] - for notifications
 * @prop {string} [apiUrl]
 * @prop {Function} [fetch]
 * @prop {ChatLogStorage} [chatLogStorage]
 * @prop {boolean} [preferSynchronousResponse]
 * @prop {AuditLog} [auditLog]
 * @prop {TlsOptions} [tls]
 *
 * @typedef {ProcessorOptions & BotAppOptions & ReturnSenderOptions} Options
 */

/**
 * @typedef {object} ApiResponse
 * @prop {number} statusCode
 * @prop {string} body
 * @prop {object} headers
 */

function defaultMsg (senderId, pageId) {
    return {
        sender: { id: senderId },
        recipient: { id: pageId },
        mid: null,
        timestamp: Date.now()
    };
}

/**
 * Adapter for Wingbot flight director
 *
 * @class
 */
class BotApp {

    /**
     *
     * @param {ReducerWrapper|Router} bot
     * @param {Options} options
     */
    constructor (bot, options) {
        const {
            secret,
            chatLogStorage = null,
            fetch = null,
            appId = null,
            preferSynchronousResponse = false,
            auditLog = null,
            tls = null,

            textFilter,
            logStandbyEvents,
            confidentInputFilter,

            ...processorOptions
        } = options;

        this._returnSenderOptions = {
            textFilter,
            logStandbyEvents,
            confidentInputFilter
        };

        this._secret = Promise.resolve(secret);
        this._fetch = fetch; // mock
        this._appId = appId;
        this._auditLog = auditLog;
        this._tls = tls;
        this._logger = options.log || console;
        this._textFilter = options.textFilter;

        this._preHeatCalled = false;
        this._preHeat = [
            this._logger,
            chatLogStorage,
            processorOptions.stateStorage,
            processorOptions.tokenStorage
        ].filter((s) => s && typeof s.preHeat === 'function');

        let { apiUrl } = options;

        if (!apiUrl) apiUrl = DEFAULT_API_URL;

        const gqlApiUrl = `${apiUrl}`.replace(/\/?$/, '/api');
        apiUrl = `${apiUrl}`.replace(/\/?$/, '/webhook/api');

        this._apiUrl = apiUrl;

        this._senderLogger = chatLogStorage;
        this._verify = promisify(jwt.verify);

        this._bot = bot;

        this._processor = new Processor(bot, {
            ...processorOptions,
            secret,
            fetch: this._fetch,
            apiUrl: gqlApiUrl
        });

        this._processor.plugin(BotApp.plugin());
        this._preferSynchronousResponse = preferSynchronousResponse;

        /** @type {OnEventHandler[]} */
        this._eventHandlers = [];
    }

    /**
     * Get authorization token for wingbot orchestrator
     *
     * @param {string} body
     * @param {string} secret
     * @param {string} appId
     * @returns {Promise<string>}
     */
    static signBody (body, secret, appId) {
        return BotAppSender.signBody(body, secret, appId);
    }

    /**
     * Returns processor plugin, which updates thread context automatically
     *
     * @returns {Plugin}
     */
    static plugin () {
        return {
            /**
             *
             * @param {Request} req
             * @param {Responder} res
             */
            afterProcessMessage (req, res) {
                const wasSet = req.getSetContext(true);
                const updatedVariables = Object.keys(res.newState)
                    .filter((key) => key.match(/^§/) && wasSet[key] !== res.newState[key]);

                if (updatedVariables.length !== 0) {
                    const setContext = updatedVariables
                        .reduce((o, key) => Object.assign(o, {
                            [key.replace(/^§/, '')]: res.newState[key]
                        }), {});

                    res.send({
                        set_context: setContext
                    });
                }
            }
        };
    }

    /**
     * Get the processor instance
     *
     * @returns {Processor}
     */
    get processor () {
        return this._processor;
    }

    /**
     *
     * @param {IAnalyticsStorage} analyticsStorage
     * @param {HandlerConfig} [options]
     * @returns {this}
     * @example
     * const { GA4 } = require('wingbot');
     *
     * botApp.registerAnalyticsStorage(new GA4({
     *     measurementId: 'G-123456,
     *     apiSecret: 'apisecret'
     * }))
     */
    registerAnalyticsStorage (analyticsStorage, options = {}) {
        const log = this._logger || options.log;

        if (typeof analyticsStorage.setDefaultLogger === 'function') {
            analyticsStorage.setDefaultLogger(log);
        }

        if (typeof analyticsStorage.preHeat === 'function') {
            this._preHeat.push(analyticsStorage);
        }

        // @ts-ignore
        const { snapshot = null, botId = null } = this._bot;

        const { onInteraction, onEvent } = onInteractionHandler({
            log,
            anonymize: this._textFilter,
            snapshot,
            botId,
            ...options
        }, analyticsStorage);

        this._eventHandlers.push(onEvent);
        this.processor.onInteraction(onInteraction);
        return this;
    }

    /**
     * Method for tracking special events
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {Event} event
     * @param {number} [ts]
     * @param {boolean} [nonInteractive]
     */
    async trackEvent (pageId, senderId, event, ts = Date.now(), nonInteractive = false) {
        const state = await this._processor.stateStorage.getState(senderId, pageId);

        if (!state) {
            throw new Error(`State ${pageId}:${senderId} not found. Ensure the #trackEvent() method was called after the conversation has started`);
        }

        await Promise.all(this._eventHandlers.map((handler) => handler(
            pageId,
            senderId,
            state.state,
            event,
            ts,
            nonInteractive
        )));
    }

    _errorResponse (message, status) {
        return {
            statusCode: status,
            body: `{"errors:":[{"error":${JSON.stringify(message)},"code":${status},"status":${status}}]}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }

    /**
     * @param {ReturnSender} sender
     * @param {string} senderId
     * @param {string} pageId
     * @param {object} headers
     */
    async _processSenderResponses (sender, senderId, pageId, headers) {
        if (!this._auditLog) {
            return;
        }
        await Promise.all(
            sender.tracking.events.map(async (event) => {
                if (!['audit', 'report'].includes(event.type)) {
                    return;
                }

                await this._auditLog.log(
                    event,
                    { senderId, pageId },
                    headersToAuditMeta(headers),
                    this._auditLog.defaultWid,
                    'Info',
                    event.type === 'audit' ? 'Important' : 'Debug'
                );
            })
        );
    }

    async _processIncommingMessage (
        message,
        senderId,
        pageId,
        appId,
        secret,
        sync = false,
        headers = {}
    ) {
        const setResponseToMid = message.response_to_mid || message.mid;

        if (sync || this._preferSynchronousResponse) {
            const options = this._returnSenderOptions;
            const sender = new ReturnSender(options, senderId, message, this._senderLogger);
            sender.propagatesWaitEvent = true;
            const res = await this._processor.processMessage(message, pageId, sender, { appId });
            await this._processSenderResponses(sender, senderId, pageId, headers);

            return {
                status: res.status,
                // yes, it should be just mid
                response_to_mid: message.mid,
                messaging: sender.responses
                    .map((response) => {
                        // attach sender
                        if (typeof response.sender === 'undefined') {
                            Object.assign(response, { sender: { id: pageId } });
                        }

                        // attach response_to_mid
                        if (typeof response.response_to_mid === 'undefined' && setResponseToMid) {
                            Object.assign(response, { response_to_mid: setResponseToMid });
                        }

                        return response;
                    })
            };
        }

        const sender = await this.createSender(senderId, pageId, message, secret, appId);
        const res = await this._processor.processMessage(message, pageId, sender, { appId });
        await this._processSenderResponses(sender, senderId, pageId, headers);

        return {
            status: res.status,
            response_to_mid: message.mid,
            messaging: []
        };
    }

    /**
     * Creates a Sender to be able, for example, to upload files
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {object} [message]
     * @param {string|Promise<string>} [secret]
     * @param {string} appId
     * @returns {Promise<BotAppSender>}
     */
    async createSender (
        senderId,
        pageId,
        message = defaultMsg(senderId, pageId),
        secret = this._secret,
        appId = this._appId
    ) {
        const useSecret = await Promise.resolve(secret);

        const setResponseToMid = message.response_to_mid || message.mid;

        const options = {
            ...this._returnSenderOptions,
            apiUrl: this._apiUrl,
            pageId,
            appId,
            secret: useSecret,
            mid: setResponseToMid,
            fetch: this._fetch,
            tls: this._tls
        };

        return new BotAppSender(options, senderId, message, this._senderLogger);
    }

    /**
     * Compatibility method for Notification engine
     *
     * @param {object} message - wingbot chat event
     * @param {string} senderId - chat event sender identifier
     * @param {string} pageId - channel/page identifier
     * @param {object} data - contextual data (will be available in res.data)
     * @param {string} [data.appId] - possibility to override appId
     * @returns {Promise<{status:number}>}
     */
    async processMessage (message, senderId, pageId, data = {}) {
        const appId = data.appId || this._appId;
        const secret = await this._secret;

        const options = {
            apiUrl: this._apiUrl,
            pageId,
            appId,
            secret,
            fetch: this._fetch,
            tls: this._tls
        };

        const sender = new BotAppSender(options, senderId, message, this._senderLogger);
        const res = await this._processor
            .processMessage(message, pageId, sender, { ...data, appId });

        return res;
    }

    /**
     * Process incomming API request from the orchestrator.
     *
     * The response can be sent using an express, or you can directly return the response to
     *
     * @param {string|null} rawBody
     * @param {object} rawHeaders
     * @returns {Promise<ApiResponse>}
     * @example
     * const express = require('express');
     * const { Router, BotApp } = require('express');
     * const app = express();
     *
     * const bot = new Router();
     *
     * bot.use((req, res) => { res.text('hello!'); });
     *
     * const botApp = new BotApp(bot, {
     *     apiUrl: 'https://<url to orchestrator>',
     *     secret: '<application secret in orchestrator>'
     * });
     *
     * app.get('/bot', express.text(), (req, res) => {
     *    botApp.request(req.body, req.headers)
     *        .then((response) => {
     *            const { body, statusCode, headers } = response;
     *
     *            res.status(statusCode)
     *                .set(headers)
     *                .send(body);
     *        })
     * });
     *
     */
    async request (rawBody, rawHeaders) {
        const token = rawHeaders.Authorization || rawHeaders.authorization;

        if (!token) {
            return this._errorResponse('Missing authentication header', 401);
        }

        let preHeatPromise = null;
        if (!this._preHeatCalled) {
            preHeatPromise = Promise.all(
                this._preHeat.map((p) => Promise.resolve(p.preHeat())
                    .catch((e) => this._logger.error('BotApp: preHeat failed', e)))
            );
            this._preHeatCalled = true;
        }

        let sha1;
        let appId;
        let secret;

        try {
            secret = await this._secret;
            // @ts-ignore
            ({ sha1, appId } = await this._verify(token, secret));
        } catch (e) {
            await Promise.resolve(preHeatPromise);
            return this._errorResponse(`Failed to verify token: ${e.message}`, 403);
        }

        const bodySha1 = crypto.createHash('sha1')
            .update(rawBody)
            .digest('hex');

        if (sha1 !== bodySha1) {
            await Promise.resolve(preHeatPromise);
            return this._errorResponse(`SHA1 does not match. Got in token: '${sha1}'`, 403);
        }

        try {
            const body = JSON.parse(rawBody);

            const entry = await this._processEntries(appId, secret, body.entry, rawHeaders);
            await Promise.resolve(preHeatPromise);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    entry
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        } catch (e) {
            await Promise.resolve(preHeatPromise);
            throw e;
        }
    }

    async _processEntries (appId, secret, entry = [], headers = {}) {
        return Promise.all(
            entry.map(async (event) => {
                const {
                    standby = [],
                    messaging = [],
                    id: pageId,
                    requires_response: sync = false
                } = event;

                const events = [
                    ...messaging,
                    ...standby.map((e) => ({ ...e, isStandby: true }))
                ];

                const responses = await this
                    ._processMessaging(events, pageId, appId, secret, sync, headers);

                return {
                    id: pageId,
                    responses
                };
            })
        );
    }

    async _processMessaging (process, pageId, appId, secret, sync, headers) {
        const eventsBySenderId = new Map();
        process.forEach((e) => this._processMessagingArrayItem(e, eventsBySenderId));

        const arrayOfResponses = await Promise.all(
            Array.from(eventsBySenderId.entries())
                .map(async ([senderId, messaging]) => {
                    const responses = [];

                    for (const message of messaging) {
                        const res = await this._processIncommingMessage(
                            message,
                            senderId,
                            pageId,
                            appId,
                            secret,
                            sync,
                            headers
                        );

                        responses.push(res);
                    }

                    return responses;
                })
        );

        // flattern
        return arrayOfResponses.reduce((a, r) => [...a, ...r], []);
    }

    _processMessagingArrayItem (message, eventsBySenderId) {
        let senderId = null;

        if (message.sender && message.sender.id) {
            senderId = message.sender.id;
        } else if (message.optin && message.optin.user_ref) {
            senderId = message.optin.user_ref;
            // simlate the sender id
            Object.assign(message, { sender: { id: senderId } });
        }

        if (!eventsBySenderId.has(senderId)) {
            eventsBySenderId.set(senderId, []);
        }

        eventsBySenderId.get(senderId).push(message);
    }

}

module.exports = BotApp;
