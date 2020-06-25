/*
 * @author David Menger
 */
'use strict';

const { EventEmitter } = require('events');
const Request = require('../Request');
const NotificationsStorage = require('./NotificationsStorage');
const api = require('./api');
const customFn = require('../utils/customFn');

const DEFAULT_LIMIT = 20;
const DAY = 86400000;
const WINDOW_24_HOURS = DAY; // 24 hours
const REMOVED_CAMPAIGN = '<removed campaign>';
const MAX_TS = 9999999999999;
const DEFAULT_24_CLEARANCE = 600000; // ten minutes

const SUBSCRIBE = '_$subscribe';
const UNSUBSCRIBE = '_$unsubscribe';

const DEFAULT_CAMPAIGN_DATA = {
    sent: 0,
    failed: 0,
    delivery: 0,
    read: 0,
    notSent: 0,
    leaved: 0,
    queued: 0,
    positive: 0,
    negative: 0,
    startAt: null,
    sliding: false,
    slide: null,
    slideRound: null,
    allowRepeat: false,
    type: null,
    hasCondition: false,
    condition: null
};

/**
 * @typedef {object} CampaignTarget
 * @prop {string} senderId - sender identifier
 * @prop {string} pageId - page identifier
 * @prop {string} campaignId - campaign identifier
 * @prop {object} [data] - custom action data for specific target
 * @prop {number} [enqueue] - custom enqueue time, now will be used by default
 */

/**
 * @typedef Task {object}
 * @prop {string} id - task identifier
 * @prop {string} pageId - page identifier
 * @prop {string} senderId - user identifier
 * @prop {string} campaignId - campaign identifer
 * @prop {number} enqueue - when the task will be processed with queue
 * @prop {object} [data] - custom action data for specific target
 * @prop {number} [read] - time of read
 * @prop {number} [delivery] - time of delivery
 * @prop {number} [sent] - time of send
 * @prop {boolean} [reaction] - user reacted
 * @prop {number} [leaved] - time the event was not sent because user left
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
 * Experimental notifications service
 *
 * @class Notifications
 */
class Notifications extends EventEmitter {

    /**
     *
     * Creates a new instance on notification service
     *
     * @memberof Notifications
     *
     * @param {NotificationsStorage} notificationStorage
     * @param {object} options
     * @param {console} [options.log] - logger
     * @param {number} [options.default24Clearance] - use this clearance to ensure delivery in 24h
     * @param {string} [options.allAudienceTag] - tag to mark all users
     */
    constructor (notificationStorage = new NotificationsStorage(), options = {}) {
        super();

        this._storage = notificationStorage;
        this._log = options.log || console;
        this.limit = DEFAULT_LIMIT;
        this._default24Clearance = options.default24Clearance || DEFAULT_24_CLEARANCE;
        this._allAudienceTag = typeof options.allAudienceTag !== 'undefined'
            ? options.allAudienceTag
            : '#all';

        // ensure unique timestamps for messages
        this._lts = new Map();
    }

    /**
     * API Factory
     *
     * @memberof Notifications
     *
     * @param {string[]|Function} [acl] - limit api to array of groups or use auth function
     * @returns {object} - the graphql api object
     */
    api (acl = null) {
        return api(this._storage, this, acl);
    }

    /**
     * Upsert the campaign
     * If the campaing does not exists add new. Otherwise, update it.
     *
     * @param {string} name
     * @param {string} action
     * @param {object} [data]
     * @param {object} options - use { id: '...' } to make campaign accessible from code
     * @returns {Promise<Campaign>}
     */
    async createCampaign (
        name,
        action,
        data = {},
        options = {}
    ) {

        const campaign = {
            pageId: null
        };

        const update = {
            name,
            action,
            data
        };

        Object.assign(update, options);

        Object.assign(campaign, DEFAULT_CAMPAIGN_DATA, {
            startAt: null,
            active: true,
            in24hourWindow: true,
            include: [],
            exclude: []
        });

        Object.keys(options)
            .forEach((option) => {
                if (option === 'id') {
                    Object.assign(campaign, { id: options.id });
                } else if (typeof campaign[option] !== 'undefined') {
                    delete campaign[option];
                }
            });

        return this._storage.upsertCampaign(campaign, update);
    }

