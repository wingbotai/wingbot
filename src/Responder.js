/*
 * @author David Menger
 */
'use strict';

const Ai = require('./Ai');
const ReceiptTemplate = require('./templates/ReceiptTemplate');
const ButtonTemplate = require('./templates/ButtonTemplate');
const GenericTemplate = require('./templates/GenericTemplate');
const ListTemplate = require('./templates/ListTemplate');
const { makeAbsolute, makeQuickReplies } = require('./utils');
const { ResponseFlag } = require('./analytics/consts');
const { checkSetState } = require('./utils/stateVariables');
const {
    FEATURE_VOICE,
    FEATURE_SSML,
    FEATURE_PHRASES
} = require('./features');

const TYPE_RESPONSE = 'RESPONSE';
const TYPE_UPDATE = 'UPDATE';
const TYPE_MESSAGE_TAG = 'MESSAGE_TAG';
const EXCEPTION_HOPCOUNT_THRESHOLD = 5;

/** @typedef {import('./Request')} Request */
/** @typedef {import('./ReturnSender').UploadResult} UploadResult */
/** @typedef {import('./analytics/consts').TrackingCategory} TrackingCategory */
/** @typedef {import('./analytics/consts').TrackingType} TrackingType */

/**
 * @enum {string} ExpectedInput
 * @readonly
 */
const ExpectedInput = {
    TYPE_PASSWORD: 'password',
    TYPE_NONE: 'none',
    TYPE_UPLOAD: 'upload'
};

Object.freeze(ExpectedInput);

/**
 * @typedef {object} QuickReply
 * @prop {string} title
 * @prop {string} [action]
 * @prop {object} [data]
 * @prop {object} [setState]
 * @prop {string|Function} [aiTitle]
 * @prop {RegExp|string|string[]} [match]
 */

/**
 * @typedef {object} SenderMeta
 * @prop {ResponseFlag|null} flag
 * @prop {string} [likelyIntent]
 * @prop {string} [disambText]
 * @prop {string[]} [disambiguationIntents]
 */

/**
 * @typedef {object} VoiceControl
 * @prop {string} [ssml]
 * @prop {number} [speed]
 * @prop {number} [pitch]
 * @prop {number} [volume]
 * @prop {string} [style]
 * @prop {string} [language]
 * @prop {string} [voice]
 * @prop {number} [timeout]
 * @prop {number} [minTimeout]
 * @prop {number} [endTimeout]
 * @prop {string} [recognitionLanguage]
 * @prop {string} [recognitionEngine]
 */

/**
 * @callback VoiceControlFactory
 * @param {object} state
 * @returns {VoiceControl}
 */

/**
 * Instance of responder is passed as second parameter of handler (res)
 *
 * @class
 */
class Responder {

    constructor (senderId, messageSender, token = null, options = {}, data = {}) {
        this._messageSender = messageSender;
        this._senderId = senderId;
        this.token = token;

        /**
         * The empty object, which is filled with res.setState() method
         * and saved (with Object.assign) at the end of event processing
         * into the conversation state.
         *
         * @prop {object}
         */
        this.newState = {};

        this.path = '';
        this.routePath = '';
        this._bookmark = null;

        this.options = {
            state: Object.freeze({}),
            translator: (w) => w,
            appUrl: ''
        };

        /**
         * @prop {Object<keyof ExpectedInput,ExpectedInput>}
         */
        this.ExpectedInputTypes = ExpectedInput;

        Object.assign(this.options, options);
        if (this.options.autoTyping) {
            this.options.autoTyping = {
                time: 750,
                perCharacters: 'Sample text Sample texts Sample texts'.length,
                minTime: 550,
                maxTime: 1750,
                ...this.options.autoTyping
            };
        }

        this._t = this.options.translator;

        this._features = this.options.features || [];

        this._quickReplyCollector = [];

        this._data = data;

        this._messagingType = TYPE_RESPONSE;

        this._tag = null;

        this._firstTypingSkipped = false;

        /**
         * Run a code block defined by a plugin
         *
         * @prop {Function}
         * @param {string} blockName
         * @returns {Promise}
         */
        this.run = (blockName) => Promise.resolve(blockName && undefined);

        /**
         * Is true, when a final message (the quick replies by default) has been sent
         *
         * @prop {boolean}
         */
        this.finalMessageSent = false;

        /**
         * Is true, when a an output started during the event dispatch
         *
         * @prop {boolean}
         */
        this.startedOutput = false;

        /**
         * @type {VoiceControl|VoiceControlFactory}
         */
        this.voiceControl = null;

        this._trackAsAction = null;

        // both vars are package protected
        this._senderMeta = { flag: null };

        this._persona = null;

        this._recipient = { id: senderId };

        this._textResponses = [];
    }

