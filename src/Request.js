/*
 * @author David Menger
 */
'use strict';

const Ai = require('./Ai');
const { tokenize, parseActionPayload } = require('./utils');
const { disambiguationQuickReply, quickReplyAction } = require('./utils/quickReplies');
const getUpdate = require('./utils/getUpdate');

const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const counter = {
    _t: 0,
    _d: 0
};

function makeTimestamp () {
    let now = Date.now();
    if (now > counter._d) {
        counter._t = 0;
    } else {
        now += ++counter._t;
    }
    counter._d = now;
    return now;
}

/**
 * @typedef {Object} Entity
 * @prop {string} entity
 * @prop {string} value
 * @prop {number} score
 */

/**
 * @typedef {Object} Intent
 * @prop {string} intent
 * @prop {number} score
 * @prop {Entity[]} [entities]
 */

/**
 * @typedef {Object} Action
 * @prop {string} action
 * @prop {Object} data
 * @prop {Object|null} [setState]
 */

/**
 * @typedef {Object} IntentAction
 * @prop {string} action
 * @prop {Intent} intent
 * @prop {number} sort
 * @prop {boolean} local
 * @prop {boolean} aboveConfidence
 * @prop {boolean} [winner]
 * @prop {string|function} [title]
 * @prop {Object} meta
 * @prop {string} [meta.targetAppId]
 * @prop {string|null} [meta.targetAction]
 */

/**
 * @typedef {Object} QuickReply
 * @prop {string} action
 * @prop {*} title
 */

/**
 * Instance of {Request} class is passed as first parameter of handler (req)
 *
 * @class {Request}
 */
class Request {

    constructor (data, state, pageId, globalIntents = new Map()) {
        this.campaign = data.campaign || null;

        this.taskId = data.taskId || null;

        this.data = data;

        this.globalIntents = globalIntents;

        /**
         * @prop {object} params - plugin configuration
         */
        this.params = {};

        this.message = data.message || null;

        this._postback = data.postback || null;

        this._referral = (this._postback && this._postback.referral)
            || data.referral
            || null;

        this._optin = data.optin || null;

        this.attachments = (data.message && data.message.attachments) || [];

        /**
         * @prop {number|null} timestamp
         */
        this.timestamp = data.timestamp || Date.now();

        /**
         * @prop {string} senderId sender.id from the event
         */
        this.senderId = (data.sender && data.sender.id) || null;

        /**
         * @prop {string} recipientId recipient.id from the event
         */
        this.recipientId = data.recipient && data.recipient.id;

        /**
         * @prop {string} pageId page identifier from the event
         */
        this.pageId = pageId;

        /**
         * @prop {Object} state current state of the conversation
         */
        this.state = state;

        /**
         * @prop {string[]} state list of subscribed tags
         */
        this.subscribtions = [];

        /**
         * @prop {Entity[]} entities list of entities
         */
        this.entities = [];

        /**
         * @prop {Intent[]} intents list of resolved intents
         */
        this.intents = [];

        /**
         * @prop {Action}
         * @private
         */
        this._action = undefined;

        this._winningIntent = null;

        this._aiActions = null;

        this._aiWinner = null;
    }

    /**
     * Get all matched actions from NLP intents
     *
     * @returns {IntentAction[]}
     */
    aiActions () {
        this._getMatchingGlobalIntent();
        return this._aiActions;
    }

    /**
     * Covert all matched actions for disambiguation purposes
     *
     * @param {number} [limit]
     * @param {IntentAction[]} [aiActions]
     * @param {string} [overrideAction]
     * @returns {QuickReply[]}
     */
    aiActionsForQuickReplies (limit = 5, aiActions = null, overrideAction = null) {
        if (aiActions === null) {
            this._getMatchingGlobalIntent();
        }

        const text = this.text();

        return (aiActions || this._aiActions)
            .filter(a => a.title)
            .slice(0, limit)
            .map(a => disambiguationQuickReply(
                typeof a.title === 'function'
                    ? a.title(this)
                    : a.title,
                a.intent.intent,
                text,
                overrideAction || a.action,
                overrideAction
                    ? {
                        _action: a.action,
                        _appId: a.appId
                    }
                    : {}
            ));
    }

    /**
     * Returns true, if there is an action for disambiguation
     *
     * @param {number} minimum
     * @returns {boolean}
     */
    hasAiActionsForDisambiguation (minimum = 1) {
        this._getMatchingGlobalIntent();
        return this._aiActions
            .filter(a => a.title)
            .length >= minimum;
    }

