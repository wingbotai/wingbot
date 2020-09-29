/*
 * @author David Menger
 */
'use strict';

const ai = require('./Ai');
const { FLAG_DO_NOT_LOG } = require('./flags');

/** @typedef {import('./Request')} Request */
/** @typedef {import('./Responder')} Responder */

/**
 * @typedef {object} ChatLogStorage
 * @property {Function} log
 * @property {Function} error
 */

/**
 * @typedef {object} ReturnSenderOptions
 * @prop {textFilter} [textFilter] - filter for saving the texts
 * @prop {boolean} [logStandbyEvents] - log the standby events
 * @prop {textFilter} [confidentInputFilter] - filter for confident input (@CONFIDENT)
 */

/**
 * Text filter function
 *
 * @callback textFilter
 * @param {string} text - input text
 * @returns {string} - filtered text
 */

class ReturnSender {

    /**
     *
     * @param {ReturnSenderOptions} options
     * @param {string} userId
     * @param {object} incommingMessage
     * @param {ChatLogStorage} logger - console like logger
     */
    constructor (options, userId, incommingMessage, logger = null) {
        this._queue = [];

        /**
         * @type {object[]}
         */
        this.responses = [];
        this._results = [];

        this._promise = Promise.resolve();

        this._isWorking = false;

        const isStandbyEvent = incommingMessage.isStandby;

        this._sendLogs = logger !== null
            && (!isStandbyEvent || options.logStandbyEvents);

        this._userId = userId;

        this._incommingMessage = incommingMessage;

        this._logger = logger;

        this._sequence = 0;

        this._finished = false;
        this._catchedBeforeFinish = null;

        /**
         * @type {boolean}
         */
        this.waits = false;

        this.propagatesWaitEvent = false;

        this.simulatesOptIn = false;
        this.simulateFail = false;

        this._simulateStateChange = null;
        this._simulateStateChangeOnLoad = null;

        /**
         * Preprocess text for NLP
         * For example to remove any confidential data
         *
         * @param {string} text
         * @type {textFilter}
         */
        this.textFilter = options.textFilter || ((text) => text);

        this.confidentInputFilter = options.confidentInputFilter || (() => '@CONFIDENT');

        this._lastWait = 0;

        this._visitedInteractions = [];
    }

    _send (payload) { // eslint-disable-line no-unused-vars
        const res = {
            message_id: `${Date.now()}${Math.random()}.${this._sequence++}`
        };

        // simulate optin
        const isOptIn = this._incommingMessage.optin && this._incommingMessage.optin.user_ref;

        if (isOptIn && this.simulatesOptIn) {
            this._simulateStateChange = { senderId: this._userId };
        }

        if (this.simulateFail) {
            return Promise.reject(new Error('Fail'));
        }

        return Promise.resolve(res);
    }

    _wait (wait) {
        const nextWait = this._lastWait
            ? Math.round(wait * 0.75) + this._lastWait
            : wait;

        this._lastWait = Math.round(wait * 0.334);

        if (!this.waits) {
            return Promise.resolve();
        }
        return new Promise((r) => setTimeout(r, nextWait));
    }

    _filterMessage (payload, confidentInput = false, req = null) {

        const filter = confidentInput
            ? this.confidentInputFilter
            : this.textFilter;

        // text message
        if (payload.message && payload.message.text) {
            let { text } = payload.message;

            if (req && req._anonymizedText) {
                text = req._anonymizedText;
            }

            return {
                ...payload,
                message: {
                    ...payload.message,
                    text: filter(text)
                }
            };
        }

        // button message
        if (payload.message && payload.message.attachment
            && payload.message.attachment.type === 'template'
            && payload.message.attachment.payload
            && payload.message.attachment.payload.text) {

            return {
                ...payload,
                message: {
                    ...payload.message,
                    attachment: {
                        ...payload.message.attachment,
                        payload: {
                            ...payload.message.attachment.payload,
                            text: filter(payload.message.attachment.payload.text)
                        }
                    }
                }
            };
        }

        return payload;
    }

