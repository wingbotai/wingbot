/*
 * @author David Menger
 */
'use strict';

/**
 * Memory conversation state storage for testing purposes
 *
 * @class
 */
class MemoryStateStorage {

    constructor () {
        this.store = new Map();
    }

    getState (senderId, defaultState = {}) {
        if (this.store.has(senderId)) {
            return this.store.get(senderId);
        }
        const state = {
            senderId,
            state: defaultState
        };
        this.saveState(state);
        return state;
    }

    /**
     *
     * @param {any} senderId - sender identifier
     * @param {Object} defaultState - default state of the conversation
     * @param {number} lockTimeout - duration of lock
     * @returns {Promise.<Object>} - conversation state
     */
    getOrCreateAndLock (senderId, defaultState = {}, lockTimeout = 300) { // eslint-disable-line no-unused-vars,max-len
        const state = this.getState(senderId, defaultState);
        return Promise.resolve(state);
    }

    /**
     *
     * @param {Object} state - conversation state
     * @returns {Promise}
     */
    saveState (state) {
        this.store.set(state.senderId, state);
        return Promise.resolve(state);
    }

}

module.exports = MemoryStateStorage;