    /**
     * Returns intent, when using AI
     *
     * @param {boolean|number} getDataOrScore - score limit or true for getting intent data
     * @returns {null|string|Intent}
     */
    intent (getDataOrScore = false) {
        if (this.intents.length === 0) {
            return null;
        }

        let {
            _winningIntent: intent = this._winningIntent
        } = this.action(true);
        if (!intent) [intent] = this.intents;

        if (typeof getDataOrScore === 'number') {
            return intent.score >= getDataOrScore
                ? intent.intent
                : null;
        }

        if (getDataOrScore) {
            return intent;
        }
        return intent.intent;
    }

    /**
     * Get matched entity value
     *
     * @param {string} name - name of requested entity
     * @param {number} [sequence] - when there are more then one entity
     * @returns {number|string|null}
     */
    entity (name, sequence = 0) {
        const cleanName = name.replace(/^@/, '');

        const {
            _winningIntent: intent = this._winningIntent
        } = this.action(true);
        let entities;
        if (intent && intent.entities) {
            ({ entities } = intent);
        } else {
            ({ entities } = this);
        }

        const found = entities
            .filter(e => e.entity === cleanName);

        if (found.length <= sequence) {
            return null;
        }

        return found[sequence].value;
    }

    /**
     * Checks, when message contains an attachment (file, image or location)
     *
     * @returns {boolean}
     */
    isAttachment () {
        return this.attachments.length > 0;
    }

    _checkAttachmentType (type, attachmentIndex = 0) {
        if (this.attachments.length <= attachmentIndex) {
            return false;
        }
        return this.attachments[attachmentIndex].type === type;
    }

    /**
     * Checks, when the attachment is an image, but not a sticker
     *
     * @param {number} [attachmentIndex=0] - use, when user sends more then one attachment
     * @param {boolean} [includingStickers] - return true, when the image is also a sticker
     * @returns {boolean}
     */
    isImage (attachmentIndex = 0, includingStickers = false) {
        return this._checkAttachmentType('image', attachmentIndex)
            && (includingStickers
                || !this.isSticker(true));
    }

    /**
     * Checks, when the attachment is a file
     *
     * @param {number} [attachmentIndex=0] - use, when user sends more then one attachment
     * @returns {boolean}
     */
    isFile (attachmentIndex = 0) {
        return this._checkAttachmentType('file', attachmentIndex);
    }

    /**
     * Checks for location in attachments
     *
     * @returns {boolean}
     */
    hasLocation () {
        return this.attachments.some(at => at.type === 'location');
    }

    /**
     * Gets location coordinates from attachment, when exists
     *
     * @returns {null|{lat:number,long:number}}
     *
     * @example
     * const { Router } = require('wingbot');
     *
     * const bot = new Router();
     *
     * bot.use('start', (req, res) => {
     *     res.text('share location?', [
     *         // location share quick reply
     *         { action: 'locAction', title: 'Share location', isLocation: true }
     *     ]);
     * });
     *
     * bot.use('locAction', (req, res) => {
     *     if (req.hasLocation()) {
     *         const { lat, long } = req.getLocation();
     *         res.text(`Got ${lat}, ${long}`);
     *     } else {
     *         res.text('No location received');
     *     }
     * });
     */
    getLocation () {
        const location = this.attachments.find(at => at.type === 'location');

        if (!location) {
            return null;
        }

        return location.payload.coordinates;
    }

    /**
     * Returns whole attachment or null
     *
     * @param {number} [attachmentIndex=0] - use, when user sends more then one attachment
     * @returns {Object|null}
     */
    attachment (attachmentIndex = 0) {
        if (this.attachments.length <= attachmentIndex) {
            return null;
        }
        return this.attachments[attachmentIndex];
    }

    /**
     * Returns attachment URL
     *
     * @param {number} [attachmentIndex=0] - use, when user sends more then one attachment
     * @returns {string|null}
     */
    attachmentUrl (attachmentIndex = 0) {
        if (this.attachments.length <= attachmentIndex) {
            return null;
        }
        const { payload } = this.attachments[attachmentIndex];
        if (!payload) {
            return null;
        }
        return payload && payload.url;
    }

    /**
     * Returns true, when the request is text message, quick reply or attachment
     *
     * @returns {boolean}
     */
    isMessage () {
        return this.message !== null;
    }

    /**
     * Check, that message is a quick reply
     *
     * @returns {boolean}
     */
    isQuickReply () {
        return this.message !== null && this.message.quick_reply;
    }

    /**
     * Check, that message is PURE text
     *
     * @returns {boolean}
     */
    isText () {
        return (this.message !== null
            && !this.message.quick_reply
            && !!this.message.text)
            || this._stickerToSmile() !== '';
    }