    /**
     * Replaces recipient and disables autotyping
     * Usefull for sending a one-time notification
     *
     * @param {object} recipient
     */
    setNotificationRecipient (recipient) {
        this._recipient = recipient;
        this.options.autoTyping = false;
    }

    /**
     * Response has been marked with a flag
     *
     * @returns {SenderMeta}
     */
    get senderMeta () {
        return this._senderMeta;
    }

    /**
     * Disables logging the event to history
     *
     * @returns {this}
     */
    doNotLogTheEvent () {
        this._senderMeta = { flag: ResponseFlag.DO_NOT_LOG };
        return this;
    }

    /**
     * Fire tracking event
     * Events are aggregated within ReturnSender and can be caught
     * within Processor's `interaction` event (event.tracking.events)
     *
     * @param {TrackingType} type - (log,report,conversation,audit,user,training)
     * @param {TrackingCategory} category
     * @param {string} [action]
     * @param {string} [label]
     * @param {number} [value]
     * @returns {this}
     */
    trackEvent (type, category, action = '', label = '', value = 0) {
        this.send({
            tracking: {
                events: [
                    {
                        type, category, action, label, value
                    }
                ]
            }
        });
        return this;
    }

    // PROTECTED METHOD (called from ReducerWrapper)
    _visitedInteraction (action) {
        this._messageSender.visitedInteraction(action);
    }

    /**
     * Send a raw messaging event.
     * If no recipient is provided, a default (senderId) will be added.
     *
     * @param {object} data
     * @returns {this}
     * @example
     * res.send({ message: { text: 'Hello!' } });
     */
    send (data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Send method requires an object as first param');
        }
        if (!data.recipient) {
            Object.assign(data, {
                recipient: {
                    ...this._recipient
                }
            });
        }
        if (!data.messagingType) {
            Object.assign(data, {
                messaging_type: this._messagingType
            });
        }
        if (!data.messagingType) {
            Object.assign(data, {
                messaging_type: this._messagingType
            });
        }

        if (typeof this._persona === 'string') {
            Object.assign(data, {
                persona_id: this._persona
            });
        } else if (this._persona && typeof this._persona === 'object') {
            Object.assign(data, {
                persona: this._persona
            });
        }

