/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const { inspect } = require('util');
const deepExtend = require('deep-extend');
const Processor = require('./Processor');
const Request = require('./Request');
const { MemoryStateStorage } = require('./tools');
const ReturnSender = require('./ReturnSender');
const { actionMatches, parseActionPayload, tokenize } = require('./utils');
const { asserts } = require('./testTools');
const AnyResponseAssert = require('./testTools/AnyResponseAssert');
const ResponseAssert = require('./testTools/ResponseAssert');

const Router = require('./Router'); // eslint-disable-line no-unused-vars
const ReducerWrapper = require('./ReducerWrapper'); // eslint-disable-line no-unused-vars
const { FEATURE_TEXT } = require('./features');
const LLMMockProvider = require('./LLMMockProvider');

/** @typedef {import('./Processor').ProcessorOptions<Router>} ProcessorOptions */

/**
 * Utility for testing requests
 *
 * @class Tester
 */
class Tester {

    /**
     * Creates an instance of Tester.
     *
     * @param {Router|ReducerWrapper} reducer
     * @param {string} [senderId=null]
     * @param {string} [pageId=null]
     * @param {ProcessorOptions} [processorOptions={}] - options for Processor
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
            error: (e, f) => {
                let t;

                if (e instanceof Error) t = e;
                else if (typeof e === 'string' && f instanceof Error) t = new Error(`${e}: ${f.message}`);
                else if (f instanceof Error) t = f;
                else if (typeof e === 'string') t = new Error(e);
                else t = e;

                throw t;
            },
            warn: e => console.warn(e), // eslint-disable-line
            log: e => console.log(e), // eslint-disable-line
            info: e => console.info(e) // eslint-disable-line
        };

        this._cachedGiMap = null;

        this._listener = (senderIdentifier, action, text, req, prevAction, doNotTrack) => {
            const reqAction = req.action();
            if (reqAction
                && !this._actionMatches(action, reqAction)
                && this._actionHasGlobalIntent(reqAction)) {

                this._actionsCollector.push({
                    action: reqAction, text, prevAction, doNotTrack, isReqAction: true
                });
            }

            this._actionsCollector.push({
                action, text, prevAction, doNotTrack, isReqAction: false
            });
        };

        // @ts-ignore
        reducer.on('_action', this._listener);

        /** @type {Processor} */
        this.processor = new Processor(reducer, ({
            stateStorage: this.storage,
            log,
            // @ts-ignore
            loadUsers: false,
            llm: {
                provider: new LLMMockProvider(),
                ...processorOptions.llm
            },
            ...processorOptions
        }));

