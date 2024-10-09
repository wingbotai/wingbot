/**
 * @author David Menger
 */
'use strict';

const apiAuthorizer = require('./apiAuthorizer');
const { apiTextOutputFilter, mapObject, defaultMapperFactory } = require('../utils/deepMapTools');

/** @typedef {import('../utils/deepMapTools').Mapper} Mapper */
/** @typedef {import('../notifications/Notifications')} Notifications */

/**
 * @typedef {object} ConversationsAPI
 * @typedef {Function} conversations
 * @typedef {Function} conversation
 */

/**
 * @typedef {object} StateStorage
 * @prop {Function} getStates
 * @prop {Function} getState
 */

/**
 * @typedef {object} ChatLogStorage
 * @prop {Function} getInteractions
 */

/**
 * Function for filtration of string output
 *
 * @callback TextFilter
 * @param {string} value
 * @param {string} key
 * @returns {any}
 */

/**
 * Create a conversations API
 * for retrieving conversations and it's history
 *
 * @param {StateStorage} stateStorage
 * @param {ChatLogStorage} chatLogStorage
 * @param {Notifications} notifications
 * @param {string[]|Function} [acl] - limit api to array of groups or use auth function
 * @param {object} options
 * @param {TextFilter} [options.stateTextFilter] - optional funcion for filtering data in states
 * @param {Mapper} [options.mapper] - mapper for state values
 * @returns {ConversationsAPI}
 * @example
 * const { GraphApi, conversationsApi } = require('wingbot');
 * const BOT_UPDATE_GROUPS = ['botEditor', 'botAdmin', 'botUser'];
 *
 * function stateTextFilter (value, key) {
 *     if (key === 'credentials.password') {
 *         return '****';
 *     }
 *     return value;
 * }
 *
 * const api = new GraphApi([
 *     conversationsApi(
 *         stateStorage, chatLogStorage, notifications, BOT_UPDATE_GROUPS,
 *         { stateTextFilter }
 *     )
 * ], {
 *     token: 'my-secret-token'
 * });
 */
function conversationsApi (
    stateStorage,
    chatLogStorage = null,
    notifications = null,
    acl = null,
    options = {}
) {

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

    async function subscriptions () {
        const { pageId, senderId } = this;

        if (!notifications) {
            return null;
        }

        if (typeof notifications.getSubscriptions === 'function') {
            return notifications.getSubscriptions(senderId, pageId);
        }

        if (typeof notifications.getSubscribtions === 'function') {
            const sups = await notifications.getSubscribtions(senderId, pageId);
            return sups.map((s) => ({
                tag: s,
                meta: {}
            }));
        }

        return null;
    }

    async function subscribtions () {
        if (!notifications || typeof notifications.getSubscribtions !== 'function') {
            return null;
        }
        const { pageId, senderId } = this;
        return notifications.getSubscribtions(senderId, pageId);
    }

    let mapState;
    if (options.stateTextFilter) {
        mapState = (d) => ({
            ...d,
            state: apiTextOutputFilter(d.state, options.stateTextFilter),
            lastInteraction: d.lastInteraction || (new Date(0)),
            history,
            subscribtions,
            subscriptions
        });
    } else if (options.mapper) {
        mapState = (d) => ({
            ...mapObject(d, defaultMapperFactory(options.mapper)),
            lastInteraction: d.lastInteraction || (new Date(0)),
            history,
            subscribtions,
            subscriptions
        });
    } else {
        mapState = (d) => ({
            ...d,
            lastInteraction: d.lastInteraction || (new Date(0)),
            history,
            subscribtions,
            subscriptions
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

            await ctx.audit('conversations', args);

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

            await ctx.audit('conversation', args);

            const state = await stateStorage.getState(senderId, pageId);

            if (!state) {
                return null;
            }
            return mapState(state);
        },
        async flaggedInteractions (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            if (!chatLogStorage || typeof chatLogStorage.getInteractions !== 'function') {
                return null;
            }

            const {
                limit,
                startTimestamp,
                flag = null
            } = args;

            const data = await chatLogStorage
                .getInteractions(flag, null, limit, null, startTimestamp);

            return data;
        }
    };
}

module.exports = conversationsApi;
