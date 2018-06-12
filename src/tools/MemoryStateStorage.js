/*
 * @author David Menger
 */
'use strict';


/**
 * @typedef {Object} State
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {Object} state
 */

/**
 * Memory conversation state storage for testing purposes
 *
 * @class
 */
class MemoryStateStorage {

    constructor () {
        this.store = new Map();
    }

    _key (senderId, pageId) {
        return `${senderId}|${pageId}`;
    }

    getStateSync (senderId, pageId) {
        const key = this._key(senderId, pageId);
        if (this.store.has(key)) {
            return this.store.get(key);
        }
        return null;
    }

    getOrCreateStateSync (senderId, pageId, defaultState = {}) {
        let state = this.getStateSync(senderId, pageId);
        if (!state) {
            state = {
                senderId,
                pageId,
                state: defaultState
            };
            this.saveState(state);
        }
        return state;
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<State|null>}
     */
    async getState (senderId, pageId) {
        return this.getStateSync(senderId, pageId);
    }

    /**
     *
     * @param {string} senderId - sender identifier
     * @param {string} pageId - page or channel identifier
     * @param {Object} defaultState - default state of the conversation
     * @param {number} lockTimeout - duration of lock
     * @returns {Promise.<State>} - conversation state
     */
    async getOrCreateAndLock (senderId, pageId, defaultState = {}, lockTimeout = 300) { // eslint-disable-line no-unused-vars,max-len
        return this.getOrCreateStateSync(senderId, pageId, defaultState);
    }

    /**
     *
     * @param {Object} state - conversation state
     * @returns {Promise}
     */
    saveState (state) {
        const { senderId, pageId } = state;
        this.store.set(this._key(senderId, pageId), state);
        return Promise.resolve(state);
    }

}

module.exports = MemoryStateStorage;
