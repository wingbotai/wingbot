/**
 * @author David Menger
 */
'use strict';

const uuid = require('uuid/v4');

/**
 * @typedef Tag {Object}
 * @prop {string} tag
 * @prop {number} subscribtions
 */

/**
 * @typedef Target {Object}
 * @prop {string} senderId
 * @prop {string} pageId
 */

/**
 * @typedef Subscribtion {Object}
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {string[]} subs
 */

/**
 * @typedef Campaign {object}
 * @prop {string} id
 * @prop {string} name
 *
 * Tatgeting
 *
 * @prop {string[]} include
 * @prop {string[]} exclude
 * @prop {string} pageId
 *
 * Stats
 *
 * @prop {number} sent
 * @prop {number} failed
 * @prop {number} delivery
 * @prop {number} read
 * @prop {number} notSent
 * @prop {number} leaved
 * @prop {number} queued
 *
 * Interaction
 *
 * @prop {string} action
 * @prop {object} [data]
 *
 * Setup
 *
 * @prop {boolean} sliding
 * @prop {number} slide
 * @prop {boolean} active
 * @prop {boolean} in24hourWindow
 * @prop {boolean} allowRepeat
 * @prop {number} startAt
 * @prop {number} slideRound
 */

/**
 * @typedef Task {Object}
 * @prop {string} id
 * @prop {string} pageId
 * @prop {string} senderId
 * @prop {string} campaignId
 * @prop {number} enqueue
 * @prop {number} [read]
 * @prop {number} [delivery]
 * @prop {number} [sent]
 * @prop {number} [insEnqueue]
 * @prop {boolean} [reaction] - user reacted
 * @prop {number} [leaved] - time the event was not sent because user left
 */

const MAX_TS = 9999999999999;

class NotificationsStorage {

    constructor () {
        /**
         * @type {Task[]}
         */
        this._tasks = [];

        /**
         * @type {Map<string,Campaign>}
         */
        this._campaigns = new Map();

        /**
         * @type {Map<string,Subscribtion>}
         */
        this._subscribtions = new Map();
    }

    /**
     *
     * @param {object} tasks
     * @returns {Promise<Task[]>}
     */
    pushTasks (tasks) {

        // upsert through unique KEY (only single sliding campaign in queue)
        // [campaignId,senderId,pageId,sent]
        // maybe without unique key at dynamodb

        const ret = [];

        this._tasks = this._tasks
            .map((task) => {
                const overrideIndex = tasks
                    .findIndex((t) => t.campaignId === task.campaignId
                            && t.pageId === task.pageId
                            && t.senderId === task.senderId
                            && t.sent === task.sent);

                if (overrideIndex === -1) {
                    return task;
                }

                let [override] = tasks.splice(overrideIndex, 1);
                override = {
                    ...task,
                    ...override,
                    insEnqueue: Math.min(task.insEnqueue, override.enqueue),
                    enqueue: override.enqueue === task.insEnqueue && task.insEnqueue !== MAX_TS
                        ? task.insEnqueue + 1 : override.enqueue
                };
                ret.push(override);
                return override;
            });

        const insert = tasks.map((t) => ({
            ...t,
            id: uuid(),
            insEnqueue: t.enqueue
        }));

        ret.push(...insert);
        this._tasks.push(...insert);

        this._tasks.sort((a, b) => a.enqueue - b.enqueue);
        return Promise.resolve(ret);
    }

    popTasks (limit, until = Date.now()) {
        const pop = [];
        this._tasks = this._tasks
            .map((task) => {
                if (task.enqueue <= until && pop.length < limit) {
                    const upTask = {
                        ...task,
                        enqueue: MAX_TS,
                        insEnqueue: MAX_TS
                    };
                    pop.push(upTask);
                    return upTask;
                }
                return task;
            });
        return Promise.resolve(pop);
    }

    /**
     *
     * @param {string} taskId
     * @param {object} data
     */
    updateTask (taskId, data) {
        let ret = null;
        this._tasks = this._tasks
            .map((task) => {
                if (task.id !== taskId) {
                    return task;
                }
                ret = { ...task, ...data };
                return ret;
            });
        return Promise.resolve(ret);
    }

    /**
     * Get last sent task from campaign
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {string} campaignId
     * @returns {Promise<Task|null>}
     */
    getSentTask (pageId, senderId, campaignId) {
        const task = this._tasks.find((t) => t.sent
            && t.pageId === pageId
            && t.senderId === senderId
            && t.campaignId === campaignId);

        return Promise.resolve(task);
    }

    /**
     *
     * @param {string} campaignId
     * @param {boolean} [sentWithoutReaction]
     * @param {string} [pageId]
     */
    getUnsuccessfulSubscribersByCampaign (campaignId, sentWithoutReaction = false, pageId = null) {
        let tasks;
        if (sentWithoutReaction) {
            tasks = this._tasks.filter((t) => t.campaignId === campaignId
                && t.leaved === null && t.reaction === false);
        } else {
            tasks = this._tasks.filter((t) => t.campaignId === campaignId && t.leaved > 0);
        }
        if (pageId) {
            tasks = tasks.filter((t) => t.pageId === pageId);
        }
        return Promise.resolve(tasks.map(({ senderId, pageId: p }) => ({ senderId, pageId: p })));
    }

