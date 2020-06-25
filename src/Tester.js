/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Processor = require('./Processor');
const Request = require('./Request');
const { MemoryStateStorage } = require('./tools');
const ReducerWrapper = require('./ReducerWrapper');
const ReturnSender = require('./ReturnSender');
const { actionMatches, parseActionPayload, tokenize } = require('./utils');
const { asserts } = require('./testTools');
const AnyResponseAssert = require('./testTools/AnyResponseAssert');
const ResponseAssert = require('./testTools/ResponseAssert');

const Router = require('./Router'); // eslint-disable-line no-unused-vars

/**
 * Utility for testing requests
 *
 * @class Tester
 */
class Tester {

    /**
     * Creates an instance of Tester.
     *
     * @param {Router|ReducerWrapper|Function} reducer
     * @param {string} [senderId=null]
     * @param {string} [pageId=null]
     * @param {object} [processorOptions={}] - options for Processor
     * @param {MemoryStateStorage} [storage] - place to override the storage
     *
     * @memberOf Tester
     */
    constructor (
        reducer,
        senderId = null,
        pageId = null,
        processorOptions = {},
        storage = new MemoryStateStorage()
    ) {
        this._sequence = 0;
        this._actionsCollector = [];
        this._pluginBlocksCollector = [];

        this.storage = storage;

        this.senderId = senderId || `${Math.random() * 1000}${Date.now()}`;
        this.pageId = pageId || `${Math.random() * 1000}${Date.now()}`;

        // replace logger (throw instead of log)
        const log = {
            error: (e) => { throw e; },
            warn: e => console.warn(e), // eslint-disable-line
            log: e => console.log(e), // eslint-disable-line
            info: e => console.info(e) // eslint-disable-line
        };

        let wrappedReducer = reducer;

        if (typeof reducer === 'function') {
            wrappedReducer = new ReducerWrapper(reducer);
        }

        // @ts-ignore
        wrappedReducer.on('_action', (senderIdentifier, action, text, req, prevAction, doNotTrack) => {
            this._actionsCollector.push({
                action, text, prevAction, doNotTrack
            });
        });

        this.processor = new Processor(wrappedReducer, ({
            stateStorage: this.storage,
            log,
            loadUsers: false,
            ...processorOptions
        }));

        // attach the plugin tester
        this.processor.plugin({
            processMessage: () => ({ status: 204 }),
            beforeProcessMessage: (req, res) => {
                req.params = {};
                Object.assign(res, {
                    run: (blockName) => {
                        this._pluginBlocksCollector.push(blockName);
                        return Promise.resolve();
                    }
                });
                return true;
            }
        });

        this.pluginBlocks = [];
        this.responses = [];
        this.actions = [];

        /**
         * @prop {object} predefined test data to use
         */
        this.testData = {};

        /**
         * @prop {boolean} allow tester to process empty responses
         */
        this.allowEmptyResponse = false;

        /**
         * @prop {console} use own loggger
         */
        this.senderLogger = undefined;
    }

    /**
     * Enable tester to expand random texts
     * It joins them into a single sting
     */
    setExpandRandomTexts () {
        Object.assign(this.testData, {
            _expandRandomTexts: true
        });
    }

    /**
     * Clear acquired responses and data
     */
    cleanup () {
        this.pluginBlocks = [];
        this.responses = [];
        this.actions = [];
        this._actionsCollector = [];
        this._pluginBlocksCollector = [];
        this._responsesMock = [];
    }

    /**
     * Use tester as a connector :)
     *
     * @param {object} message - wingbot chat event
     * @param {string} senderId - chat event sender identifier
     * @param {string} pageId - channel/page identifier
     * @returns {Promise<any>}
     */
    async processMessage (message, senderId = this.senderId, pageId = this.pageId) {
        const messageSender = new ReturnSender({}, senderId, message, this.senderLogger);
        messageSender.simulatesOptIn = true;

        const res = await this.processor
            .processMessage(message, pageId, messageSender, { ...this.testData });
        this._acquireResponseActions(res, messageSender);

        return res;
    }

    _acquireResponseActions (res, messageSender) {
        if (res.status !== 200
            && !(res.status === 204 && this._pluginBlocksCollector.length > 0)
            && !(res.status === 204 && this.allowEmptyResponse)) {

            throw new Error(`Processor failed with status ${res.status}`);
        }
        this.responses = messageSender._sent;
        this.pluginBlocks = this._pluginBlocksCollector;
        this.actions = this._actionsCollector;
        this._actionsCollector = [];
        this._pluginBlocksCollector = [];
        this._responsesMock = [];
        return res;
    }

    /**
     * Returns single response asserter
     *
     * @param {number} [index=0] - response index
     * @returns {ResponseAssert}
     *
     * @memberOf Tester
     */
    res (index = 0) {
        if (this.responses.length <= index && index !== -1) {
            assert.fail(`Response ${index} does not exists. There are ${this.responses.length} responses`);
        }

        return new ResponseAssert(this.responses[index]);
    }