    /**
     * Returns true, when the attachment is a sticker
     *
     * @param {boolean} [includeToTextStickers] - including strickers transformed into a text
     *
     * @returns {boolean}
     */
    isSticker (includeToTextStickers = false) {
        return this.attachments.length === 1
            && this.attachments[0].type === 'image'
            && typeof this.attachments[0].payload === 'object'
            && this.attachments[0].payload !== null
            && typeof this.attachments[0].payload.sticker_id !== 'undefined'
            && (includeToTextStickers
                || this._stickerIdToText(this.attachments[0].payload.sticker_id) === null);
    }

    _stickerIdToText (stickerId) {
        switch (stickerId) {
            case 369239263222822:
                return '👍';
            default:
                return null;
        }
    }

    _stickerToSmile () {
        if (!this.isSticker(true)) {
            return '';
        }

        return this._stickerIdToText(this.attachments[0].payload.sticker_id) || '';
    }

    /**
     * Returns text of the message
     *
     * @param {boolean} [tokenized=false] - when true, message is normalized to lowercase with `-`
     * @returns {string}
     *
     * @example
     * console.log(req.text(true)) // "can-you-help-me"
     */
    text (tokenized = false) {
        if (this.message === null) {
            return '';
        }

        if (tokenized && this.message.text) {
            return tokenize(this.message.text);
        }

        return this.message.text || this._stickerToSmile() || '';
    }

    /**
     * Returns the request expected handler in case have been set last response
     *
     * @returns {Action|null}
     */
    expected () {
        return this.state._expected || null;
    }

    /**
     * Returns current turn-around context (expected and expected keywords)
     *
     * @param {boolean} [justOnce] - don't do it again
     * @param {boolean} [includeKeywords] - keep intents from quick replies
     * @returns {Object}
     */
    expectedContext (justOnce = false, includeKeywords = false) {
        const {
            _expected: expected,
            _expectedKeywords: exKeywords
        } = this.state;

        const ret = {};

        let shouldIncludeKeywords = includeKeywords;

        if (expected) {
            const { action, data = {} } = expected;

            if (!data._expectedFallbackOccured || !justOnce) {
                Object.assign(ret, {
                    _expected: {
                        action,
                        data: {
                            ...data,
                            _expectedFallbackOccured: true
                        }
                    }
                });
            } else if (justOnce && shouldIncludeKeywords) {
                shouldIncludeKeywords = false;
            }
        }

        if (exKeywords && shouldIncludeKeywords) {
            Object.assign(ret, {
                _expectedKeywords: exKeywords
            });
        }

        return ret;
    }

    /**
     * Returns action or data of quick reply
     * When `getData` is `true`, object will be returned. Otherwise string or null.
     *
     * @param {boolean} [getData=false]
     * @returns {null|string|Object}
     *
     * @example
     * typeof res.quickReply() === 'string' || res.quickReply() === null;
     * typeof res.quickReply(true) === 'object';
     */
    quickReply (getData = false) {
        if (this.message === null
            || !this.message.quick_reply) {
            return null;
        }

        return this._processPayload(this.message.quick_reply, getData);
    }

    /**
     * Returns true, if request is the postback
     *
     * @returns {boolean}
     */
    isPostBack () {
        return this._postback !== null;
    }

    /**
     * Returns true, if request is the referral
     *
     * @returns {boolean}
     */
    isReferral () {
        return this._referral !== null;
    }

    /**
     * Returns true, if request is the optin
     *
     * @returns {boolean}
     */
    isOptin () {
        return this._optin !== null;
    }

    /**
     * Sets the action and returns previous action
     *
     * @param {string|Action|null} action
     * @param {Object} [data]
     * @returns {Action|null|undefined} - previous action
     */
    setAction (action, data = {}) {
        // fetch previous action
        const previousAction = this._action;

        if (typeof action === 'object' || typeof action === 'undefined') { // accepts also a null
            this._action = action;
        } else {
            this._action = { action, data };
        }

        return previousAction;
    }

    /**
     * Returns action of the postback or quickreply
     * When `getData` is `true`, object will be returned. Otherwise string or null.
     *
     * 1. the postback is checked
     * 2. the referral is checked
     * 3. the quick reply is checked
     * 4. expected keywords are checked
     * 5. expected state is checked
     *
     * @param {boolean} [getData=false]
     * @returns {null|string|Object}
     *
     * @example
     * typeof res.action() === 'string' || res.action() === null;
     * typeof res.action(true) === 'object';
     */
    action (getData = false) {
        if (typeof this._action === 'undefined') {
            this._action = this._resolveAction();
        }

        if (getData) {
            return this._action ? this._action.data : {};
        }

        return this._action && this._action.action;
    }

