/*
 * @author David Menger
 */
'use strict';

const apiAuthorizer = require('../../graphApi/apiAuthorizer');

/** @typedef {import('../NotificationsStorage')} NotificationsStorage */
/** @typedef {import('../Notifications')} Notifications */

/**
 *
 * @param {*} info
 * @returns {object}
 */

function getFields (info) {
    if (info.fieldNodes) {
        const fieldNodes = info.fieldNodes.filter((k) => k.kind === 'Field');

        if (fieldNodes.length !== 1) {
            return {};
        }

        return getFields(fieldNodes[0]);
    }

    const nodes = info.selectionSet ? info.selectionSet.selections : info.fieldNodes;

    if (!info.selectionSet) {
        return true;
    }

    return nodes.reduce((o, fieldInfo) => {
        if (fieldInfo.kind !== 'Field' || !fieldInfo.name || !fieldInfo.name.value) {
            return o;
        }
        return Object.assign(o, {
            [fieldInfo.name.value]: getFields(fieldInfo)
        });
    }, {});
}

/**
 * @typedef {object} Target
 * @prop {string} senderId
 * @prop {string} pageId
 */

/**
 * @typedef {object} SubscriptionData
 * @prop {string} pageId
 * @prop {string} senderId
 * @prop {string[]} tags
 * @prop {boolean} [remove]
 * @prop {Object<string,object>} [meta]
 */

/**
 *
 * @callback PreprocessSubscribe
 * @param {SubscriptionData[]} subscriptions
 * @returns {Promise<SubscriptionData[]>}
 */

/**
 *
 * @callback PreprocessSubscriptions
 * @param {Target[]} subscriptions
 * @param {string} [pageId]
 * @returns {Promise<Target[]>|Target[]}
 */

/**
 *
 * @callback PreprocessSubscribers
 * @param {string[]} senderIds
 * @param {string} pageId
 * @param {string} tag
 * @returns {Promise<string[]>|string[]}
 */

/**
 * @typedef {object} NotificationsApiOptions
 * @prop {PreprocessSubscribe} [preprocessSubscribe]
 * @prop {PreprocessSubscriptions} [preprocessSubscriptions]
 * @prop {PreprocessSubscribers} [preprocessSubscribers]
 */

/**
 *
 * @param {NotificationsStorage} storage
 * @param {Notifications} notifications
 * @param {*} acl
 * @param {NotificationsApiOptions} options
 */
function notificationsApiFactory (storage, notifications, acl, options = {}) {
    return {
        async campaigns (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }
            const {
                limit,
                condition = {},
                lastKey
            } = args;

            return storage.getCampaigns(condition, limit, lastKey);
        },

        async createCampaign (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }
            const {
                name,
                action,
                data
            } = args.campaign;

            // other options
            const opts = { ...args.campaign };

            delete opts.name;
            delete opts.action;
            delete opts.data;

            const parsedData = JSON.parse(data);
            return notifications.createCampaign(name, action, parsedData, opts);
        },

        async runCampaign (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }
            const { campaignId } = args;

            let campaign = await storage.getCampaignById(campaignId);

            if (!campaign.active) {
                campaign = await storage.updateCampaign(campaignId, { active: true });
            }

            return notifications.runCampaign(campaign);
        },

        async updateCampaign (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }
            const {
                campaignId,
                update
            } = args;

            return storage.updateCampaign(campaignId, update);
        },

        async unsuccessfulSubscribers (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            const {
                campaignId,
                sentWithoutReaction,
                pageId
            } = args;

            if (!campaignId) {
                return {
                    data: [],
                    count: 0
                };
            }

            const data = await storage
                .getUnsuccessfulSubscribersByCampaign(campaignId, sentWithoutReaction, pageId);

            return {
                data,
                count: data.length
            };
        },

        async removeCampaign (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }
            const {
                campaignId
            } = args;

            await storage.removeCampaign(campaignId);

            return true;
        },

        async subscribtions (args, ctx, info) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            const fields = getFields(info);

            const {
                include,
                exclude,
                limit,
                pageId,
                lastKey
            } = args;

            let count;

            if (fields.count) {
                count = await storage.getSubscribtionsCount(include, exclude, pageId);
            }

            if (fields.data) {
                const res = await storage
                    .getSubscribtions(include, exclude, limit, pageId, lastKey);

                if (fields.data.meta && typeof options.preprocessSubscriptions === 'function') {
                    res.data = await Promise.resolve(
                        options.preprocessSubscriptions(res.data, pageId)
                    );
                }

                return Object.assign(res, { count });
            }

            return { count };
        },

        async subscribeUsers (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            const {
                pageId,
                tag
            } = args;

            let {
                senderIds
            } = args;

            if (typeof options.preprocessSubscribers === 'function') {
                senderIds = await Promise.resolve(
                    options.preprocessSubscribers(senderIds, pageId, tag)
                );
            }

            senderIds = senderIds.slice();

            // make it little bit faster
            while (senderIds.length > 0) {
                if (storage.subscribe.length > 3) {
                    const insertSenders = senderIds.splice(0, 500);
                    await storage.subscribe(insertSenders, pageId, tag, true);
                } else {
                    await storage.subscribe(senderIds.pop(), pageId, tag);
                }
            }

            return true;
        },

        /**
         * @typedef {object} SubscriptionData
         * @prop {string} pageId
         * @prop {string} senderId
         * @prop {string[]} tags
         * @prop {boolean} [remove]
         * @prop {Object<string,object>} [meta]
         */

        /**
         *
         * @param {{ subscriptions: SubscriptionData[] }} args
         * @param {*} ctx
         * @returns {Promise<boolean>}
         */
        async subscribeWithData (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            let { subscriptions } = args;

            if (typeof options.preprocessSubscribe === 'function') {
                subscriptions = await Promise.resolve(
                    options.preprocessSubscribe(subscriptions)
                );
            }

            await storage.batchSubscribe(subscriptions, true);
            return true;
        },

        async tags (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            const data = await storage.getTags(args.pageId);

            return {
                data,
                nextKey: null
            };
        },

        async campaign (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }
            return storage.getCampaignById(args.campaignId);
        }
    };
}

module.exports = notificationsApiFactory;
