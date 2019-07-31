/*
 * @author David Menger
 */
'use strict';

const ai = require('./Ai');

class ReturnSender {

    /**
     *
     * @param {Object} options
     * @param {string} userId
     * @param {Object} incommingMessage
     * @param {console} logger - console like logger
     */
    constructor (options, userId, incommingMessage, logger = null) {
        this._queue = [];
        this._sent = [];
        this._responses = [];

        this._promise = Promise.resolve();

        this._isWorking = false;

        this._sendLogs = logger !== null;

        this._userId = userId;

        this._incommingMessage = incommingMessage;

        this._logger = logger;

        this._sequence = 0;

        this._finished = false;
        this._catchedBeforeFinish = null;

        this.waits = false;

        this.simulatesOptIn = false;
        this.simulateFail = false;

        this._simulateStateChange = null;
        this._simulateStateChangeOnLoad = null;
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
        if (!this.waits) {
            return Promise.resolve();
        }
        return new Promise(r => setTimeout(r, wait));
    }

    async _work () {
        this._isWorking = true;
        let payload;
        let previousResponse = null;
        while (this._queue.length > 0) {
            payload = this._queue.shift();

            if (payload.wait) {
                await this._wait(payload.wait);
            } else {
                this._sent.push(payload);
                previousResponse = await this._send(payload);
                this._responses.push(previousResponse);
            }
        }
        this._isWorking = false;
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
     * @returns {Promise<Object|null>}
     */
    modifyStateAfterLoad () {
        return Promise.resolve(this._simulateStateChangeOnLoad);
    }

    /**
     * @returns {Promise<Object|null>}
     */
    modifyStateBeforeStore () {
        return Promise.resolve(this._simulateStateChange);
    }

    /**
     * @private
     * @param {import('./Request')} req
     * @param {import('./Responder')} res
     */
    _createMeta (req = null, res = null) { // eslint-disable-line no-unused-vars
        const meta = {};

        if (req) {
            const expected = req.expected();
            Object.assign(meta, {
                timestamp: req.timestamp,
                text: req.text(),
                intent: req.intent(ai.ai.confidence),
                intents: req.intents || [],
                entities: (req.entities || []).filter(e => e.score >= ai.ai.confidence),
                action: req.action(),
                data: req.action(true),
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

        try {
            await this._promise;

            if (this._catchedBeforeFinish) {
                throw this._catchedBeforeFinish;
            }

            if (this._sendLogs) {
                this._sendLogs = false;
                await Promise.resolve(this._logger
                    .log(this._userId, this._sent, this._incommingMessage, meta));
            }

            const somethingSent = this._responses.length > 0;

            return {
                status: somethingSent ? 200 : 204,
                responses: this._responses
            };
        } catch (e) {
            if (this._logger) {
                await Promise.resolve(this._logger
                    .error(e, this._userId, this._sent, this._incommingMessage, meta));
            } else {
                console.error(e, this._userId, this._sent, this._incommingMessage); // eslint-disable-line
            }
            return {
                status: e.code || 500,
                responses: this._responses
            };
        }
    }

}

module.exports = ReturnSender;