    /**
     * Gets incomming setState action variable
     *
     * @returns {Object}
     *
     * @example
     * res.setState(req.getSetState());
     */
    getSetState () {
        if (typeof this._action === 'undefined') {
            this._action = this._resolveAction();
        }

        const setState = (this._action && this._action.setState)
            || this.data.setState;

        if (!setState || typeof setState !== 'object') {
            return {};
        }

        return Object.keys(setState)
            .reduce((o, key) => {
                const value = setState[key];
                return Object.assign(o, getUpdate(key, value, this.state));
            }, {});
    }

    _resolveAction () {
        let res = null;

        if (this._referral !== null && this._referral.ref) {
            res = parseActionPayload({ payload: this._referral.ref });
        }

        if (!res && this._postback !== null) {
            res = parseActionPayload(this._postback);
        }

        if (!res && this._optin !== null && this._optin.ref) {
            res = this._base64Ref(this._optin);
        }

        if (!res && this.message !== null && this.message.quick_reply) {
            res = parseActionPayload(this.message.quick_reply);
        }

        if (!res && this.state._expectedKeywords) {
            res = this._actionByExpectedKeywords();
        }

        if (!res && this.state._expected) {
            res = parseActionPayload(this.state._expected);
        }

        if (!res && this.isText()) {
            const winner = this._getMatchingGlobalIntent();
            res = winner
                ? { action: winner.action, data: {}, setState: null }
                : null;
        }

        return res;
    }

    actionByAi () {
        const winner = this._getMatchingGlobalIntent();
        return winner ? winner.action : null;
    }

    _getMatchingGlobalIntent () {
        if (this._aiActions) {
            return this._aiWinner;
        }
        if (!this.isText()) {
            this._aiActions = [];
            return null;
        }

        const aiActions = [];

        // to match the local context intent
        let localRegexToMatch = null;
        if (this.state._lastVisitedPath) {
            localRegexToMatch = new RegExp(`^${this.state._lastVisitedPath}/[^/]+`);
        } else {
            let expected = this.expected();
            if (expected) {
                // @ts-ignore
                expected = expected.action.replace(/\/?[^/]+$/, '');
                localRegexToMatch = new RegExp(`^${expected}/[^/]+$`);
            }
        }

        const localEnhancement = (1 - Ai.ai.confidence) / 2;
        for (const gi of this.globalIntents.values()) {
            const pathMatches = localRegexToMatch && localRegexToMatch.exec(gi.action);
            if (gi.local && !pathMatches) {
                continue;
            }
            const intent = gi.matcher(this, null, true);
            if (intent !== null) {
                const sort = intent.score + (pathMatches ? localEnhancement : 0);
                // console.log(sort, wi.intent);
                aiActions.push({
                    ...gi,
                    intent,
                    aboveConfidence: intent.aboveConfidence,
                    sort,
                    winner: false
                });
            }
        }

        aiActions.sort((l, r) => r.sort - l.sort);
        const winner = this._winner(aiActions);

        this._aiActions = aiActions;
        this._aiWinner = winner;
        return winner;
    }

    _winner (aiActions) {
        if (aiActions.length === 0 || !aiActions[0].aboveConfidence) {
            return null;
        }

        // there will be no winner, if there are two different intents
        if (Ai.ai.shouldDisambiguate(aiActions)) {
            return null;
        }

        if (aiActions[0]) {
            // eslint-disable-next-line no-param-reassign
            aiActions[0].winner = true;
        }

        return aiActions[0];
    }

    _actionByExpectedKeywords () {
        let res = null;

        if (!res && this.state._expectedKeywords) {
            const payload = quickReplyAction(
                this.state._expectedKeywords,
                this,
                Ai.ai
            );
            if (payload) {
                res = parseActionPayload(payload);
            }
        }

        return res;
    }

    /**
     * Returns action or data of postback
     * When `getData` is `true`, object will be returned. Otherwise string or null.
     *
     * @param {boolean} [getData=false]
     * @returns {null|string|Object}
     *
     * @example
     * typeof res.postBack() === 'string' || res.postBack() === null;
     * typeof res.postBack(true) === 'object';
     */
    postBack (getData = false) {
        if (this._postback === null) {
            return null;
        }
        return this._processPayload(this._postback, getData);
    }

