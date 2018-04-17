/*
 * @author David Menger
 */
'use strict';

class ReturnSender {

    /**
     *
     * @param {Object} options
     * @param {string} userId
     * @param {Object} incommingMessage
     * @param {console} logger - console like logger
     */
    constructor (options, userId, incommingMessage, logger = console) {
        this._queue = [];
        this._sent = [];
        this._responses = [];

        this._promise = Promise.resolve();

        this._isWorking = false;

        this._sendLogs = false;

        this._userId = userId;

        this._incommingMessage = incommingMessage;

        this._logger = logger;

        this._sequence = 0;

        this._finished = false;

        this.waits = false;

        this.simulatesOptIn = false;

        this._simulateStateChange = null;
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

        if (!this._isWorking) {
            this._promise = this._promise
                .then(() => this._work());
        }
    }

    /**
     * @returns {Promise<{senderId:string}|null>}
     */
    modifyStateBeforeStore () {
        return Promise.resolve(this._simulateStateChange);
    }

    finished () {
        this._finished = true;
        if (this._sendLogs) {
            this._sendLogs = true;
            this._logger.log(this._userId, this._sent, this._incommingMessage);
        }
        return this._promise
            .then(() => ({
                status: 200,
                responses: this._responses
            }))
            .catch(e => ({
                status: e.code || 500,
                responses: this._responses
            }));
    }

}

module.exports = ReturnSender;