    /**
     * Add tasks to process by queue
     *
     * @memberof Notifications
     *
     * @param {CampaignTarget[]} campaignTargets
     * @returns {Promise<Task[]>}
     */
    async pushTasksToQueue (campaignTargets) {
        if (campaignTargets.length === 0) {
            return [];
        }

        const campaigns = new Map();
        const defEnqueue = Date.now();

        const tasks = campaignTargets
            .map((target) => ({
                campaignId: target.campaignId,
                senderId: target.senderId,
                pageId: target.pageId,
                data: target.data || null,
                enqueue: target.enqueue || defEnqueue, // time, when campaign should be fired,
                sent: null,
                read: null,
                delivery: null,
                reaction: null,
                leaved: null
            }));

        const ret = await this._storage.pushTasks(tasks);

        ret.forEach((task) => {
            // has been enqueued previously
            if (task.insEnqueue !== task.enqueue) {
                return;
            }
            if (!campaigns.has(task.campaignId)) {
                campaigns.set(task.campaignId, { i: 1 });
            } else {
                campaigns.get(task.campaignId).i++;
            }
        });

        for (const [campaignId, { i }] of campaigns.entries()) {
            await this._storage.incrementCampaign(campaignId, { queued: i });
        }

        return ret;
    }

    // eslint-disable-next-line jsdoc/require-param
    /**
     * Subscribe user under certain tag
     *
     * @memberof Notifications
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {string} tag
     */
    async subscribe (senderId, pageId, tag, req = null, res = null, cmps = null) {
        if (req && !req.subscribtions.includes(tag)) {
            req.subscribtions.push(tag);
            this._updateResDataWithSubscribtions(req, res);

            // re-evalutate campaigns
            await Promise.all([
                this._storage.subscribe(`${senderId}`, pageId, tag),
                this._postponeTasksOnInteraction(cmps, req)
            ]);

            if (tag !== this._allAudienceTag) {
                this._reportEvent('subscribed', tag, { senderId, pageId });
            }
        } else {
            await this._storage.subscribe(`${senderId}`, pageId, tag);
        }
    }

    // eslint-disable-next-line jsdoc/require-param
    /**
     * Unsubscribe user from certain tag or from all tags
     *
     * @memberof Notifications
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {string} [tag]
     * @param {object} [req]
     * @param {object} [res]
     */
    async unsubscribe (senderId, pageId, tag = null, req = null, res = null, cmps = null) {
        let unsubscibtions;

        if (req && req.subscribtions.includes(tag)) {
            req.subscribtions = req.subscribtions.filter((s) => s !== tag);
            this._updateResDataWithSubscribtions(req, res);

            // re-evalutate campaigns
            [unsubscibtions] = await Promise.all([
                this._storage.unsubscribe(senderId, pageId, tag),
                this._postponeTasksOnInteraction(cmps, req)
            ]);
        } else {
            unsubscibtions = await this._storage
                .unsubscribe(senderId, pageId, tag);
        }

        unsubscibtions
            .forEach((sub) => this._reportEvent('unsubscribed', sub, { senderId, pageId }));

    }

    /**
     * Preprocess message - for read and delivery
     *
     * @memberof Notifications
     *
     * @param {object} event
     * @param {string} pageId
     * @returns {Promise<{status:number}>}
     */
    async processMessage (event, pageId) {
        if (!event.sender || (!event.read && !event.delivery)) {
            return {
                status: 204
            };
        }

        const eventType = event.read ? 'read' : 'delivery';
        const { watermark } = event[eventType];
        const { timestamp: ts = Date.now() } = event;
        const senderId = event.sender.id;

        const tasks = await this._storage
            .updateTasksByWatermark(senderId, pageId, watermark, eventType, ts);

        await Promise.all(tasks
            .map((task) => this._messageDeliveryByMid(
                task.campaignId, eventType, senderId, pageId
            )));

        return {
            status: 200
        };
    }