        // attach the plugin tester
        this.processor.plugin({
            processMessage: () => ({ status: 204 }),
            beforeProcessMessage: (req, res) => {
                req.params = {};
                Object.assign(res, {
                    _pluginBlocksCollector: this._pluginBlocksCollector,
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
        this.testData = {
            automatedTesting: true
        };

        /**
         * @prop {boolean} allow tester to process empty responses
         */
        this.allowEmptyResponse = false;

        /**
         * @prop {console} use own loggger
         */
        this.senderLogger = undefined;

        /**
         * @prop {string[]}
         */
        this.features = null;

        /**
         * @prop {string}
         */
        this.ATTACHMENT_MOCK_URL = 'http://mock.url/file.txt';
    }

    _actionHasGlobalIntent (action) {
        if (!this.processor.reducer
            || !('globalIntents' in this.processor.reducer)) {
            return false;
        }
        if (this._cachedGiMap === null) {
            this._cachedGiMap = new Set();

            for (const value of this.processor.reducer.globalIntents.values()) {
                this._cachedGiMap.add(value.action);
            }
        }

        return this._cachedGiMap.has(action.replace(/^\/?/, '/'));
    }

    dealloc () {
        this.processor.reducer
            .removeListener('_action', this._listener);
        this.processor.reducer = null;
        this._cachedGiMap = null;
    }

    /**
     * Enable tester to expand random texts
     * It joins them into a single sting
     *
     * @param {boolean} [fixedIndex]
     */
    setExpandRandomTexts (fixedIndex) {
        Object.assign(this.testData, {
            _expandRandomTexts: fixedIndex ? 1 : true
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
     * Set features for all messages
     *
     * @param {string[]} [features]
     */
    setFeatures (features = [FEATURE_TEXT]) {
        this.features = features;
    }

    /**
     * Use tester as a connector :)
     *
     * @param {object} message - wingbot chat event
     * @param {string} senderId - chat event sender identifier
     * @param {string} pageId - channel/page identifier
     * @param {object} [data] - additional data
     * @returns {Promise<any>}
     */
    async processMessage (message, senderId = this.senderId, pageId = this.pageId, data = {}) {
        if (!message.sender && !message.optin) {
            Object.assign(message, {
                sender: { id: senderId }
            });
        }

        if (this.features) {
            Object.assign(message, { features: this.features });
        }

        const messageSender = new ReturnSender({
            dontWaitForDeferredOps: false
        }, senderId, message, this.senderLogger);

        messageSender.simulatesOptIn = true;

        const res = await this.processor
            .processMessage(message, pageId, messageSender, { ...data, ...this.testData });
        this._acquireResponseActions(res, messageSender);

        return res;
    }

    _acquireResponseActions (res, messageSender) {
        if (res.status !== 200
            && !(res.status === 204 && this._pluginBlocksCollector.length > 0)
            && !(res.status === 204 && this.allowEmptyResponse)) {

            this.debug();

            if (res.status === 204) {
                throw Object.assign(new Error(`Bot did not respond (status ${res.status})`), { code: res.status });
            }

            throw Object.assign(new Error(`Processor failed with status ${res.status}`), { code: res.status });
        }
        this.responses = messageSender.responses;
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

    _actionMatches (botAction, path) {
        return botAction === path
            || (path === '*' && botAction === '/*')
            || (!botAction.match(/\*/) && actionMatches(botAction, path));
    }

    _actionsDebug (matchRequestActions = false) {
        const set = new Set();
        return this.actions
            .filter((a) => !a.isReqAction || matchRequestActions)
            .map((a) => (a.doNotTrack ? `(system interaction) ${a.action}` : a.action))
            .filter((a) => !set.has(a) && set.add(a));
    }

    /**
     * Checks, that request passed an interaction
     *
     * @param {string} path
     * @param {boolean} [matchRequestActions]
     * @returns {this}
     *
     * @memberOf Tester
     */
    passedAction (path, matchRequestActions = false) {
        const ok = this.actions
            .some((action) => (!action.isReqAction || matchRequestActions)
                && this._actionMatches(action.action, path));
        let actual;
        if (!ok) {
            actual = this._actionsDebug(matchRequestActions);
            assert.fail(asserts.ex('Interaction was not passed', path, actual));
        }
        return this;
    }

    /**
     * Checks, that a plugin used a block as a response
     *
     * @param {string} blockName
     * @returns {this}
     *
     * @memberOf Tester
     */
    respondedWithBlock (blockName) {
        const ok = this.pluginBlocks.includes(blockName);
        const actual = this.pluginBlocks.length === 0
            ? 'None'
            : this.pluginBlocks.map((b) => `"${b}"`).join(', ');
        assert.ok(ok, `Expected "${blockName}" to be used as a response. ${actual} blocks was tiggered.`);
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
            { ...this.processor.options.defaultState }
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
     * Assert, that state contains a subset of provided value
     *
     * @param {object} object
     * @param {boolean} [deep]
     * @example
     *
     * t.stateContains({ value: true });
     */
    stateContains (object, deep = false) {
        const { state } = this.getState();

        const clean = Object.fromEntries(
            Object.entries(object)
                .filter(([k, v]) => {
                    if (v === null || v === undefined) {
                        assert.ok(state[k] === null || state[k] === undefined, `Expected state key '${k}' to be empty. Actual: ${JSON.stringify(state[k])}'`);
                        return false;
                    }
                    return true;
                })
        );

        assert.deepEqual(
            state,
            deep ? deepExtend({}, state, clean) : { ...state, ...clean },
            'Conversation state equals'
        );
    }

    /**
     * Makes text request
     *
     * @param {string} text
     * @returns {Promise}
     * @memberOf Tester
     */
    text (text) {
        return this.processMessage(Request.text(this.senderId, text));
    }

    /**
     * Sends attachment
     *
     * @param {'image'|'audio'|'video'|'file'} type
     * @param {string} [url]
     * @returns {Promise}
     * @memberOf Tester
     */
    attachment (type = 'file', url = this.ATTACHMENT_MOCK_URL) {
        return this.processMessage(Request.fileAttachment(this.senderId, url, type));
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
     * @param {number} [entityScore]
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    intentWithEntity (
        intent,
        entity,
        value = entity,
        text = intent,
        score = 1,
        entityScore = score
    ) {
        return this.processMessage(Request
            .intentWithEntity(this.senderId, text, intent, entity, value, score, entityScore));
    }

    /**
     * Makes recognised AI request with entity
     *
     * @param {string} entity
     * @param {string} [value]
     * @param {string} [text]
     * @param {number} [score]
     * @returns {Promise}
     *
     * @memberOf Tester
     */
    entity (entity, value = entity, text = value, score = 1) {
        return this.processMessage(Request
            .intentWithEntity(this.senderId, text, `random-${Date.now()}`, entity, value, score));
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
     * Send quick reply if text exactly matches, otherwise throws exception
     *
     * @param {string} text
     * @returns {Promise<boolean>}
     *
     * @memberOf Tester
     */
    async quickReplyText (text) {
        let but = 'has not been found.';

        if (this.responses.length !== 0) {
            const normalize = (t) => `${t}`.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
            const normalizedText = normalize(text);
            const search = tokenize(normalizedText);
            const last = this.responses[this.responses.length - 1];
            const quickReplys = asserts.getQuickReplies(last);
            let res = quickReplys
                .filter(({ title = '', payload }) => title && payload && tokenize(title) === search);

            if (res.length > 1) {
                res = res
                    .filter(({ title = '' }) => normalize(title) === normalizedText);
            }

            if (res.length === 1) {
                const { title, payload } = res[0];
                await this.processMessage(Request.quickReplyText(this.senderId, title, payload));
                return true;
            }

            if (res.length > 1) {
                but = 'found, but there are multiple occurences.';
            }

            but += quickReplys.length
                ? ` (found: ${quickReplys.map((q) => q.title).filter((q) => !!q).join(', ')})`
                : ' (no quick replies available)';
        }

        throw new Error(`Quick reply "${text}" ${but}`);
    }

    /**
     * Sends postback, optionally with referrer action
     *
     * @param {string} action
     * @param {object} [data={}]
     * @param {string} [refAction=null] - referred action
     * @param {object} [refData={}] - referred action data
     * @returns {Promise}
     * @memberOf Tester
     */
    postBack (action, data = {}, refAction = null, refData = {}) {
        return this.processMessage(Request
            .postBack(this.senderId, action, data, refAction, refData, null));
    }

    /**
     * Prints last conversation turnaround
     *
     * @param {boolean} [showPrivateKeys]
     */
    debug (showPrivateKeys = false) {
        // eslint-disable-next-line no-console
        console.log(
            '\n===== actions =====\n',
            this._actionsDebug(true),
            '\n---- responses ----\n',
            inspect(
                this.responses.map(({ messaging_type: m, recipient, ...o }) => o),
                false,
                null,
                true
            ),
            '\n------ state ------\n',
            Object.fromEntries(
                Object.entries(this.getState().state)
                    .filter((e) => showPrivateKeys || !e[0].startsWith('_'))
            ),
            '\n===================\n'
        );
    }

}

module.exports = Tester;