    _base64Ref (object = {}) {
        let process = {};

        if (object && object.ref) {
            let payload = object.ref;

            if (typeof payload === 'string' && payload.match(BASE64_REGEX)) {
                payload = Buffer.from(payload, 'base64').toString('utf8');
            }

            process = { payload };
        }

        return parseActionPayload(process);
    }

    _processPayload (object = {}, getData = false) {
        if (getData) {
            const { data } = parseActionPayload(object, true);
            return data;
        }

        const { action } = parseActionPayload(object, true);
        return action;
    }


    static timestamp () {
        return makeTimestamp();
    }

    static createReferral (action, data = {}, timestamp = makeTimestamp()) {
        return {
            timestamp,
            ref: JSON.stringify({
                action,
                data
            }),
            source: 'SHORTLINK',
            type: 'OPEN_THREAD'
        };
    }


    static postBack (
        senderId,
        action,
        data = {},
        refAction = null,
        refData = {},
        timestamp = makeTimestamp()
    ) {
        const postback = {
            payload: {
                action,
                data
            }
        };
        if (refAction) {
            Object.assign(postback, {
                referral: Request.createReferral(refAction, refData, timestamp)
            });
        }
        return {
            timestamp,
            sender: {
                id: senderId
            },
            postback
        };
    }

    static postBackWithSetState (
        senderId,
        action,
        data = {},
        setState = {},
        timestamp = makeTimestamp()
    ) {
        const postback = {
            payload: {
                action,
                data,
                setState
            }
        };
        return {
            timestamp,
            sender: {
                id: senderId
            },
            postback
        };
    }

    static campaignPostBack (
        senderId,
        campaign,
        timestamp = makeTimestamp(),
        data = null,
        taskId = null
    ) {
        const postback = Request.postBack(
            senderId,
            campaign.action,
            data || campaign.data,
            null,
            {},
            timestamp
        );
        return Object.assign(postback, {
            campaign,
            taskId
        });
    }

    static text (senderId, text, timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                text
            }
        };
    }

    static textWithSetState (senderId, text, setState, timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                text
            },
            setState
        };
    }

    static passThread (senderId, newAppId, data = null, timestamp = makeTimestamp()) {
        let metadata = data;
        if (data !== null && typeof data !== 'string') {
            metadata = JSON.stringify(data);
        }
        return {
            timestamp,
            sender: {
                id: senderId
            },
            pass_thread_control: {
                new_owner_app_id: newAppId,
                metadata
            }
        };
    }

    static intent (senderId, text, intentName, score = 1, timestamp = makeTimestamp()) {
        const res = Request.text(senderId, text, timestamp);

        Object.assign(res, { intent: intentName, score });

        return res;
    }

    static intentWithEntity (
        senderId,
        text,
        intentName,
        entity,
        value,
        score = 1,
        timestamp = makeTimestamp()
    ) {
        const res = Request.text(senderId, text, timestamp);

        Object.assign(res, {
            intent: intentName,
            entities: [
                { entity, value, score }
            ],
            score
        });

        return res;
    }

    static quickReply (senderId, action, data = {}, timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                text: action,
                quick_reply: {
                    payload: JSON.stringify({
                        action,
                        data
                    })
                }
            }
        };
    }

    static quickReplyText (senderId, text, payload, timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                text,
                quick_reply: {
                    payload
                }
            }
        };
    }

    static location (senderId, lat, long, timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                attachments: [{
                    type: 'location',
                    payload: {
                        coordinates: { lat, long }
                    }
                }]
            }
        };
    }

    static referral (senderId, action, data = {}, timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            referral: Request.createReferral(action, data, timestamp)
        };
    }

    static optin (userRef, action, data = {}, timestamp = makeTimestamp()) {
        const ref = Buffer.from(JSON.stringify({
            action,
            data
        }));
        return {
            timestamp,
            optin: {
                ref: ref.toString('base64'),
                user_ref: userRef
            }
        };
    }

    static fileAttachment (senderId, url, type = 'file', timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                attachments: [{
                    type,
                    payload: {
                        url
                    }
                }]
            }
        };
    }

    static sticker (senderId, stickerId, url = '', timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                attachments: [{
                    type: 'image',
                    payload: {
                        url,
                        sticker_id: stickerId
                    }
                }]
            }
        };
    }

    static readEvent (senderId, watermark, timestamp = makeTimestamp()) {
        return {
            sender: {
                id: senderId
            },
            timestamp,
            read: {
                watermark
            }
        };
    }

    static deliveryEvent (senderId, watermark, timestamp = makeTimestamp()) {
        return {
            sender: {
                id: senderId
            },
            timestamp,
            delivery: {
                watermark
            }
        };
    }

}

module.exports = Request;