    /**
     * Returns any response asserter
     *
     * @returns {AnyResponseAssert}
     *
     * @memberOf Tester
     */
    any () {
        return new AnyResponseAssert(this.responses);
    }

    /**
     * Returns last response asserter
     *
     * @returns {ResponseAssert}
     *
     * @memberOf Tester
     */
    lastRes () {
        if (this.responses.length === 0) {
            assert.fail('Theres no response');
        }
        return new ResponseAssert(this.responses[this.responses.length - 1]);
    }

    /**
     * Checks, that app past the action
     *
     * @param {string} path
     * @returns {this}
     *
     * @memberOf Tester
     */
    passedAction (path) {
        const ok = this.actions
            .some((action) => (action.action === path
                || (!action.action.match(/\*/) && actionMatches(action.action, path))));
        let actual;
        if (!ok) {
            const set = new Set();
            actual = this.actions
                .map((a) => (a.doNotTrack ? `(system interaction) ${a.action}` : a.action))
                .filter((a) => !set.has(a) && set.add(a));
            assert.fail(asserts.ex('Interaction was not passed', path, actual));
        }
        return this;
    }

    /**
     * Checks, that a plugin used a block as a responde
     *
     * @param {string} blockName
     * @returns {this}
     *
     * @memberOf Tester
     */
    respondedWithBlock (blockName) {
        const ok = this.pluginBlocks.includes(blockName);
        assert.ok(ok, `Block ${blockName} was not used as response`);
        return this;
    }

    /**
     * Returns state
     *
     * @returns {object}
     *
     * @memberOf Tester
     */
    getState () {
        return this.storage.getOrCreateStateSync(
            this.senderId,
            this.pageId,
            this.processor.options.defaultState
        );
    }

    /**
     * Sets state with `Object.assign()`
     *
     * @param {object} [state={}]
     *
     * @memberOf Tester
     */
    setState (state) {
        const stateObj = this.getState();
        stateObj.state = { ...stateObj.state, ...state };
        this.storage.saveState(stateObj);
    }

    /**
     * Makes text request
     *
     * @param {string} text
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    text (text) {
        return this.processMessage(Request.text(this.senderId, text));
    }

    /**
     * Makes recognised AI intent request
     *
     * @param {string|string[]} intent
     * @param {string} [text]
     * @param {number} [score]
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    intent (intent, text = null, score = undefined) {
        if (text) {
            return this.processMessage(Request.intentWithText(this.senderId, text, intent, score));
        }
        return this.processMessage(Request.intent(this.senderId, intent, score));
    }

    /**
     * Makes recognised AI intent request with entity
     *
     * @param {string} intent
     * @param {string} entity
     * @param {string} [value]
     * @param {string} [text]
     * @param {number} [score]
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    intentWithEntity (intent, entity, value = entity, text = intent, score = 1) {
        return this.processMessage(Request
            .intentWithEntity(this.senderId, text, intent, entity, value, score));
    }

    /**
     * Make optin call
     *
     * @param {string} action
     * @param {object} [data={}]
     * @param {string} [userRef] - specific ref string
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    optin (action, data = {}, userRef = null) {
        let useRef = userRef;
        if (useRef === null) {
            useRef = `${Date.now()}${Math.floor(Date.now() * Math.random())}`;
        }
        return this.processMessage(Request.optin(useRef, action, data));
    }

    /**
     * Send quick reply
     *
     * @param {string} action
     * @param {object} [data={}]
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    quickReply (action, data = {}) {
        if (this.responses.length !== 0) {
            const last = this.responses[this.responses.length - 1];
            const quickReplys = asserts.getQuickReplies(last);
            const res = quickReplys
                .filter((reply) => {
                    const { action: route } = parseActionPayload(reply, true);
                    return route && actionMatches(route, action);
                });

            if (res[0]) {
                const { title, payload } = res[0];
                return this.processMessage(Request.quickReplyText(this.senderId, title, payload));
            }
        }

        return this.processMessage(Request.quickReply(this.senderId, action, data));
    }

    /**
     * Send quick reply if text exactly matches, otherwise returns false
     *
     * @param {string} text
     * @returns {Promise<boolean>}
     *
     * @memberOf Tester
     */
    async quickReplyText (text) {

        if (this.responses.length !== 0) {
            const search = tokenize(text);
            const last = this.responses[this.responses.length - 1];
            const quickReplys = asserts.getQuickReplies(last);
            const res = quickReplys
                .filter(({ title = '', payload }) => title && payload && tokenize(title) === search);

            if (res[0]) {
                const { title, payload } = res[0];
                await this.processMessage(Request.quickReplyText(this.senderId, title, payload));
                return true;
            }
        }

        return false;
    }

    /**
     * Sends postback, optionally with referrer action
     *
     * @param {string} action
     * @param {object} [data={}]
     * @param {string} [refAction=null] - referred action
     * @param {object} [refData={}] - referred action data
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    postBack (action, data = {}, refAction = null, refData = {}) {
        return this.processMessage(Request
            .postBack(this.senderId, action, data, refAction, refData));
    }

}

module.exports = Tester;