    /**
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {string[]} checkCampaignIds
     * @returns {Promise<string[]>}
     */
    getSentCampagnIds (pageId, senderId, checkCampaignIds) {
        const res = this._tasks
            .filter((t) => t.sent
                && t.pageId === pageId
                && t.senderId === senderId
                && checkCampaignIds.includes(t.campaignId))
            .map((t) => t.campaignId);

        return Promise.resolve(res);
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {number} watermark
     * @param {('read'|'delivery')} eventType
     * @param {number} ts
     * @returns {Promise<Task[]>}
     */
    updateTasksByWatermark (senderId, pageId, watermark, eventType, ts = Date.now()) {
        const updated = [];
        this._tasks = this._tasks
            .map((task) => {
                if (task.senderId !== senderId
                        || task.pageId !== pageId
                        || !task.sent
                        || task[eventType]
                        || task.sent > watermark) {
                    return task;
                }
                const upTask = { ...task, [eventType]: ts };
                updated.push(upTask);
                return upTask;
            });

        return Promise.resolve(updated);
    }

    /**
     *
     * @param {object} campaign
     * @param {object} [updateCampaign]
     * @returns {Promise<Campaign>}
     */
    async upsertCampaign (campaign, updateCampaign = null) {
        let insert = campaign;
        if (!insert.id) {
            insert = { ...insert, id: uuid() };
        }
        if (!this._campaigns.has(insert.id)) {
            if (updateCampaign) Object.assign(insert, updateCampaign);
            this._campaigns.set(insert.id, insert);
        } else {
            insert = this._campaigns.get(insert.id);
            if (updateCampaign) {
                insert = { ...insert, ...updateCampaign };
                this._campaigns.set(insert.id, insert);
            }
        }
        return Promise.resolve(insert);
    }

    /**
     *
     * @param {string} campaignId
     * @returns {Promise}
     */
    removeCampaign (campaignId) {
        if (this._campaigns.has(campaignId)) {
            this._campaigns.delete(campaignId);
        }
        return Promise.resolve();
    }

    /**
     *
     * @param {string} campaignId
     * @param {object} increment
     * @returns {Promise}
     */
    incrementCampaign (campaignId, increment = {}) {
        let campaign = this._campaigns.get(campaignId) || null;
        if (campaign !== null) {
            campaign = { ...campaign };
            Object.keys(increment)
                .forEach((key) => {
                    campaign[key] = (campaign[key] || 0) + increment[key];
                });
            this._campaigns.set(campaignId, campaign);
        }
        return Promise.resolve();
    }

    /**
     *
     * @param {string} campaignId
     * @param {object} data
     * @returns {Promise<Campaign|null>}
     */
    updateCampaign (campaignId, data) {
        let ret = this._campaigns.get(campaignId) || null;
        if (ret !== null) {
            ret = { ...ret, ...data };
            this._campaigns.set(campaignId, ret);
        }
        return Promise.resolve(ret);
    }

    /**
     *
     * @param {string} campaignId
     * @returns {Promise<null|Campaign>}
     */
    getCampaignById (campaignId) {
        const ret = this._campaigns.get(campaignId) || null;
        return Promise.resolve(ret);
    }

    /**
     *
     * @param {string[]} campaignIds
     * @returns {Promise<Campaign[]>}
     */
    getCampaignByIds (campaignIds) {
        const campaigns = Array.from(this._campaigns.values())
            .filter((c) => campaignIds.includes(c.id));

        return Promise.resolve(campaigns);
    }

    /**
     *
     * @param {number} [now]
     * @returns {Promise<Campaign|null>}
     */
    popCampaign (now = Date.now()) {
        let campaign = null;

        for (const camp of this._campaigns.values()) {
            if (camp.active && camp.startAt && camp.startAt <= now) {
                campaign = camp;
                this._campaigns.set(campaign.id, { ...camp, startAt: null });
                break;
            }
        }

        return Promise.resolve(campaign);
    }

    /**
     *
     * @param {object} condition
     * @param {number} [limit]
     * @param {object} [lastKey]
     * @returns {Promise<{data:Campaign[],lastKey:string}>}
     */
    getCampaigns (condition, limit = null, lastKey = null) {
        let reachedKey = lastKey === null;
        let filtered = 0;
        let hasNext = false;

        const key = lastKey !== null
            ? JSON.parse(Buffer.from(lastKey, 'base64').toString('utf8'))
            : null;

        const conditionKeys = Object.keys(condition);
        const data = Array.from(this._campaigns.values())
            .filter((campaign) => {

                const matches = conditionKeys
                    .every((k) => campaign[k] === condition[k]);

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

                reachedKey = key.id === campaign.id;

                return false;
            });

        let nextLastKey = null;

        if (limit && hasNext) {
            const last = data[data.length - 1];
            nextLastKey = Buffer.from(JSON.stringify({
                id: last.id
            })).toString('base64');
        }

        return Promise.resolve({ data, lastKey: nextLastKey });
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {string} tag
     * @returns {Promise}
     */
    subscribe (senderId, pageId, tag) {
        const key = `${senderId}|${pageId}`;
        let subscribtion = this._subscribtions.get(key);
        if (!subscribtion) {
            subscribtion = {
                senderId,
                pageId,
                subs: []
            };
        }
        if (!subscribtion.subs.includes(tag)) {
            subscribtion = { ...subscribtion, subs: [...subscribtion.subs, tag] };
        }

        this._subscribtions.set(key, subscribtion);
        return Promise.resolve();
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {string} [tag]
     * @returns {Promise<string[]>}
     */
    unsubscribe (senderId, pageId, tag = null) {
        const key = `${senderId}|${pageId}`;
        if (!this._subscribtions.has(key)) {
            return Promise.resolve([]);
        }
        const unsubscribtions = [];
        let subscribtion = this._subscribtions.get(key);
        subscribtion = {
            ...subscribtion,
            subs: subscribtion.subs
                .filter((sub) => {
                    const out = tag === null || sub === tag;
                    if (out) {
                        unsubscribtions.push(sub);
                    }
                    return !out;
                })
        };
        if (subscribtion.subs.length === 0) {
            this._subscribtions.delete(key);
        } else {
            this._subscribtions.set(key, subscribtion);
        }
        return Promise.resolve(unsubscribtions);
    }

    /**
     *
     * @param {string[]} include
     * @param {string[]} exclude
     * @param {string} [pageId]
     * @returns {Promise<number>}
     */
    getSubscribtionsCount (include, exclude, pageId = null) {
        // let's make this simple

        const filtered = Array.from(this._subscribtions.values())
            .filter((sub) => {
                const subMatches = (pageId === null || sub.pageId === pageId)
                    && (include.length === 0 || sub.subs.some((s) => include.includes(s)))
                    && !sub.subs.some((s) => exclude.includes(s));

                return subMatches;
            });

        return Promise.resolve(filtered.length);
    }

    /**
     *
     * @param {string[]} include
     * @param {string[]} exclude
     * @param {number} limit
     * @param {string} [pageId]
     * @param {*} lastKey
     * @returns {Promise<{data: Target[], lastKey: string }>}
     */
    getSubscribtions (include, exclude, limit, pageId = null, lastKey = null) {
        let keyReached = lastKey === null;
        let found = 0;
        let hasNext;

        const key = lastKey !== null
            ? JSON.parse(Buffer.from(lastKey, 'base64').toString('utf8'))
            : null;

        const ret = Array.from(this._subscribtions.values())
            .filter((sub) => {
                const subMatches = (pageId === null || sub.pageId === pageId)
                    && (include.length === 0 || sub.subs.some((s) => include.includes(s)))
                    && !sub.subs.some((s) => exclude.includes(s));

                if (!subMatches) {
                    return false;
                }

                if (keyReached && found < limit) {
                    found++;
                    return true;
                }
                if (keyReached && found === limit) {
                    hasNext = true;
                }

                keyReached = keyReached
                    || (key.pageId === sub.pageId && key.senderId === sub.senderId);

                return false;
            });

        const data = ret.map((sub) => ({
            senderId: sub.senderId,
            pageId: sub.pageId
        }));

        let nextLastKey = null;

        if (hasNext) {
            const last = data[data.length - 1];
            nextLastKey = Buffer.from(JSON.stringify({
                pageId: last.pageId,
                senderId: last.senderId
            })).toString('base64');
        }

        return Promise.resolve({ data, lastKey: nextLastKey });
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<string[]>}
     */
    getSenderSubscribtions (senderId, pageId) {
        const key = `${senderId}|${pageId}`;

        if (!this._subscribtions.has(key)) {
            return Promise.resolve([]);
        }

        const sub = this._subscribtions.get(key);

        return Promise.resolve(sub.subs);
    }

    /**
     *
     * @param {string} [pageId]
     * @returns {Promise<Tag[]>}
     */
    getTags (pageId = null) {
        /** @type Map<string,Tag> */
        const res = new Map();

        this._subscribtions.forEach((subscribtion) => {
            if (pageId && subscribtion.pageId !== pageId) {
                return;
            }
            subscribtion.subs.forEach((sub) => {
                if (!res.has(sub)) {
                    res.set(sub, { tag: sub, subscribtions: 1 });
                } else {
                    res.get(sub).subscribtions++;
                }
            });
        });

        const tags = Array.from(res.values());

        tags.sort((a, b) => b.subscribtions - a.subscribtions);

        return Promise.resolve(tags);
    }

}

module.exports = NotificationsStorage;