    async _messageDeliveryByMid (campaignId, eventType, senderId, pageId) {
        const campaign = await this._storage.incrementCampaign(campaignId, {
            [eventType]: 1
        });

        const campaignName = campaign ? campaign.name : REMOVED_CAMPAIGN;
        this._reportEvent(eventType, campaignName, { senderId, pageId });
    }

    /**
     *
     * Get user subscribtions
     *
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<string[]>}
     */
    async getSubscribtions (senderId, pageId) {
        return this._storage.getSenderSubscribtions(senderId, pageId);
    }

    async _preloadSubscribtions (senderId, pageId, req, res) {
        if (res.data._requestSubscribtions) {
            req.subscribtions = res.data._requestSubscribtions;
            return;
        }

        req.subscribtions = await this._storage.getSenderSubscribtions(senderId, pageId);
        this._updateResDataWithSubscribtions(req, res);

        if (this._allAudienceTag && !req.subscribtions.includes(this._allAudienceTag)) {
            await this.subscribe(senderId, pageId, this._allAudienceTag, req, res);
        }
    }

    _updateResDataWithSubscribtions (req, res) {
        const notificationSubscribtions = {};

        req.subscribtions.forEach((subscribtion) => {
            Object.assign(notificationSubscribtions, {
                [subscribtion]: true
            });
        });

        res.setData({
            _notificationSubscribtions: notificationSubscribtions,
            _requestSubscribtions: req.subscribtions
        });
    }

    async beforeProcessMessage (req, res) {
        const notifications = this;

        // load sliding campaigns and postpone/insert their actions
        const [{ data: slidingCampaigns }] = await Promise.all([
            this._storage.getCampaigns({
                sliding: true, active: true
            }),
            this._preloadSubscribtions(req.senderId, req.pageId, req, res)
        ]);

        Object.assign(res, {
            subscribe (tag) {
                notifications
                    .subscribe(req.senderId, req.pageId, tag, req, res, slidingCampaigns)
                    .catch((e) => notifications._log.error(e));
            },
            unsubscribe (tag = null) {
                notifications
                    .unsubscribe(req.senderId, req.pageId, tag, req, res, slidingCampaigns)
                    .catch((e) => notifications._log.error(e));
            }
        });

        // process setState variables
        if (req.state[SUBSCRIBE]) {
            req.state[SUBSCRIBE].forEach((t) => res.subscribe(t));
            delete req.state[SUBSCRIBE];
            delete res.newState[SUBSCRIBE];
        }
        if (req.state[UNSUBSCRIBE]) {
            req.state[UNSUBSCRIBE].forEach((t) => res.unsubscribe(t));
            delete req.state[UNSUBSCRIBE];
            delete res.newState[UNSUBSCRIBE];
        }

        // is optin with token
        if (req.isOptin() && req.event.optin.one_time_notif_token) {
            const { one_time_notif_token: token } = req.event.optin;
            const { _ntfOneTimeTokens: tokens = [] } = req.state;
            const { _ntfTag: tag = null, ...data } = req.actionData();

            if (tag) {
                res.subscribe(tag);
            }

            res.setState({
                _ntfOneTimeTokens: [...tokens, {
                    token,
                    tag,
                    data
                }]
            });
        }

        // is action
        const { campaign } = req;

        if (!campaign) {
            // track campaign success
            const { _ntfLastCampaignId: lastCampaignId, _ntfLastTask: taskId } = req.state;
            const {
                _trackAsNegative: isNegative = false,
                _localpostback: isLocal = false
            } = req.actionData();

            if (lastCampaignId && !isLocal) {
                res.setState({
                    _ntfLastCampaignId: null,
                    _ntfLastCampaignName: null,
                    _ntfLastTask: null
                });

                this._reportCampaignSuccess(
                    isNegative ? 'negative' : 'positive',
                    lastCampaignId,
                    req.state._ntfLastCampaignName,
                    { senderId: req.senderId, pageId: req.pageId },
                    taskId
                );
            }

            await this._postponeTasksOnInteraction(slidingCampaigns, req, res);

            return true;
        }

        // ensure again the user has corresponding tags
        if (!this._isTargetGroup(campaign, req.subscribtions, req.pageId)) {
            return false;
        }

        if (!campaign.allowRepeat) {
            const task = await this._storage.getSentTask(req.pageId, req.senderId, campaign.id);

            if (task) {
                return false;
            }
        }

        if (campaign.hasCondition) {
            const fn = customFn(campaign.condition, `Campaign "${campaign.name}" condition`);

            const fnRes = fn(req, res);

            if (!fnRes) {
                return false;
            }
        }

        res.setMessagingType(campaign.type || 'UPDATE');

        // one time token with campaign token
        if (this._findAndUseToken(req, res, campaign)) {
            this._setLastCampaign(res, campaign, req.taskId);
            return true;
        }

        if (!campaign.in24hourWindow) {
            this._setLastCampaign(res, campaign, req.taskId);
            return true;
        }

        const { _ntfLastInteraction = Date.now() } = req.state;
        const inTimeFrame = Date.now() < (_ntfLastInteraction + WINDOW_24_HOURS);

        // do not send one message over, because of future campaigns
        if (inTimeFrame) {
            this._setLastCampaign(res, campaign, req.taskId);
            return true;
        }

        // one time token WITHOUT campaign token
        if (this._findAndUseToken(req, res)) {
            this._setLastCampaign(res, campaign, req.taskId);
            return true;
        }

        throw Object.assign(new Error('User fell out of 24h window'), {
            code: 402
        });
    }