        if (!data.tag && this._tag) {
            Object.assign(data, {
                tag: this._tag
            });
        }
        this.startedOutput = true;
        this._messageSender.send(data);
        return this;
    }

    /**
     * Stores current action to be able to all it again
     *
     * @param {string} [action]
     * @param {object} [winningIntent]
     * @returns {this}
     * @deprecated
     * @example
     * bot.use(['action-name', /keyword/], (req, res) => {
     *     if (req.action() !== res.currentAction()) {
     *         // only for routes with action name (action-name)
     *         res.setBookmark();
     *         return Router.BREAK;
     *     }
     *     res.text('Keyword reaction');
     * });
     *
     * // check out the res.runBookmark() method
     */
    setBookmark (action = this.currentAction(), winningIntent = null) {
        this._bookmark = makeAbsolute(action, this.path);
        this._winningIntent = winningIntent;
        return this;
    }

    /**
     * Returns the action of bookmark
     *
     * @deprecated
     * @returns {string|null}
     */
    bookmark () {
        return this._bookmark;
    }

    /**
     *
     *
     * @param {Function} postBack - the postback func
     * @param {object} [data] - data for bookmark action
     * @returns {Promise<null|boolean>}
     * @deprecated
     * @example
     * // there should be a named intent intent matcher (ai.match() and 'action-name')
     *
     * bot.use('action', (req, res) => {
     *     res.text('tell me your name');
     *     res.expected('onName');
     * });
     *
     * bot.use('onName', (req, res, postBack) => {
     *     if (res.bookmark()) {
     *          await res.runBookmark(postBack);
     *
     *          res.text('But I'll need your name')
     *              .expected('onName');
     *          return;
     *     }
     *
     *     res.text(`Your name is: ${res.text()}`);
     * })
     */
    async runBookmark (postBack, data = {}) {
        if (!this._bookmark) {
            return true;
        }
        const bookmark = this._bookmark;
        const sendData = {
            bookmark,
            _winningIntent: this._winningIntent,
            ...data
        };
        const res = await postBack(bookmark, sendData, true);
        this._bookmark = null;
        return res;
    }

    /**
     *
     * @param {string} messagingType
     * @param {string} [tag]
     * @returns {this}
     */
    setMessagingType (messagingType, tag = null) {
        this._messagingType = messagingType;
        this._tag = tag;
        return this;
    }

    /**
     * Tets the persona for following requests
     *
     * @param {object|string|null} personaId
     * @returns {this}
     */
    setPersona (personaId = null) {
        this._persona = personaId;
        return this;
    }

    /**
     * Returns true, when responder is not sending an update (notification) message
     *
     * @returns {boolean}
     */
    isResponseType () {
        return this._messagingType === TYPE_RESPONSE;
    }

    /**
     * @type {object}
     */
    get data () {
        return this._data;
    }

    /**
     * Set temporary data to responder, which are persisted through single event
     *
     * @param {object} data
     * @returns {this}
     * @example
     *
     * bot.use('foo', (req, res, postBack) => {
     *     res.setData({ a: 1 });
     *     postBack('bar');
     * });
     *
     * bot.use('bar', (req, res) => {
     *     res.data.a; // === 1 from postback
     * });
     */
    setData (data) {
        Object.assign(this._data, data);
        return this;
    }

    setPath (absolutePath, routePath = '') {
        this.path = absolutePath;
        this.routePath = routePath;
    }

    /**
     * Send text as a response
     *
     * @param {string} text - text to send to user, can contain placeholders (%s)
     * @param {Object.<string,string|QuickReply>|QuickReply[]} [replies] - quick replies
     * @param {VoiceControl} [voice] - voice control data
     * @returns {this}
     *
     * @example
     * // simply
     * res.text('Hello', {
     *     action: 'Quick reply',
     *     another: 'Another quick reply'
     * });
     *
     * // complex
     * res.text('Hello', [
     *     { action: 'action', title: 'Quick reply' },
     *     {
     *         action: 'complexAction', // required
     *         title: 'Another quick reply', // required
     *         setState: { prop: 'value' }, // optional
     *         match: 'text' || /regexp/ || ['intent'], // optional
     *         data:  { foo: 1  }'Will be included in payload data' // optional
     *     }
     * ]);
     */
    text (text, replies = null, voice = null) {
        const messageData = {
            message: {
                text: this._t(text)
            }
        };

        this._textResponses.push(text);

        if (replies || this._quickReplyCollector.length !== 0) {
            const qrc = this._quickReplyCollector;
            const {
                quickReplies: qrs, expectedKeywords, disambiguationIntents
            } = makeQuickReplies(replies, this.path, this._t, qrc, Ai.ai, this.currentAction());

            if (disambiguationIntents.length > 0) {
                this._senderMeta = {
                    flag: ResponseFlag.DISAMBIGUATION_OFFERED,
                    disambiguationIntents
                };
            }

            if (qrs.length > 0) {
                this.finalMessageSent = true;
                messageData.message.quick_replies = qrs;

                this._addExpectedIntents(expectedKeywords);
                this._quickReplyCollector = [];
            }
        }

        if (this._features.includes(FEATURE_VOICE)
            && (voice || this.voiceControl)) {

            Object.assign(messageData.message, {
                voice: {
                    ...(typeof this.voiceControl === 'function'
                        ? this.voiceControl(Object.freeze({
                            ...this.options.state, ...this.newState
                        }))
                        : this.voiceControl),
                    ...voice
                }
            });

            if (!this._features.includes(FEATURE_SSML)) {
                delete messageData.message.voice.ssml;
            }
        }

        this._autoTypingIfEnabled(messageData.message.text);
        this.send(messageData);
        return this;
    }
    /* eslint jsdoc/check-param-names: 1 */

    /**
     * Sets new attributes to state (with Object.assign())
     *
     * @param {object} object
     * @returns {this}
     *
     * @example
     * res.setState({ visited: true });
     */
    setState (object) {
        Object.assign(this.newState, object);
        checkSetState(object, this.newState);
        return this;
    }

    /**
     * Appends quick reply, to be sent with following text method
     *
     * @param {string|QuickReply} action - relative or absolute action
     * @param {string} [title] - quick reply title
     * @param {object} [data] - additional data
     * @param {boolean} [prepend] - set true to add reply at the beginning
     * @param {boolean} [justToExisting] - add quick reply only to existing replies
     * @deprecated use #quickReply instead
     * @example
     *
     * bot.use((req, res) => {
     *     res.addQuickReply('barAction', 'last action');
     *
     *     res.addQuickReply('theAction', 'first action', {}, true);
     *
     *     res.text('Text', {
     *         fooAction: 'goto foo'
     *     }); // will be merged and sent with previously added quick replies
     * });
     */
    addQuickReply (action, title, data = {}, prepend = false, justToExisting = false) {
        const actionIsObject = typeof action === 'object' && action;
        const prep = actionIsObject ? action : {};

        if (prepend) Object.assign(prep, { _prepend: true });
        if (justToExisting) Object.assign(prep, { _justToExisting: true });

        const useCa = this.currentAction();

        if (actionIsObject) {
            this._quickReplyCollector.push({
                ...prep,
                action: this.toAbsoluteAction(action.action),
                data: {
                    ...prep.data,
                    ...data
                },
                useCa
            });
        } else {
            this._quickReplyCollector.push({
                // @ts-ignore
                action: this.toAbsoluteAction(action),
                title,
                data,
                useCa,
                ...prep
            });
        }

        return this;
    }

    /**
     * Adds quick reply, to be sent by following text message
     *
     * @param {QuickReply} reply
     * @param {boolean} [atStart]
     * @param {boolean} [toLastMessage]
     * @returns {this}
     * @example
     *
     * bot.use((req, res) => {
     *     res.quickReply({ action: 'barAction', title: 'last action' });
     *
     *     res.text('Text', {
     *         fooAction: 'goto foo'
     *     }); // will be merged and sent with previously added quick replies
     * });
     */
    quickReply (reply, atStart = false, toLastMessage = true) {
        const useCa = this.currentAction();

        this._quickReplyCollector.push({
            ...reply,
            action: this.toAbsoluteAction(reply.action),
            useCa,
            ...(atStart && { _prepend: true }),
            ...(toLastMessage && { _justToExisting: true })
        });

        return this;
    }

    /**
     * To be able to keep context of previous interaction (expected action and intents)
     * Just use this method to let user to answer again.
     *
     * @param {Request} req
     * @param {boolean} [justOnce] - don't do it again
     * @param {boolean} [includeKeywords] - keep intents from quick replies
     * @returns {this}
     * @example
     *
     * bot.use('start', (req, res) => {
     *     res.text('What color do you like?', [
     *         { match: ['@Color=red'], text: 'red', action: 'red' },
     *         { match: ['@Color=blue'], text: 'blue', action: 'blue' }
     *     ]);
     *     res.expected('need-color')
     * });
     *
     * bot.use('need-color', (req, res) => {
     *     res.keepPreviousContext(req);
     *     res.text('Sorry, only red or blue.');
     * });
     */
    keepPreviousContext (req, justOnce = false, includeKeywords = false) {
        // @ts-ignore
        this.setState(req.expectedContext(justOnce, includeKeywords));
        return this;
    }

    /**
     *
     * @param {string|string[]} intents
     * @param {string} action
     * @param {object} data
     * @param {object} [setState]
     * @param {string|object[]} [aiTitle]
     */
    expectedIntent (intents, action, data = {}, setState = null, aiTitle = null) {
        const push = {
            action: this.toAbsoluteAction(action),
            match: intents,
            data
        };

        if (setState) {
            Object.assign(push, { setState });
        }

        if (aiTitle) {
            Object.assign(push, { title: aiTitle, hasAiTitle: true });
        }

        this._addExpectedIntents([push]);
        return this;
    }

    _addExpectedIntents (add) {
        const { _expectedKeywords: ex = [] } = this.newState;
        ex.push(...add);
        this.setState({ _expectedKeywords: ex });

        if (!this._features.includes(FEATURE_PHRASES)) {
            return;
        }

        const expectedIntentsAndEntities = [];

        // collect entities
        add.forEach((e) => {
            if (!Array.isArray(e.match)) return;

            e.match
                .forEach((rule) => {
                    if (rule.startsWith('#')) {
                        // @todo propagate also keywords
                        return;
                    }
                    if (rule.startsWith('@')) {
                        expectedIntentsAndEntities.push(rule
                            .replace(/([!=><?]{1,3})([^=><!]+)?/, ''));
                    } else {
                        expectedIntentsAndEntities.push(rule);
                    }

                });
        });

        if (expectedIntentsAndEntities.length !== 0) {
            this._messageSender.send({ expectedIntentsAndEntities });
        }
    }

    /**
     * When user writes some text as reply, it will be processed as action
     *
     * @param {string} action - desired action
     * @param {object} data - desired action data
     * @returns {this}
     */
    expected (action, data = {}) {
        if (!action) {
            return this.setState({ _expected: null });
        }
        this.finalMessageSent = true;
        return this.setState({
            _expected: {
                action: makeAbsolute(action, this.path),
                data
            }
        });
    }

    /**
     * Makes a following user input anonymized
     *
     * - disables processing of it with NLP
     * - replaces text content of incomming request before
     *   storing it at ChatLogStorage using a `confidentInputFilter`
     * - `req.isConfidentInput()` will return true
     *
     * After processing the user input, next requests will be processed as usual,
     *
     * @param {ExpectedInput} [expectedInput]
     * @returns {this}
     * @example
     *
     * const { Router } = require('wingbot');
     *
     * const bot = new Router();
     *
     * bot.use('start', (req, res) => {
     *     // evil question
     *     res.text('Give me your CARD NUMBER :D')
     *         .expected('received-card-number')
     *         .expectedConfidentInput();
     * });
     *
     * bot.use('received-card-number', (req, res) => {
     *     const cardNumber = req.text();
     *
     *     // raw card number
     *
     *     req.isConfidentInput(); // true
     *
     *     res.text('got it')
     *         .setState({ cardNumber });
     * });
     */
    expectedConfidentInput (expectedInput = null) {
        if (expectedInput) {
            this.expectedInput(expectedInput);
        }
        return this.setState({
            _expectedConfidentInput: true
        });
    }

    /**
     *
     * @param {ExpectedInput} type
     * @returns {this}
     * @example
     * bot.use((req, res) => {
     *     res.expectedInput(res.ExpectedInputTypes.TYPE_PASSWORD)
     * });
     */
    expectedInput (type) {
        this._messageSender.send({
            expectedIntentsAndEntities: [{ type }]
        });
        return this;
    }

    /**
     * Converts relative action to absolute action path
     *
     * @param {string} action - relative action to covert to absolute
     * @returns {string} absolute action path
     */
    toAbsoluteAction (action) {
        return makeAbsolute(action, this.path);
    }

    /**
     * Returns current action path
     *
     * @returns {string}
     */
    currentAction () {
        const routePath = this.routePath.replace(/^\//, '');
        let ret;
        if (!routePath) {
            ret = this.path;
        } else {
            ret = makeAbsolute(routePath, this.path);
        }
        if (!ret.match(/^\//)) {
            return `/${ret}`;
        }
        return ret;
    }

    /**
     *
     * @param {Buffer} data
     * @param {string} contentType
     * @param {string} fileName
     * @returns {Promise<UploadResult>}
     */
    async upload (data, contentType, fileName) {
        const result = await this._messageSender.upload(data, contentType, fileName);

        if (!result.url) {
            throw new Error(`Got no url on file upload ${fileName}. Probably a compatibility issue.`);
        }

        let [type] = contentType.split('/');

        if (!['image', 'video', 'audio'].includes(type)) {
            type = 'file';
        }

        this._attachment(result.url, type, true);
        return result;
    }

    /**
     * Sends image as response. Requires appUrl option to send images from server
     *
     * @param {string} imageUrl - relative or absolute url
     * @param {boolean} [reusable] - force facebook to cache image
     * @returns {this}
     *
     * @example
     * // image on same server (appUrl option)
     * res.image('/img/foo.png');
     *
     * // image at url
     * res.image('https://google.com/img/foo.png');
     */
    image (imageUrl, reusable = false) {
        this._attachment(imageUrl, 'image', reusable);
        return this;
    }

    /**
     * Sends video as response. Requires appUrl option to send videos from server
     *
     * @param {string} videoUrl - relative or absolute url
     * @param {boolean} [reusable] - force facebook to cache asset
     * @returns {this}
     *
     * @example
     * // file on same server (appUrl option)
     * res.video('/img/foo.mp4');
     *
     * // file at url
     * res.video('https://google.com/img/foo.mp4');
     */
    video (videoUrl, reusable = false) {
        this._attachment(videoUrl, 'video', reusable);
        return this;
    }

    /**
     * Sends file as response. Requires appUrl option to send files from server
     *
     * @param {string} fileUrl - relative or absolute url
     * @param {boolean} [reusable] - force facebook to cache asset
     * @returns {this}
     *
     * @example
     * // file on same server (appUrl option)
     * res.file('/img/foo.pdf');
     *
     * // file at url
     * res.file('https://google.com/img/foo.pdf');
     */
    file (fileUrl, reusable = false) {
        this._attachment(fileUrl, 'file', reusable);
        return this;
    }

    _attachment (attachmentUrl, type, reusable = false) {
        let url = attachmentUrl;

        if (!url.match(/^https?:\/\//)) {
            url = `${this.options.appUrl}${url}`;
        }

        const messageData = {
            message: {
                attachment: {
                    type,
                    payload: {
                        url,
                        is_reusable: reusable
                    }
                }
            }
        };

        const autoTyping = reusable ? null : false;
        this._autoTypingIfEnabled(autoTyping);
        this.send(messageData);
        return this;
    }

    /**
     * One-time Notification request
     *
     * use tag to be able to use the specific token with a specific campaign
     *
     * @param {string} title - propmt text
     * @param {string} action - target action, when user subscribes
     * @param {string} [tag] - subscribtion tag, which will be matched against a campaign
     * @param {object} [data]
     * @returns {this}
     */
    oneTimeNotificationRequest (title, action, tag = null, data = {}) {
        return this.template({
            template_type: 'one_time_notif_req',
            title: this._t(title),
            payload: JSON.stringify({
                action: makeAbsolute(action, this.path),
                data: {
                    ...data,
                    _ntfTag: tag
                }
            })
        });
    }

    template (payload) {
        const messageData = {
            message: {
                attachment: {
                    type: 'template',
                    payload
                }
            }
        };

        const autoTyping = payload.text || payload.title || null;
        this._autoTypingIfEnabled(autoTyping);
        this.send(messageData);
        return this;
    }

    /**
     * Sets delay between two responses
     *
     * @param {number} [ms=600]
     * @returns {this}
     */
    wait (ms = 600) {
        this.send({ wait: ms });
        return this;
    }

    /**
     * Sends "typing..." information
     *
     * @returns {this}
     */
    typingOn () {
        return this._senderAction('typing_on');
    }

    /**
     * Stops "typing..." information
     *
     * @returns {this}
     */
    typingOff () {
        return this._senderAction('typing_off');
    }

    /**
     * Reports last message from user as seen
     *
     * @returns {this}
     */
    seen () {
        return this._senderAction('mark_seen');
    }

    /**
     * Pass thread to another app
     *
     * @param {string} targetAppId
     * @param {string|object} [data]
     * @returns {this}
     */
    passThread (targetAppId, data = null) {
        let metadata = data;

        let { _$hopCount: $hopCount = -1 } = this._data;

        if ($hopCount >= EXCEPTION_HOPCOUNT_THRESHOLD) {
            throw new Error(`More than ${EXCEPTION_HOPCOUNT_THRESHOLD} handovers occured`);
        } else {
            $hopCount++;
        }

        this._senderMeta = { flag: ResponseFlag.HANDOVER };

        if (data === null) {
            metadata = JSON.stringify({
                data: { $hopCount }
            });
        } else if (typeof data === 'object') {
            metadata = JSON.stringify({
                ...data,
                data: {
                    $hopCount,
                    ...data.data
                }
            });
        } else if (typeof data !== 'string') {
            metadata = JSON.stringify(data);
        }

        const messageData = {
            target_app_id: targetAppId,
            metadata
        };

        this.finalMessageSent = true;
        this.send(messageData);
        return this;
    }

    /**
     * Request thread from Primary Receiver app
     *
     * @param {string|object} [data]
     * @returns {this}
     */
    requestThread (data = null) {
        let metadata = {};
        if (data !== null && typeof data !== 'string') {
            metadata = {
                metadata: JSON.stringify(data)
            };
        } else if (data) {
            metadata = {
                metadata: data
            };
        }
        const messageData = {
            request_thread_control: metadata
        };
        this.finalMessageSent = true;
        this.send(messageData);
        return this;
    }

    /**
     * Take thread from another app
     *
     * @param {string|object} [data]
     * @returns {this}
     */
    takeThead (data = null) {
        this.finalMessageSent = true;
        let metadata = {};
        if (data !== null && typeof data !== 'string') {
            metadata = {
                metadata: JSON.stringify(data)
            };
        } else if (data) {
            metadata = {
                metadata: data
            };
        }
        const messageData = {
            take_thread_control: metadata
        };
        this.send(messageData);
        return this;
    }

    /**
     * Sends Receipt template
     *
     * @param {string} recipientName
     * @param {string} [paymentMethod='Cash'] - should not contain more then 4 numbers
     * @param {string} [currency='USD'] - sets right currency
     * @param {string} [uniqueCode=null] - when omitted, will be generated randomly
     * @returns {ReceiptTemplate}
     *
     * @example
     * res.receipt('Name', 'Cash', 'CZK', '1')
     *     .addElement('Element name', 1, 2, '/inside.png', 'text')
     *     .send();
     */
    receipt (recipientName, paymentMethod = 'Cash', currency = 'USD', uniqueCode = null) {
        return new ReceiptTemplate(
            (payload) => this.template(payload),
            this._createContext(),
            recipientName,
            paymentMethod,
            currency,
            uniqueCode
        );
    }

    /**
     * Sends nice button template. It can redirect user to server with token in url
     *
     * @param {string} text
     * @returns {ButtonTemplate}
     *
     * @example
     * res.button('Hello')
     *     .postBackButton('Text', 'action')
     *     .urlButton('Url button', '/internal', true) // opens webview with token
     *     .urlButton('Other button', 'https://goo.gl') // opens in internal browser
     *     .send();
     */
    button (text) {
        const btn = new ButtonTemplate(
            (payload) => {
                this._textResponses.push(text);
                this.template(payload);
            },
            this._createContext(),
            text
        );
        return btn;
    }

    /**
     * Creates a generic template
     *
     * @param {boolean} [shareable] - ability to share template
     * @param {boolean} [isSquare] - use square aspect ratio for images
     * @example
     * res.genericTemplate()
     *     .addElement('title', 'subtitle')
     *         .setElementImage('/local.png')
     *         .setElementAction('https://www.seznam.cz')
     *         .postBackButton('Button title', 'action', { actionData: 1 })
     *     .addElement('another', 'subtitle')
     *         .setElementImage('https://goo.gl/image.png')
     *         .setElementActionPostback('action', { actionData: 1 })
     *         .urlButton('Local link with extension', '/local/path', true, 'compact')
     *     .send();
     *
     * @returns {GenericTemplate}
     *
     */
    genericTemplate (shareable = false, isSquare = false) {
        return new GenericTemplate(
            (payload) => this.template(payload),
            this._createContext(),
            shareable,
            isSquare
        );
    }

    /**
     * Creates a generic template
     *
     * @example
     * res.list('compact')
     *     .postBackButton('Main button', 'action', { actionData: 1 })
     *     .addElement('title', 'subtitle')
     *         .setElementImage('/local.png')
     *         .setElementUrl('https://www.seznam.cz')
     *         .postBackButton('Button title', 'action', { actionData: 1 })
     *     .addElement('another', 'subtitle')
     *         .setElementImage('https://goo.gl/image.png')
     *         .setElementAction('action', { actionData: 1 })
     *         .urlButton('Local link with extension', '/local/path', true, 'compact')
     *     .send();
     *
     * @param {'large'|'compact'} [topElementStyle='large']
     * @returns {ListTemplate}
     */
    list (topElementStyle = 'large') {
        return new ListTemplate(
            topElementStyle,
            (payload) => this.template(payload),
            this._createContext()
        );
    }

    /**
     * Override action tracking
     *
     * @param {string|boolean} action - use false to not emit analytics events
     * @returns {this}
     */
    trackAs (action) {
        if (typeof action === 'boolean') {
            this._trackAsAction = action === false
                ? false
                : null;
        } else {
            this._trackAsAction = this.toAbsoluteAction(action);
        }

        return this;
    }

    /**
     * Set skill for tracking (will used untill it will be changed)
     *
     * @param {string|null} skill
     * @returns {this}
     */
    trackAsSkill (skill) {
        this.setState({ _trackAsSkill: skill });
        return this;
    }

    /**
     * Return array of text responses
     *
     * @returns {string[]}
     */
    get textResponses () {
        return this._textResponses;
    }

    _senderAction (action) {
        const messageData = {
            sender_action: action
        };

        this.send(messageData);
        return this;
    }

    _createContext () {
        const { translator, appUrl } = this.options;
        return {
            translator,
            appUrl,
            token: this.token || '',
            senderId: this._senderId,
            path: this.path,
            currentAction: this.currentAction()
        };
    }

    _autoTypingIfEnabled (text) {
        if (!this.options.autoTyping) {
            return;
        }
        if (this._messagingType !== TYPE_RESPONSE && !this._firstTypingSkipped) {
            this._firstTypingSkipped = true;
            return;
        }
        const typingTime = this._getTypingTimeForText(text);
        this.typingOn().wait(typingTime);
    }

    _getTypingTimeForText (text) {
        if (text === false) {
            return 1;
        }

        const textLength = typeof text === 'string'
            ? text.length
            : this.options.autoTyping.perCharacters;

        const timePerCharacter = this.options.autoTyping.time
            / this.options.autoTyping.perCharacters;

        return Math.min(
            Math.max(
                textLength * timePerCharacter,
                this.options.autoTyping.minTime
            ),
            this.options.autoTyping.maxTime
        );
    }
}

Responder.TYPE_MESSAGE_TAG = TYPE_MESSAGE_TAG;
Responder.TYPE_UPDATE = TYPE_UPDATE;
Responder.TYPE_RESPONSE = TYPE_RESPONSE;

module.exports = Responder;
