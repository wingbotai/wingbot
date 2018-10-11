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
const { actionMatches, parseActionPayload } = require('./utils');
const { AnyResponseAssert, ResponseAssert, asserts } = require('./testTools');

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
     * @param {Object} [processorOptions={}] - options for Processor
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

        this.storage = storage;

        this.senderId = senderId || `${Math.random() * 1000}${Date.now()}`;
        this.pageId = pageId || `${Math.random() * 1000}${Date.now()}`;

        // replace logger (throw instead of log)
        const log = {
            error: (e) => { throw e; },
            warn: e => console.warn(e), // eslint-disable-line
            log: e => console.log(e) // eslint-disable-line
        };

        let wrappedReducer = reducer;

        if (typeof reducer === 'function') {
            wrappedReducer = new ReducerWrapper(reducer);
        }

        wrappedReducer.on('_action', (senderIdentifier, action, text) => {
            this._actionsCollector.push({ action, text });
        });

        this.processor = new Processor(wrappedReducer, Object.assign({
            stateStorage: this.storage,
            log,
            loadUsers: false
        }, processorOptions));

        this.responses = [];
        this.actions = [];
    }

    _request (data) {
        const messageSender = new ReturnSender({}, this.senderId, data);
        messageSender.simulatesOptIn = true;

        return this.processor.processMessage(data, this.pageId, messageSender)
            .then(res => this._acquireResponseActions(res, messageSender));
    }

    _acquireResponseActions (res, messageSender) {
        if (res.status !== 200) {
            throw new Error(`Processor failed with status ${res.status}`);
        }
        this.responses = messageSender._sent;
        this.actions = this._actionsCollector;
        this._actionsCollector = [];
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
            .some(action => !action.action.match(/\*/) && actionMatches(action.action, path));
        assert.ok(ok, `Action ${path} was not passed`);
        return this;
    }

    /**
     * Returns state
     *
     * @returns {Object}
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
     * @param {Object} [state={}]
     *
     * @memberOf Tester
     */
    setState (state) {
        const stateObj = this.getState();
        stateObj.state = Object.assign({}, stateObj.state, state);
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
        return this._request(Request.text(this.senderId, text));
    }

    /**
     * Makes recognised AI intent request
     *
     * @param {string} intent
     * @param {string} text
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    intent (intent, text = intent) {
        return this._request(Request.intent(this.senderId, text, intent));
    }

    /**
     * Makes pass thread control request
     *
     * @param {string|Object} [data] - action
     * @param {string} [appId] - specific app id
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    passThread (data = null, appId = 'random-app') {
        return this._request(Request.passThread(this.senderId, appId, data));
    }

    /**
     * Make optin call
     *
     * @param {string} action
     * @param {Object} [data={}]
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
        return this._request(Request.optin(useRef, action, data));
    }

    /**
     * Send quick reply
     *
     * @param {string} action
     * @param {Object} [data={}]
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    quickReply (action, data = {}) {
        let usedAction = action;
        let usedData = data;

        if (this.responses.length !== 0) {
            const last = this.responses[this.responses.length - 1];
            const quickReplys = asserts.getQuickReplies(last);

            const res = quickReplys
                .map(reply => parseActionPayload(reply))
                .filter(({ action: route }) => route && actionMatches(route, action));

            if (res[0]) {
                usedAction = res[0].action;
                usedData = res[0].data;
            }
        }

        return this._request(Request.quickReply(this.senderId, usedAction, usedData));
    }

    /**
     * Sends postback, optionally with referrer action
     *
     * @param {string} action
     * @param {Object} [data={}]
     * @param {string} [refAction=null] - referred action
     * @param {Object} [refData={}] - referred action data
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    postBack (action, data = {}, refAction = null, refData = {}) {
        return this._request(Request
            .postBack(this.senderId, action, data, refAction, refData));
    }

}

module.exports = Tester;
