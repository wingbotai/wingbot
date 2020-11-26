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

const DEFAULT_API_URL = 'https://orchestrator-api.wingbot.ai';

/** @typedef {import('./ReducerWrapper')} ReducerWrapper */
/** @typedef {import('./Router')} Router */
/** @typedef {import('./Processor').ProcessorOptions} ProcessorOptions */
/** @typedef {import('./ReturnSender').ChatLogStorage} ChatLogStorage */

/**
 * @typedef {object} BotAppOptions
 * @prop {string|Promise<string>} secret
 * @prop {string} [apiUrl]
 * @prop {Function} [fetch]
 * @prop {ChatLogStorage} [chatLogStorage]
 *
 * @typedef {ProcessorOptions & BotAppOptions} Options
 */

/**
 * @typedef {object} ApiResponse
 * @prop {number} statusCode
 * @prop {string} body
 * @prop {object} headers
 */

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
            ...processorOptions
        } = options;

        this._processor = new Processor(bot, processorOptions);

        this._secret = Promise.resolve(secret);
        this._fetch = fetch; // mock

        let { apiUrl } = options;

        if (!apiUrl) apiUrl = DEFAULT_API_URL;

        if (`${apiUrl}`.match(/^https?:\/\/[0-9.:a-zA-Z\-_]+\/?$/)) {
            apiUrl = `${apiUrl}`.replace(/\/?$/, '/webhook/api');
        }

        this._apiUrl = apiUrl;

        this._senderLogger = chatLogStorage;
        this._verify = promisify(jwt.verify);
    }

    /**
     * Get the processor instance
     *
     * @returns {Processor}
     */
    get processor () {
        return this._processor;
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

    async _processIncommingMessage (message, senderId, pageId, appId, secret, sync = false) {
        const { mid = null } = message;

        if (sync) {
            const sender = new ReturnSender({}, senderId, message, this._senderLogger);
            sender.propagatesWaitEvent = true;
            const res = await this._processor.processMessage(message, pageId, sender, { appId });

            return {
                status: res.status,
                response_to_mid: message.mid,
                messaging: sender.responses
                    .map((response) => {
                        // attach sender
                        if (typeof response.sender === 'undefined') {
                            Object.assign(response, { sender: { id: pageId } });
                        }

                        // attach response_to_mid
                        if (typeof response.response_to_mid === 'undefined' && mid) {
                            Object.assign(response, { response_to_mid: mid });
                        }

                        return response;
                    })
            };
        }

        const options = {
            apiUrl: this._apiUrl,
            pageId,
            appId,
            secret,
            mid,
            fetch: this._fetch
        };

        const sender = new BotAppSender(options, senderId, message, this._senderLogger);
        const res = await this._processor.processMessage(message, pageId, sender, { appId });

        return {
            status: res.status,
            response_to_mid: message.mid,
            messaging: []
        };
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

        let sha1;
        let appId;
        let secret;

        try {
            secret = await this._secret;
            // @ts-ignore
            ({ sha1, appId } = await this._verify(token, secret));
        } catch (e) {
            return this._errorResponse(`Failed to verify token: ${e.message}`, 403);
        }

        const bodySha1 = crypto.createHash('sha1')
            .update(rawBody)
            .digest('hex');

        if (sha1 !== bodySha1) {
            return this._errorResponse(`SHA1 does not match. Got in token: '${sha1}'`, 403);
        }

        const body = JSON.parse(rawBody);

        const entry = await this._processEntries(appId, secret, body.entry);

        return {
            statusCode: 200,
            body: JSON.stringify({
                entry
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }

    async _processEntries (appId, secret, entry = []) {
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

                const responses = await this._processMessaging(events, pageId, appId, secret, sync);

                return {
                    id: pageId,
                    responses
                };
            })
        );
    }

    async _processMessaging (process, pageId, appId, secret, sync) {
        const eventsBySenderId = new Map();
        process.forEach((e) => this._processMessagingArrayItem(e, eventsBySenderId));

        const arrayOfResponses = await Promise.all(
            Array.from(eventsBySenderId.entries())
                .map(async ([senderId, messaging]) => {
                    const responses = [];

                    for (const message of messaging) {
                        const res = await this._processIncommingMessage(
                            message, senderId, pageId, appId, secret, sync
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