    _findAndUseToken (req, res, campaign = null) {
        // one time token logic
        const { _ntfOneTimeTokens: tokens = [] } = req.state;
        // the campaign uses same tag as the token has
        const useToken = tokens.find((t) => {
            if (campaign) {
                return campaign.include.includes(t.tag);
            }
            return t.tag === null;
        });
        if (useToken) {
            // pop the token
            res.setState({
                _ntfOneTimeTokens: tokens.filter((t) => t.token !== useToken.token)
            });
            res.setNotificationRecipient({
                one_time_notif_token: useToken.token
            });
        }
        return useToken;
    }

    _isTargetGroup (campaign, subscribtions, pageId) {
        // if there's page id it should match
        if (campaign.pageId && campaign.pageId !== pageId) {
            return false;
        }
        // if there's exclusion, it should also match
        if (subscribtions.some((s) => campaign.exclude.includes(s))) {
            return false;
        }

        return campaign.include.length === 0
            || subscribtions.some((s) => campaign.include.includes(s));
    }

    /* _isTargetGroup (campaign, subscribtions, pageId) {
        return ((campaign.include.length === 0
            && (!campaign.pageId || campaign.pageId === pageId)
            && subscribtions.length !== 0)
                || subscribtions.some(s => campaign.include.includes(s)))
            && !subscribtions.some(s => campaign.exclude.includes(s));
    } */

    _reportCampaignSuccess (eventName, campaignId, campaignName, meta, taskId) {
        this._storage.incrementCampaign(campaignId, { [eventName]: 1 })
            .catch((e) => this._log.error('report campaign success store', e));
        if (taskId) {
            this._storage.updateTask(taskId, { reaction: true });
        }
        this._reportEvent(eventName, campaignName, meta);
    }

    _setLastCampaign (res, campaign, taskId = null) {
        res.setState({
            _ntfLastCampaignId: campaign.id,
            _ntfLastCampaignName: campaign.name,
            _ntfLastTask: taskId
        });
    }

    _calculateSlide (timestamp, { slide, slideRound = null, in24hourWindow = false }) {
        const time = timestamp + slide;

        if (typeof slideRound !== 'number') {
            return time;
        }

        // the next closest matching hour after the slide
        let zeroDaysTime = time - (time % DAY) + slideRound;

        if (zeroDaysTime < time) zeroDaysTime += DAY;

        if (!in24hourWindow) {
            return zeroDaysTime;
        }

        return Math.min(zeroDaysTime, timestamp + DAY - this._default24Clearance);
    }

