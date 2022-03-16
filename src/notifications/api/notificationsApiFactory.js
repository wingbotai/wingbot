/*
 * @author David Menger
 */
'use strict';

const apiAuthorizer = require('../../graphApi/apiAuthorizer');

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

            // make it little bit faster
            while (senderIds.length > 0) {
                await Promise.all(
                    senderIds.splice(0, 5)
                        .map((senderId) => storage.subscribe(`${senderId}`, pageId, tag))
                );
            }

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
