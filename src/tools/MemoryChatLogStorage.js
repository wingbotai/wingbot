/**
 * @author David Menger
 */
'use strict';

/**
 * @class MemoryChatLogStorage
 */
class MemoryChatLogStorage {

    constructor () {
        this._logs = new Map();
    }

    /**
     * Interate history
     * all limits are inclusive
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {number} [limit]
     * @param {number} [endAt] - iterate backwards to history
     * @param {number} [startAt] - iterate forward to last interaction
     * @returns {Promise<object[]>}
     */
    async getInteractions (senderId, pageId, limit = 10, endAt = null, startAt = null) { // eslint-disable-line max-len,no-unused-vars
        const events = this._getEvents(senderId);
        return events.slice(-limit);
    }

    /**
     *
     * @param {string} senderId
     * @returns {object[]}
     */
    _getEvents (senderId) {
        let events = this._logs.get(senderId);
        if (!events) {
            events = [];
            this._logs.set(senderId, events);
        }
        return events;
    }

    /**
     * Log single event
     *
     * @param {string} senderId
     * @param {object[]} responses - list of sent responses
     * @param {object} request - event request
     * @param {object} [metadata] - request metadata
     * @returns {void}
     */
    log (senderId, responses = [], request = {}, metadata = {}) {
        const events = this._getEvents(senderId);
        events.push({
            senderId,
            request,
            responses,
            ...metadata
        });
    }

    error (error, senderId, sent, incomming, meta) {
        return this.log(senderId, sent, incomming, { ...meta, error });
    }

}

module.exports = MemoryChatLogStorage;