    async _postponeTasksOnInteraction (data, req, res = null) {
        if (!data) {
            return;
        }

        const slidingCampaigns = data
            .filter((c) => this._isTargetGroup(c, req.subscribtions, req.pageId));

        let { _ntfSlidingCampTasks: cache = [] } = req.state;

        // remove the old tasks or tasks without campaigns
        cache = cache.filter((t) => t.enqueue >= req.timestamp
            && slidingCampaigns.some((c) => c.id === t.campaignId));

        // postpone existing
        cache = cache.map((t) => {
            const campaign = slidingCampaigns.find((c) => c.id === t.campaignId);
            const enqueue = this._calculateSlide(req.timestamp, campaign);
            return { ...t, enqueue };
        });
        await Promise.all(cache
            .map(({ id, enqueue }) => this._storage.updateTask(id, { enqueue })));

        // missing tasks in cache
        const { senderId, pageId } = req;
        const insert = slidingCampaigns
            .filter((c) => !cache.some((t) => t.campaignId === c.id));

        const checkCids = insert
            .filter((c) => !c.allowRepeat)
            .map((c) => c.id);

        // load the sent tasks
        const sentCampaigns = await this._storage
            .getSentCampagnIds(req.pageId, req.senderId, checkCids);

        const insertTasks = insert
            .filter((c) => c.allowRepeat || !sentCampaigns.includes(c.id))
            .map((c) => ({
                senderId,
                pageId,
                campaignId: c.id,
                enqueue: this._calculateSlide(req.timestamp, c)
            }));

        // insert tasks for sliding campaigns
        const insertedTasks = await this.pushTasksToQueue(insertTasks);

        if (res) {
            cache.push(...insertedTasks.map((t) => ({
                id: t.id,
                campaignId: t.campaignId,
                enqueue: t.enqueue
            })));

            res.setState({
                _ntfLastInteraction: req.timestamp,
                _ntfOverMessageSent: false,
                _ntfSlidingCampTasks: cache
            });
        }
    }

    /**
     * Run the campaign now (push tasks into the queue)
     *
     * @memberof Notifications
     *
     * @param {object} campaign
     * @returns {Promise<{queued:number}>}
     */
    async runCampaign (campaign) {
        let hasUsers = true;
        let lastKey = null;

        const { include, exclude } = campaign;

        const enqueue = campaign.startAt || Date.now();

        let queued = 0;

        while (hasUsers) {
            const { data: targets, lastKey: key } = await this._storage
                .getSubscribtions(include, exclude, this.limit, campaign.pageId, lastKey);

            lastKey = key;

            const campaignTargets = targets.map((target) => ({
                senderId: target.senderId,
                pageId: target.pageId,
                campaignId: campaign.id,
                enqueue
            }));

            const actions = await this.pushTasksToQueue(campaignTargets);

            queued += actions.length;

            hasUsers = targets.length > 0 && lastKey;
        }

        return { queued };
    }

    async processQueue (processor, timeLimit = 45000, timeStart = Date.now()) {
        // first, check out shedulled campaigns
        let run = true;
        const begin = Date.now();
        while (run) {
            const now = timeStart + (Date.now() - begin);
            const pop = await this._storage.popCampaign(now);

            if (pop) {
                await this.runCampaign(pop);
            } else {
                run = false;
            }
        }

        run = true;

        while (run) {
            const now = timeStart + (Date.now() - begin);
            const pop = await this._storage.popTasks(this.limit, now);
            await this._processPoppedTasks(pop, processor);

            run = pop.length !== 0 && (timeStart + timeLimit) > Date.now();
        }
    }

    async _processPoppedTasks (pop, processor) {
        const campaignIds = pop.reduce((arr, task) => {
            if (arr.indexOf(task.campaignId) === -1) {
                arr.push(task.campaignId);
            }
            return arr;
        }, []);
        const campaigns = await this._storage.getCampaignByIds(campaignIds);

        return Promise.all(pop
            .map((task) => {
                const campaign = campaigns.find((c) => c.id === task.campaignId);
                return this._processTask(processor, task, campaign);
            }));
    }

