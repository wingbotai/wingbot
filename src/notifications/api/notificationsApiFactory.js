/*
 * @author David Menger
 */
'use strict';

const { infoToProjection } = require('graphql-mongodb-projection');
const apiAuthorizer = require('../../graphApi/apiAuthorizer');

function notificationsApiFactory (storage, notifications, acl) {
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
            const options = { ...args.campaign };

            delete options.name;
            delete options.action;
            delete options.data;

            const parsedData = JSON.parse(data);
            return notifications.createCampaign(name, action, parsedData, options);
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

            const data = await storage.getUnsuccessfulSubscribersByCampaign(
                campaignId, sentWithoutReaction, pageId
            );

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

            const fields = infoToProjection(info);

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
                const res = storage.getSubscribtions(include, exclude, limit, pageId, lastKey);
                return Object.assign(res, { count });
            }

            return { count };
        },

        async subscribeUsers (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            const {
                senderIds,
                pageId,
                tag
            } = args;

            for (const senderId of senderIds) {
                await storage.subscribe(`${senderId}`, pageId, tag);
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
