/*
 * @author David Menger
 */
'use strict';

/**
 * @typedef {object} State
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {object} state
 */

/**
 * @typedef {object} StateCondition
 * @prop {string} [search]
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
     * @param {object} defaultState - default state of the conversation
     * @param {number} lockTimeout - duration of lock
     * @returns {Promise.<State>} - conversation state
     */
    async getOrCreateAndLock (senderId, pageId, defaultState = {}, lockTimeout = 300) { // eslint-disable-line no-unused-vars,max-len
        return this.getOrCreateStateSync(senderId, pageId, defaultState);
    }

    /**
     *
     * @param {object} state - conversation state
     * @returns {Promise}
     */
    saveState (state) {
        const { senderId, pageId } = state;
        this.store.set(this._key(senderId, pageId), state);
        return Promise.resolve(state);
    }

    /**
     *
     * @param {StateCondition} condition
     * @param {number} limit
     * @param {string} lastKey
     * @returns {Promise<{data:State[],lastKey:string}>}
     */
    getStates (condition = {}, limit = 20, lastKey = null) {
        let reachedKey = lastKey === null;
        let filtered = 0;
        let hasNext = false;

        const key = lastKey !== null
            ? JSON.parse(Buffer.from(lastKey, 'base64').toString('utf8'))
            : null;

        const data = Array.from(this.store.values())
            .sort((a, b) => {
                if (a.lastInteraction === b.lastInteraction) {
                    return 0;
                }
                return a.lastInteraction > b.lastInteraction
                    ? -1
                    : 1;
            })
            .filter((state) => {
                // const matches = conditionKeys
                //     .every(k => state[k] === condition[k]);

                const matches = !condition.search
                    || condition.search === state.senderId;

                if (!matches) {
                    return false;
                }

                if (limit !== null && filtered >= limit) {
                    hasNext = true;
                    return false;
                }

                if (reachedKey) {
                    filtered++;
                    return true;
                }

                reachedKey = key.senderId === state.senderId
                    && key.pageId === state.pageId;

                return false;
            });

        let nextLastKey = null;

        if (limit && hasNext) {
            const last = data[data.length - 1];
            nextLastKey = Buffer.from(JSON.stringify({
                senderId: last.senderId,
                pageId: last.pageId
            })).toString('base64');
        }

        return Promise.resolve({ data, lastKey: nextLastKey });
    }

}

module.exports = MemoryStateStorage;