    _uniqueTs (senderId) {
        // campaign should be in active state
        let ts = Date.now();
        if (this._lts.has(senderId)) {
            const lts = this._lts.get(senderId);
            if (lts >= ts) {
                ts = lts + 1;
            }
        }
        this._lts.set(senderId, ts);
        // compact, if it's large
        if (this._lts.size > 50) {
            const keep = ts - 1000;
            this._lts = new Map(Array.from(this._lts.entries())
                .filter((e) => e[1] > keep));
        }
        return ts;
    }

    /**
     * Sends the message directly (without queue)
     * and records it's delivery status at campaign stats
     *
     * @param {object} campaign - campaign
     * @param {object} processor - channel processor instance
     * @param {string} pageId - page
     * @param {string} senderId - user
     * @param {object} [data] - override the data of campaign
     * @returns {Promise<{ status: number }>}
     * @example
     * const campaign = await notifications
     *     .createCampaign('Custom campaign', 'camp-action', {}, { id: 'custom-campaign' });
     *
     * await notifications.sendCampaignMessage(campaign, channel, pageId, senderId);
     */
    async sendCampaignMessage (campaign, processor, pageId, senderId, data = null) {
        const campaignTarget = {
            senderId,
            pageId,
            campaignId: campaign.id,
            data,
            enqueue: MAX_TS // mark as processed
        };

        const [task] = await this.pushTasksToQueue([campaignTarget]);

        return this._processTask(processor, task, campaign);
    }

    async _processTask (connector, task, campaign) {
        const ts = this._uniqueTs(task.senderId);

        if (!campaign || !campaign.active) {
            await this._finishTask('notSent', campaign, task, ts);
            return { status: 204 };
        }

        const message = Request.campaignPostBack(task.senderId, campaign, ts, task.data, task.id);
        let status;
        let mid;

        let result;
        try {
            result = await connector.processMessage(message, task.senderId, task.pageId);
            status = result.status; // eslint-disable-line prefer-destructuring
            mid = result.responses && result.responses.length
                && result.responses[result.responses.length - 1].message_id;
        } catch (e) {
            this._log.error('send notification error', e);
            const { code = 500 } = e;
            status = code;
            result = { status };
        }

        try {
            await this._storeSuccess(campaign, status, task, mid, ts);
        } catch (e) {
            this._log.error('store notification state error', e);
        }

        return result;
    }

    async _storeSuccess (campaign, status, task, mid, ts) {
        switch (status) {
            case 200:
                await this._finishTask('sent', campaign, task, ts, mid);
                break;
            case 204:
            case 400:
                await this._finishTask('notSent', campaign, task, ts);
                break;
            case 403:
            case 402:
                await this._finishTask('leaved', campaign, task, ts);
                break;
            case 500:
            default:
                await this._finishTask('failed', campaign, task, ts);
                break;
        }
    }

    async _finishTask (eventName, campaign, task, ts, mid = null) {
        const { senderId, pageId } = task;
        const promises = [];
        if (mid !== null) {
            promises.push(this._storage.updateTask(task.id, { mid, sent: ts, reaction: false }));
        } else {
            promises.push(this._storage.updateTask(task.id, { [eventName]: ts }));
        }
        if (campaign) {
            promises.push(this._storage.incrementCampaign(campaign.id, { [eventName]: 1 }));
        }
        await Promise.all(promises);

        const campaignName = campaign ? campaign.name : REMOVED_CAMPAIGN;
        this._reportEvent(eventName, campaignName, { senderId, pageId });
    }

    _reportEvent (event, campaignNameOrTag, meta) {
        try {
            this.emit('report', event, campaignNameOrTag, meta);
        } catch (e) {
            this._log.error('report event emit error', e);
        }
    }

}

Notifications.SUBSCRIBE = SUBSCRIBE;
Notifications.UNSUBSCRIBE = UNSUBSCRIBE;

module.exports = Notifications;
