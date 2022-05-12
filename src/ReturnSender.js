/*
 * @author David Menger
 */
'use strict';

const ai = require('./Ai');
const { FEATURE_PHRASES } = require('./features');
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
 * @typedef {object} UploadResult
 * @prop {string} [url]
 * @prop {string|number} [attachmentId]
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
     * @param {string} senderId
     * @param {object} incommingMessage
     * @param {ChatLogStorage} logger - console like logger
     */
    constructor (options, senderId, incommingMessage, logger = null) {
        this._queue = [];

        /**
         * @type {object[]}
         */
        this.responses = [];
        this._results = [];

        this._promise = null;

        this._isWorking = false;

        const isStandbyEvent = incommingMessage.isStandby;
        this._sendLogs = !isStandbyEvent || options.logStandbyEvents;

        this._senderId = senderId;

        this._incommingMessage = incommingMessage;

        this._logger = logger;

        this._sequence = 0;

        this._sendLastMessageWithFinish = Array.isArray(incommingMessage.features)
            && incommingMessage.features.includes(FEATURE_PHRASES);

        /**
         * @type {Function}
         * @private
         */
        this._finish = null;
        this._finishedPromise = new Promise((r) => {
            this._finish = (val) => {
                this._finished = true;
                r(val);
            };
        });
        this._finished = false;
        this._catchedBeforeFinish = null;

        /**
         * @type {boolean}
         */
        this.waits = false;

        this.propagatesWaitEvent = false;

        this._simulatesOptIn = false;
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

        this._tracking = {
            events: []
        };

        this._intentsAndEntities = [];

        /**
         * @type {Function}
         * @private
         */
        this._gotAnotherEventDefer = null;
        this._anotherEventPromise = null;
        this._gotAnotherEvent();
    }

    set simulatesOptIn (value) {
        this._simulatesOptIn = value;
        // simulate optin
        const isOptIn = this._incommingMessage.optin && this._incommingMessage.optin.user_ref;

        if (isOptIn && this._simulatesOptIn) {
            this._simulateStateChange = { senderId: this._senderId };
        }
    }

    get simulatesOptIn () {
        return this._simulatesOptIn;
    }

    _gotAnotherEvent () {
        if (this._gotAnotherEventDefer) {
            this._gotAnotherEventDefer();
        }
        this._anotherEventPromise = new Promise((r) => {
            this._gotAnotherEventDefer = r;
        });
    }

    get tracking () {
        return this._tracking;
    }

    get visitedInteractions () {
        return this._visitedInteractions.slice();
    }

    get results () {
        return this._results;
    }

    _send (payload) { // eslint-disable-line no-unused-vars
        const res = {
            message_id: `${Date.now()}${Math.random()}.${this._sequence++}`
        };

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

        let { message } = payload;

        if (message && message.voice && message.voice.ssml) {
            message = {
                ...message,
                text: message.text ? message.text : message.voice.ssml,
                voice: {
                    ...message.voice,
                    ssml: filter(message.voice.ssml)
                }
            };
        }

        // text message
        if (message && message.text) {
            let { text } = message;

            if (req && req._anonymizedText) {
                text = req._anonymizedText;
            }

            return {
                ...payload,
                message: {
                    ...message,
                    text: filter(text)
                }
            };
        }

        // button message
        if (message && message.attachment
            && message.attachment.type === 'template'
            && message.attachment.payload
            && message.attachment.payload.text) {

            return {
                ...payload,
                message: {
                    ...message,
                    attachment: {
                        ...message.attachment,
                        payload: {
                            ...message.attachment.payload,
                            text: filter(message.attachment.payload.text)
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
        let req;
        let previousResponse = null;
        while (this._queue.length > 0) {
            payload = this._queue.shift();

            let lastInQueueForNow = this._queue.length === 0;
            if (this._queue.length === 0
                && (this._sendLastMessageWithFinish
                    || this._intentsAndEntities.some((e) => e && e.type))) {
                await Promise.race([
                    this._anotherEventPromise,
                    this._finishedPromise
                ]);
                lastInQueueForNow = this._queue.length === 0;
                if (lastInQueueForNow) { // still last in queue - finished event came
                    req = await this._finishedPromise;
                }
            }

            if (payload.wait && !this.propagatesWaitEvent) {
                await this._wait(payload.wait);
            } else if (payload.wait) {
                const lastResponse = this.responses[this.responses.length - 1];
                if (lastResponse && lastResponse.sender_action) {
                    Object.assign(lastResponse, {
                        wait: payload.wait
                    });
                }
            } else {
                await this._enrichPayload(payload, req, lastInQueueForNow);
                this.responses.push(payload);
                previousResponse = await this._send(payload);
                this._results.push(previousResponse);
            }
        }
        this._isWorking = false;
    }

    async _enrichPayload (payload, req, lastInQueueForNow) {
        if (lastInQueueForNow && req && this._intentsAndEntities.length !== 0) {
            const { phrases } = this._sendLastMessageWithFinish
                ? await ai.ai.getPhrases(req)
                : { phrases: new Map() };

            const phrasesSet = new Set();
            const entities = [];
            let input = null;

            this._intentsAndEntities
                .forEach((aiObj) => {
                    // expected input
                    if (aiObj && aiObj.type) {
                        input = aiObj;
                        return;
                    }
                    if (!this._sendLastMessageWithFinish) {
                        return;
                    }
                    if (aiObj.startsWith('@')) {
                        entities.push(aiObj);
                    }
                    const keywords = phrases.get(aiObj) || [];
                    keywords.forEach((kw) => {
                        phrasesSet.add(kw);
                    });
                });

            Object.assign(payload, {
                expected: {
                    entities,
                    phrases: Array.from(phrasesSet)
                }
            });
            if (input) {
                Object.assign(payload.expected, {
                    input
                });
            }
        }
    }

    visitedInteraction (action) {
        this._visitedInteractions.push(action);
    }

    /**
     *
     * @param {Buffer} data
     * @param {string} contentType
     * @param {string} fileName
     * @returns {Promise<UploadResult>}
     */
    async upload (data, contentType, fileName) { // eslint-disable-line no-unused-vars
        throw new Error('#upload() not supported by this channel');
    }

    send (payload) {
        if (this._finished) {
            throw new Error('Cannot send message after sender is finished');
        }
        if (payload.tracking) {
            // collect events
            if (Array.isArray(payload.tracking.events)) {
                this._tracking.events.push(...payload.tracking.events);
            }
            return;
        }
        if (Array.isArray(payload.expectedIntentsAndEntities)) {
            this._intentsAndEntities.push(...payload.expectedIntentsAndEntities);
            return;
        }

        this._queue.push(payload);
        this._gotAnotherEvent();

        if (this._catchedBeforeFinish) {
            return;
        }

        if (!this._isWorking) {
            const promise = this._promise || new Promise((r) => process.nextTick(r));

            this._promise = promise
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
                ...(res && res.senderMeta),
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

    /**
     *
     * @param {Request} [req]
     * @param {Responder} [res]
     * @param {Error} [err]
     * @param {Function} [reportError]
     * @returns {Promise<Object>}
     */
    // eslint-disable-next-line no-console
    async finished (req = null, res = null, err = null, reportError = console.error) {
        this._finish(req);
        const meta = this._createMeta(req, res);
        const confidentInput = req && req.isConfidentInput();
        let error = err;
        try {
            await this._promise;
        } catch (e) {
            error = e;
        }

        if (!error) {
            error = this._catchedBeforeFinish;
        }

        try {
            const sent = this.responses.map((s) => this._filterMessage(s));
            const processedEvent = req
                ? req.event
                : this._incommingMessage;
            let incomming = this._filterMessage(processedEvent, confidentInput, req);

            if (processedEvent !== this._incommingMessage) {
                incomming = {
                    ...incomming,
                    original_event: this._incommingMessage
                };
            }

            if (!this._logger || meta.flag === FLAG_DO_NOT_LOG) {
                // noop
            } else if (error) {
                await Promise.resolve(this._logger
                    .error(error, this._senderId, sent, incomming, meta));
            } else if (this._sendLogs) {
                this._sendLogs = false;
                await Promise.resolve(this._logger
                    .log(this._senderId, sent, incomming, meta));
            }
        } catch (e) {
            await Promise.resolve(reportError(e, this._incommingMessage, this._senderId));
        }

        if (error) {
            // @ts-ignore
            const { code = 500, message } = error;
            await Promise.resolve(reportError(error, this._incommingMessage, this._senderId));
            return { status: code, error: message, results: this.results };
        }

        const somethingSent = this._results.length > 0;

        return {
            status: somethingSent ? 200 : 204,
            results: this._results
        };
    }

}

module.exports = ReturnSender;
