/*
 * @author David Menger
 */
'use strict';

const { tokenize, quickReplyAction, parseActionPayload } = require('./utils');
const RequestsFactories = require('./utils/RequestsFactories');

const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;


/**
 * @typedef {Object} Entity
 * @param {string} entity
 * @param {string} value
 * @param {number} score
 */

/**
 * @typedef {Object} Intent
 * @prop {string} intent
 * @prop {number} score
 * @prop {Entity[]} [entities]
 */

/**
 * @typedef {Object} Subscribtion
 * @prop {string} tag
 * @prop {number} ts
 */

/**
 * @typedef {Object} Action
 * @prop {string} action
 * @prop {Object} data
 */

/**
 * Instance of {Request} class is passed as first parameter of handler (req)
 *
 * @class
 */
class Request extends RequestsFactories {

    constructor (data, state, pageId) {
        super();

        this.campaign = data.campaign || null;

        this.data = data;

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
         * @prop {Subscribtion[]} state list of subscribed tags
         */
        this.subscribtions = [];

        /**
         * @prop {Entity[]} entities list of entities
         */
        this.entities = [];

        /**
         * @prop {Intent[]|null} intents list of resolved intents
         */
        this.intents = null;

        /**
         * @prop {Action}
         * @private
         */
        this._action = undefined;

        this._winningIntent = null;
    }

    /**
     * Returns intent, when using AI
     *
     * @param {boolean|number} getDataOrScore - score limit or true for getting intent data
     * @returns {null|string|Intent}
     */
    intent (getDataOrScore = false) {
        if (!this.intents || this.intents.length === 0) {
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
     * @returns {string|null}
     */
    expected () {
        return this.state._expected || null;
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
     * Returns true, if request pass thread control
     *
     * @deprecated use passTreadAction option in Facebook plugin instead
     * @returns {boolean}
     */
    isPassThread () {
        return this.data.target_app_id || this.data.pass_thread_control;
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

        // @deprecated
        if (!res && this.isPassThread()) {
            if (this.data.pass_thread_control.metadata) {
                const payload = this.data.pass_thread_control.metadata;
                res = parseActionPayload({ payload }, true);
            }
            if (!res || !res.action) {
                res = { action: 'pass-thread', data: res ? res.data : {} };
            }
        }

        if (!res && this.state._expectedKeywords) {
            res = this._actionByExpectedKeywords();
        }

        if (!res && this.state._expected) {
            res = parseActionPayload(this.state._expected);
        }

        return res;
    }

    _actionByExpectedKeywords () {
        let res = null;

        if (!res && this.state._expectedKeywords) {
            const payload = quickReplyAction(
                this.state._expectedKeywords,
                this.text(true),
                this.text()
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

}

module.exports = Request;