    async _work () {
        this._isWorking = true;
        let payload;
        let previousResponse = null;
        while (this._queue.length > 0) {
            payload = this._queue.shift();

            if (payload.wait && !this.propagatesWaitEvent) {
                await this._wait(payload.wait);
            } else {
                this.responses.push(payload);
                previousResponse = await this._send(payload);
                this._results.push(previousResponse);
            }
        }
        this._isWorking = false;
    }

    visitedInteraction (action) {
        this._visitedInteractions.push(action);
    }

    send (payload) {
        if (this._finished) {
            throw new Error('Cannot send message after sender is finished');
        }
        this._queue.push(payload);

        if (this._catchedBeforeFinish) {
            return;
        }

        if (!this._isWorking) {
            this._promise = this._promise
                .then(() => this._work())
                .catch((e) => {
                    if (this._finished) {
                        throw e; // ints ok
                    }
                    this._catchedBeforeFinish = e;
                });
        }
    }

    /**
     * @returns {Promise<object|null>}
     */
    modifyStateAfterLoad () {
        return Promise.resolve(this._simulateStateChangeOnLoad);
    }

    /**
     * @returns {Promise<object|null>}
     */
    modifyStateBeforeStore () {
        return Promise.resolve(this._simulateStateChange);
    }

    _cleanupEntities (entities = []) {
        return entities.map((e) => ({
            ...e,
            value: typeof e.value === 'object'
                ? JSON.stringify(e.value).substring(0, 20)
                : e.value
        }));
    }

    _cleanupIntent (intent) {
        return {
            ...intent,
            entities: this._cleanupEntities(intent.entities)
        };
    }

    /**
     * @private
     * @param {Request} req
     * @param {Responder} res
     */
    _createMeta (req = null, res = null) { // eslint-disable-line no-unused-vars
        const meta = {
            visitedInteractions: this._visitedInteractions.slice()
        };

        if (req) {
            let text = req.text();

            if (text) {
                text = this.textFilter(text);
            }

            const expected = req.expected();
            Object.assign(meta, {
                ...res.senderMeta,
                timestamp: req.timestamp,
                text,
                intent: req.intent(ai.ai.confidence),
                aiConfidence: ai.ai.confidence,
                aiActions: req.aiActions()
                    .map((a) => ({
                        ...a,
                        intent: this._cleanupIntent(a.intent)
                    })),
                intents: (req.intents || [])
                    .map((i) => this._cleanupIntent(i)),
                entities: this._cleanupEntities((req.entities || [])
                    .filter((e) => e.score >= ai.ai.confidence)),
                action: req.action(),
                data: req.actionData(),
                expected: expected ? expected.action : null,
                pageId: req.pageId,
                senderId: req.senderId
            });
        }

        return meta;
    }

    async finished (req = null, res = null) {
        this._finished = true;

        const meta = this._createMeta(req, res);
        const confidentInput = req && req.isConfidentInput();

        try {
            await this._promise;

            if (this._catchedBeforeFinish) {
                throw this._catchedBeforeFinish;
            }

            if (this._sendLogs && meta.flag !== FLAG_DO_NOT_LOG) {
                this._sendLogs = false;
                const sent = this.responses.map((s) => this._filterMessage(s));
                const processedEvent = req
                    ? req.event
                    : this._incommingMessage;
                let incomming = this._filterMessage(processedEvent, confidentInput, req);

                if (processedEvent !== this._incommingMessage) {
                    incomming = {
                        ...incomming,
                        _incommingMessage: this._incommingMessage
                    };
                }

                await Promise.resolve(this._logger
                    .log(this._userId, sent, incomming, meta));
            }

            const somethingSent = this._results.length > 0;

            return {
                status: somethingSent ? 200 : 204,
                results: this._results
            };
        } catch (e) {
            const sent = this.responses.map((s) => this._filterMessage(s));
            const incomming = this._filterMessage(this._incommingMessage, confidentInput);

            if (this._logger) {
                await Promise.resolve(this._logger
                    .error(e, this._userId, sent, incomming, meta));
            } else {
                console.error(e, this._userId, sent, incomming); // eslint-disable-line
            }
            return {
                status: e.code || 500,
                results: this._results
            };
        }
    }

}

module.exports = ReturnSender;
