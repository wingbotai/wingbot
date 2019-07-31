/**
 * @author David Menger
 */
'use strict';

const apiAuthorizer = require('./apiAuthorizer');

/**
 * @typedef {Object} ConversationsAPI
 * @typedef {Function} conversations
 * @typedef {Function} conversation
 */

/**
 * @typedef {Object} StateStorage
 * @prop {Function} getStates
 * @prop {Function} getState
 */

/**
 * @typedef {Object} Notifications
 * @prop {Function} getSubscribtions
 */

/**
 * @typedef {Object} ChatLogStorage
 * @prop {Function} getInteractions
 */

/**
 * Create a conversations API
 * for retrieving conversations and it's history
 *
 * @param {StateStorage} stateStorage
 * @param {ChatLogStorage} chatLogStorage
 * @param {Notifications} notifications
 * @param {string[]|Function} [acl] - limit api to array of groups or use auth function
 * @returns {ConversationsAPI}
 */
function conversationsApi (stateStorage, chatLogStorage = null, notifications = null, acl = null) {

    async function history (args) {
        if (!chatLogStorage || typeof chatLogStorage.getInteractions !== 'function') {
            return null;
        }
        const { limit, startTimestamp, endTimestamp } = args;
        const { pageId, senderId } = this;

        const data = await chatLogStorage
            .getInteractions(senderId, pageId, limit, endTimestamp, startTimestamp);

        return data;
    }

    async function subscribtions () {
        if (!notifications || typeof notifications.getSubscribtions !== 'function') {
            return null;
        }
        const { pageId, senderId } = this;
        return notifications.getSubscribtions(senderId, pageId);
    }

    function mapState (d) {

        return Object.assign({}, d, {
            lastInteraction: typeof d.lastInteraction === 'object'
                && d.lastInteraction
                && typeof d.lastInteraction === 'function'
                ? d.lastInteraction.toISOString()
                : d.lastInteraction,
            history,
            subscribtions
        });
    }

    return {
        async conversations (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            if (typeof stateStorage.getStates !== 'function') {
                return null;
            }

            const {
                limit,
                lastKey,
                condition
            } = args;

            const { data, lastKey: nextKey } = await stateStorage
                .getStates(condition || {}, limit, lastKey);

            return {
                data: data.map(mapState),
                lastKey: nextKey
            };

        },
        async conversation (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            if (typeof stateStorage.getState !== 'function') {
                return null;
            }

            const {
                pageId,
                senderId
            } = args;

            const state = await stateStorage.getState(senderId, pageId);

            if (!state) {
                return null;
            }
            return mapState(state);
        }
    };
}

module.exports = conversationsApi;
