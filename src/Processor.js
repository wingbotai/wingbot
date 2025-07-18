/**
 * @author David Menger
 */
'use strict';

const EventEmitter = require('events');
const crypto = require('crypto');
const { MemoryStateStorage } = require('./tools');
const Responder = require('./Responder');
const Request = require('./Request');
const Ai = require('./Ai');
const ReturnSender = require('./ReturnSender');
const { prepareState, mergeState, isUserInteraction } = require('./utils/stateVariables');
const LLM = require('./LLM');
const LLMMockProvider = require('./LLMMockProvider');

/** @typedef {import('./wingbot/CustomEntityDetectionModel').Intent} Intent */
/** @typedef {import('./ReducerWrapper')} ReducerWrapper */
/** @typedef {import('./Router')} Router */
/** @typedef {import('./BuildRouter')} BuildRouter */
/** @typedef {import('./analytics/consts').TrackingCategory} TrackingCategory */
/** @typedef {import('./analytics/consts').TrackingType} TrackingType */
/** @typedef {import('./analytics/consts').ResponseFlag} ResponseFlag */
/** @typedef {import('./LLM').LLMConfiguration} LLMConfiguration */

/**
 * @typedef {object} AutoTypingConfig
 * @prop {number} time - duration
 * @prop {number} perCharacters - number of characters
 * @prop {number} minTime - minimum writing time
 * @prop {number} maxTime - maximum writing time
 */

/**
 * @typedef {object} Plugin
 * @prop {Function} [processMessage]
 * @prop {Function} [beforeAiPreload]
 * @prop {Function} [beforeProcessMessage]
 * @prop {Function} [afterProcessMessage]
 */

/**
 * @typedef {object} TrackingEvent
 * @prop {TrackingType} type
 * @prop {TrackingCategory} category
 * @prop {string} action
 * @prop {string} label
 * @prop {number} value
 */

/**
 * @typedef {object} TrackingObject
 * @prop {TrackingEvent[]} events
 */

/**
 * @typedef {object} InteractionEvent
 * @prop {Request} req
 * @prop {string[]} actions
 * @prop {string|null} lastAction
 * @prop {object} state
 * @prop {object} data
 * @prop {string|null} skill
 * @prop {string|null} prevSkill
 * @prop {string|null} pathname
 * @prop {TrackingObject} tracking - deprecated
 * @prop {TrackingEvent[]} events
 * @prop {ResponseFlag|null} flag
 * @prop {boolean} nonInteractive
 * @prop {string[]} responseTexts
 * @prop {boolean} doNotTrack
 */

/**
 * @callback IInteractionHandler
 * @param {InteractionEvent} params
 * @returns {Promise|void}
 */

/**
 * Interaction event fired after every interaction
 *
 * @event Processor#interaction
 * @type {InteractionEvent}
 */

/**
 * @typedef {object} ILogger
 * @prop {Function} log
 * @prop {Function} warn
 * @prop {Function} error
 */

/**
 *
 * @template {ReducerWrapper|Router|BuildRouter} R
 * @typedef {object} ProcessorOptions
 * @prop {string} [appUrl] - url basepath for relative links
 * @prop {IStateStorage} [stateStorage] - chatbot state storage
 * @prop {object} [tokenStorage] - frontend token storage
 * @prop {Function} [translator] - text translate function
 * @prop {number} [timeout] - chat sesstion lock duration (30000)
 * @prop {number} [justUpdateTimeout] - simple read and write lock (1000)
 * @prop {number} [waitForLockedState] - wait when state is locked (12000)
 * @prop {number} [retriesWhenWaiting] - number of attampts (6)
 * @prop {Function} [nameFromState] - override the name translator
 * @prop {boolean|AutoTypingConfig} [autoTyping] - enable or disable automatic typing
 * @prop {ILogger} [log] - console like error logger
 * @prop {object} [defaultState] - default chat state
 * @prop {boolean} [autoSeen] - send seen automatically
 * @prop {number} [redirectLimit] - maximum number of redirects at single request
 * @prop {string} [secret] - Secret for calling orchestrator API
 * @prop {string} [apiUrl] - Url for calling orchestrator API
 * @prop {Function} [fetch] - Fetch function for calling orchestrator API
 * @prop {number} [sessionDuration] - Session duration for analytic purposes
 * @prop {LLMConfiguration} [llm] - LLM model configuration
 * @prop {Preloader<R>} [preloader]
 */

/**
 * @typedef {object} IntentAction
 * @prop {string} action
 * @prop {Intent} intent
 * @prop {number} sort
 * @prop {number} [score]
 * @prop {boolean} local
 * @prop {boolean} aboveConfidence
 * @prop {boolean} [winner]
 * @prop {object} meta
 * @prop {string} title
 * @prop {string} [meta.targetAppId]
 * @prop {string|null} [meta.targetAction]
 */

/**
 * @typedef {object} IStateStorage
 * @prop {Function} saveState
 * @prop {Function} getState
 * @prop {Function} getOrCreateAndLock
 */

/**
 * @template {ReducerWrapper|Router|BuildRouter} T
 * @callback Preloader
 * @param {T} router
 * @param {Ai} ai
 * @returns {Promise<void>}
 */

function NAME_FROM_STATE (state) {
    if (state.user && state.user.firstName) {
        return `${state.user.firstName} ${state.user.lastName}`;
    }
    if (state.user && state.user.name) {
        return `${state.user.name}`;
    }
    return null;
}

const MAX_TS = 9999999999999;
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function toBase (number) {
    let result = '';
    let integer = number;

    do {
        result = CHARS[integer % 62] + result;
        integer = Math.floor(integer / 62);
    } while (integer > 0);

    return result;
}

/**
 * Messaging event processor
 *
 * @template {ReducerWrapper|Router|BuildRouter} T
 * @class
 * @fires Processor#interaction
 */
class Processor extends EventEmitter {

    /**
     * Creates an instance of Processor
     *
     * @param {T} reducer
     * @param {ProcessorOptions<T>} [options] - processor options
     *
     * @memberOf Processor
     */
    constructor (reducer, options = {}) {
        super();

        this.options = {
            appUrl: '',
            stateStorage: new MemoryStateStorage(),
            tokenStorage: null,
            translator: (w) => w,
            timeout: 30000,
            waitForLockedState: 12000,
            retriesWhenWaiting: 6,
            justUpdateTimeout: 1000,
            log: console,
            defaultState: {},
            autoTyping: false,
            autoSeen: false,
            redirectLimit: 20,
            nameFromState: NAME_FROM_STATE,
            sessionDuration: 1800000 // 30 minutes
        };

        Object.assign(this.options, options);

        this._preloaders = options.preloader ? [options.preloader] : [];

        this.reducer = reducer;

        /**
         * @type {IStateStorage}
         */
        this.stateStorage = this.options.stateStorage;

        this.tokenStorage = this.options.tokenStorage;

        /**
         * @type {Plugin[]}
         * @private
         */
        this._plugins = [];
        this._middlewares = [];

        /** @type {IInteractionHandler[]} */
        this._onInteractionHandlers = [];
    }

    /**
     * Register asynchronous interaction handler function
     *
     * @param {IInteractionHandler} handler
     * @returns {this}
     */
    onInteraction (handler) {
        this._onInteractionHandlers.push(handler);
        return this;
    }

    /**
     *
     * @param {Plugin} plugin
     */
    plugin (plugin) {
        this._plugins.push(plugin);
        // @ts-ignore
        if (typeof plugin.middleware === 'function') {
            this.options.log.warn('Middleware functions in Processor plugins are deprecated');
            // @ts-ignore
            this._middlewares.push(plugin.middleware());
        }
    }

    _createPostBack (postbackAcumulator, req, res, features) {
        const postBack = (action, inputData = {}, dispatchSync = false) => {
            let data = inputData;
            if (typeof data === 'function') {
                // @ts-ignore
                data = data();
            }

            if (dispatchSync) {
                let previousAction;
                return Promise.resolve(data)
                    .then((resolvedData) => {
                        let reduceResult;
                        Object.assign(resolvedData, { _localpostback: true });
                        previousAction = req.setAction(action, resolvedData);
                        if (typeof this.reducer === 'function') {
                            // @ts-ignore
                            reduceResult = this.reducer(req, res, postBack);
                        } else {
                            reduceResult = this.reducer.reduce(req, res, postBack);
                        }
                        return reduceResult;
                    })
                    .then((reduceResult) => {
                        req.setAction(previousAction);
                        return reduceResult;
                    });
            }

            res.finalMessageSent = true;

            if (data instanceof Promise) {
                postbackAcumulator.push(data
                    .then((result) => ({
                        action,
                        data: Object.assign(result || {}, { _localpostback: true }),
                        features
                    })));
            } else {
                Object.assign(data, { _localpostback: true });
                postbackAcumulator.push({ action, data, features });
            }

            return Promise.resolve(undefined);
        };

        return postBack;
    }

    async _reportError (pageId, err, event, senderId = null) {
        if (err.code === 204) {
            this.options.log.log(`nothing sent: ${err.message}`, event);
            return;
        }
        if (err.code !== 403) {
            this.options.log.error(err, event);
        }
        if (!senderId) {
            return;
        }
        try {
            const state = await this._loadState(senderId, pageId, this.options.justUpdateTimeout);

            Object.assign(state, {
                lastSendError: new Date(),
                lastErrorMessage: err.message,
                lastErrorCode: err.code,
                lastInteraction: new Date()
            });

            await this.stateStorage.saveState(state);
        } catch (e) {
            this.options.log.error(`failed to log error "${err.message}" because: ${e.message}`, e, err);
        }
    }

    async _preload () {
        return Promise.all([
            Ai.ai.preloadDetectors(),
            // @ts-ignore
            this.reducer && typeof this.reducer.preload === 'function'
                // @ts-ignore
                ? this.reducer.preload()
                : Promise.resolve(),
            ...this._preloaders
                .map((preloader) => preloader(this.reducer, Ai.ai))
        ]).catch((e) => this.options.log.error('preload error', e))
            // mute log errors
            .catch(() => {});
    }

    async processMessage (
        message,
        pageId = null,
        messageSender = new ReturnSender(
            {},
            message && message.sender && message.sender.id,
            message
        ),
        responderData = {}
    ) {
        const preloadPromise = this._preload();

        try {
            for (const plugin of this._plugins) {
                if (typeof plugin.processMessage !== 'function') continue;

                const res = await plugin.processMessage(message, pageId, messageSender);
                if (typeof res !== 'object' || typeof res.status !== 'number') {
                    throw new Error('The plugin should always return the status code');
                }
                if (res.status === 200) {
                    await preloadPromise;
                    return res;
                }
            }
        } catch (e) {
            await preloadPromise;
            const { code = 500 } = e;
            await this._reportError(pageId, e, message);
            return { status: code };
        }

        if (typeof message !== 'object' || message === null
            || !((message.sender && message.sender.id) || message.optin)
            || !(message.message || message.referral || message.optin
                || typeof message.intent === 'string'
                || (Array.isArray(message.entities) && message.entities.length !== 0)
                || message.pass_thread_control || message.postback
                || message.set_context
                || message.context
                || message.take_thread_control)) {

            this.options.log.warn('message should be a valid messaging object', message);
            await preloadPromise;
            return { status: 400 };
        }

        const senderId = message.sender && message.sender.id;

        // ignore messages from the page
        if (pageId === senderId && senderId) {
            await preloadPromise;
            return { status: 304 };
        }

        const llmOptions = {
            provider: new LLMMockProvider(),
            ...this.options.llm
        };

        if (typeof messageSender.logPrompt === 'function') {
            Object.assign(llmOptions, {
                logger: messageSender
            });
        }

        const llm = new LLM(llmOptions, Ai.ai);

        const result = await this
            ._dispatch(message, pageId, messageSender, responderData, preloadPromise, llm);

        messageSender.defer(preloadPromise, this.options.log);
        return result;
    }

    async _dispatch (message, pageId, messageSender, responderData, preloadPromise, llm) {
        let req;
        let res;
        let state;
        let data;
        const errorHandler = (...e) => this._reportError(pageId, ...e);
        try {
            ({
                req, res, data, state
            } = await this
                ._processMessage(
                    message,
                    pageId,
                    messageSender,
                    responderData,
                    llm,
                    preloadPromise
                ));

            messageSender.defer(this._emitInteractionEvent(req, res, messageSender, state, data));

            return messageSender.finished(req, res, null, errorHandler);
        } catch (e) {
            req = req || e.req;
            res = res || e.res;
            return messageSender.finished(req, res, e, errorHandler);
        }
    }

    /**
     *
     * @param {Request} req
     * @param {Responder} res
     * @param {ReturnSender} messageSender
     * @param {object} state
     * @param {object} data
     * @returns {Promise}
     */
    _emitInteractionEvent (req, res, messageSender, state, data) {
        const doNotTrack = data._initialEventShouldNotBeTracked === true;
        const { _lastAction: lastAction = null, '§pathname': pathname = null } = req.state;
        const actions = messageSender.visitedInteractions;
        const skill = typeof res.newState._trackAsSkill === 'undefined'
            ? (req.state._trackAsSkill || null)
            : res.newState._trackAsSkill;
        const prevSkill = typeof res.newState._trackPrevSkill === 'undefined'
            ? (req.state._trackPrevSkill || null)
            : res.newState._trackPrevSkill;
        const { events = [] } = messageSender.tracking;

        const event = {
            doNotTrack,
            responseTexts: messageSender.responseTexts,
            req,
            actions,
            lastAction,
            state,
            data,
            skill,
            prevSkill,
            pathname,
            tracking: messageSender.tracking,
            events,
            flag: res.senderMeta.flag,
            nonInteractive: !isUserInteraction(req) || doNotTrack
        };

        return Promise.allSettled([
            ...this._onInteractionHandlers
                .map((handler) => Promise.resolve(handler(event))
                    .catch((e) => {
                        this.options.log.error('Executing Processor interaction event failed', e);
                    })),
            new Promise((resolve) => {
                process.nextTick(() => {
                    try {
                        this.emit('interaction', event);
                    } catch (e) {
                        this.options.log.error('Firing Processor interaction event failed', e);
                    }
                    resolve();
                });
            })
        ]);
    }

    /**
     * Get matching NLP intents
     *
     * @param {string|object} text
     * @param {string} [pageId]
     * @param {string} [lang]
     * @param {boolean} [allowEmptyAction]
     * @returns {Promise<IntentAction[]>}
     */
    async aiActionsForText (text, pageId = 'none', lang = null, allowEmptyAction = false) {
        try {
            // @ts-ignore
            if (this.reducer && typeof this.reducer.preload === 'function') {
                // @ts-ignore
                await this.reducer.preload();
            }

            const request = typeof text === 'string'
                ? Request.text('none', text)
                : text;
            // @ts-ignore
            const req = new Request(request, { lang }, pageId, this.reducer.globalIntents);

            await Ai.ai.preloadAi(req);

            const actions = req.aiActions();

            if (actions.length === 0 && allowEmptyAction && req.intents.length > 0) {
                const [intent] = req.intents;

                return [
                    {
                        intent,
                        action: null,
                        sort: intent.score,
                        local: false,
                        aboveConfidence: intent.score >= Ai.ai.confidence,
                        meta: {},
                        title: null
                    }
                ];
            }

            return actions
                .map((a) => ({
                    ...a,
                    title: typeof a.title === 'function'
                        ? a.title(req)
                        : a.title
                }));
        } catch (e) {
            this.options.log.error('failed to fetch intent actions', e);
            return [];
        }
    }

    async _processMessage (
        message,
        pageId,
        messageSender,
        responderData,
        llm,
        preloadPromise = null,
        senderMeta = null
    ) {
        let senderId = message.sender && message.sender.id;
        const fromEvent = !!preloadPromise;

        // prevent infinite cycles
        let { _actionCount: actionCount = 0 } = responderData;
        actionCount++;
        if (actionCount >= this.options.redirectLimit) {
            return Promise.reject(new Error(`Reached ${actionCount} redirects on ${JSON.stringify(message)}. Check cyclic redirects.`));
        }
        Object.assign(responderData, { _actionCount: actionCount, _fromInitialEvent: fromEvent });
        if (responderData._initialEventWasntTracked) {
            Object.assign(responderData, {
                _fromUntrackedInitialEvent: true, _initialEventWasntTracked: false
            });
        } else if (responderData._fromUntrackedInitialEvent) {
            Object.assign(responderData, { _fromUntrackedInitialEvent: false });
        }

        const postbackAcumulator = [];

        const [originalState, token] = await Promise.all([
            this._loadState(senderId, pageId, this.options.timeout),
            this._getOrCreateToken(senderId, pageId)
        ]);

        let stateObject = originalState;
        let req;
        let res;

        // let emitPromise = Promise.resolve();

        try {
            // ensure the request was not processed
            const timestamp = message.timestamp || Date.now();
            if (fromEvent
                    && stateObject.lastTimestamps && message.timestamp
                    && stateObject.lastTimestamps.indexOf(timestamp) !== -1) {
                throw Object.assign(new Error('Message has been already processed'), { code: 204 });
            }

            // update state before run
            const modState = await messageSender.modifyStateAfterLoad(stateObject, this);
            if (modState) {
                const modStateCopy = { ...modState };
                if (modStateCopy.state) {
                    Object.assign(stateObject.state, modStateCopy.state);
                    delete modStateCopy.state;
                }
                Object.assign(stateObject, modStateCopy);
            }

            // prepare request and responder
            let { state } = stateObject;
            let configuration = {};
            if ('getConfiguration' in this.reducer) {
                configuration = this.reducer.getConfiguration();
                if (configuration instanceof Promise) {
                    configuration = await configuration;
                }
            }

            // @ts-ignore
            req = new Request(
                message,
                state,
                pageId,
                // @ts-ignore
                this.reducer.globalIntents,
                {
                    apiUrl: this.options.apiUrl,
                    secret: this.options.secret,
                    fetch: this.options.fetch,
                    appId: responderData.appId
                },
                configuration
            );

            // process session
            if (fromEvent) {
                let {
                    _sct: sessionCount = 0,
                    _sid: sessionId = null,
                    _sst: sessionStart = 0,
                    _sts: sessionTs = (state._segStamp || 0),
                    _snew: sessionCreated
                } = state;

                const interactive = isUserInteraction(req);

                const sessionExpired = interactive
                    && (sessionTs + this.options.sessionDuration) < timestamp;

                if (sessionExpired || !sessionId) {
                    sessionStart = timestamp;
                    sessionTs = timestamp;
                    sessionId = Processor._createSessionId(req.pageId, req.senderId, timestamp);
                    sessionCount++;
                    sessionCreated = true;
                } else {
                    sessionCreated = false;

                    if (interactive) {
                        sessionTs = timestamp;
                    }
                }

                Object.assign(state, {
                    _sct: sessionCount,
                    _sid: sessionId,
                    _sst: sessionStart,
                    _sts: sessionTs,
                    _snew: sessionCreated
                });
            } /* else {
                Object.assign(state, {
                    _snew: false
                });
            } */

            prepareState(state, fromEvent, state._snew && fromEvent);

            const features = [
                ...(this.options.features || []),
                ...req.features
            ];
            const options = {
                ...this.options,
                state: Object.freeze({ ...state }),
                features,
                pageId
            };

            res = new Responder(
                senderId,
                messageSender,
                token,
                options,
                responderData,
                configuration,
                senderMeta,
                llm
            );
            const postBack = this._createPostBack(postbackAcumulator, req, res, features);

            let continueDispatching = true;

            // run plugins
            for (const plugin of this._plugins) {
                if (typeof plugin.beforeAiPreload !== 'function') continue;

                let out = plugin.beforeAiPreload(req, res);
                if (out instanceof Promise) out = await out;

                if (!out) { // end
                    continueDispatching = false;
                    break;
                }
            }

            await Promise.all([
                preloadPromise,
                Ai.ai.preloadAi(req, res)
            ]);

            // @deprecated backward compatibility
            const aByAi = req.actionByAi();
            if (aByAi && aByAi !== req.action()) {
                res.setBookmark(aByAi);
            }

            // process setState
            const setState = req.getSetState(req.AI_SETSTATE.EXCLUDE_WITH_SET_ENTITIES);
            await Ai.ai.processSetStateEntities(req, setState);
            const afterSetState = req
                .getSetState(req.AI_SETSTATE.EXCLUDE_WITHOUT_SET_ENTITIES, setState);
            const aiSetState = req.getSetState(req.AI_SETSTATE.ONLY);
            Object.assign(req.state, setState, aiSetState, afterSetState);
            res.setState({ ...setState, ...aiSetState, ...afterSetState });

            // attach sender meta
            const data = req.actionData();

            if (typeof data._senderMeta === 'object') {
                res._senderMeta = { ...data._senderMeta };
            }

            if (continueDispatching) {
                // process plugin middlewares
                for (const plugin of this._plugins) {
                    if (typeof plugin.beforeProcessMessage !== 'function') continue;

                    let out = plugin.beforeProcessMessage(req, res);
                    if (out instanceof Promise) out = await out;

                    if (!out) { // end
                        continueDispatching = false;
                        break;
                    }
                }
            }

            if (continueDispatching) {
                // process plugin middlewares
                for (const middleware of this._middlewares) {
                    let out = middleware(req, res, postBack);
                    if (out instanceof Promise) out = await out;

                    if (out === null) { // end
                        continueDispatching = false;
                        break;
                    }
                }
            }

            if (continueDispatching) {
                if (this.options.autoSeen
                    && res.isResponseType() // do not send seen, if it's a campaign
                    && (!req.isReferral() || req.action())
                    && fromEvent) {

                    res.seen();
                }
                // process the event
                const reduceResult = this.reducer.reduce(req, res, postBack);

                if (reduceResult instanceof Promise) { // note the result can be undefined
                    await reduceResult;
                }

                if (fromEvent) {
                    messageSender.defer(this._emitEvent(req, res), this.options.log);
                }
            }

            if (continueDispatching) {
                for (const plugin of this._plugins) {
                    if (typeof plugin.afterProcessMessage !== 'function') continue;

                    await Promise.resolve(plugin.afterProcessMessage(req, res));
                }
            }

            // update state
            const senderUpdate = await messageSender.modifyStateBeforeStore(req, res);

            if (senderUpdate && senderUpdate.senderId) {
                senderId = senderUpdate.senderId; // eslint-disable-line prefer-destructuring
                stateObject = await this
                    ._loadState(senderId, pageId, this.options.justUpdateTimeout);
                state = stateObject.state; // eslint-disable-line prefer-destructuring
            }

            const lastInTurnover = postbackAcumulator.length === 0;
            state = mergeState(state, req, res, senderUpdate, fromEvent, lastInTurnover);

            let lastTimestamps = stateObject.lastTimestamps || [];
            if (message.timestamp) {
                lastTimestamps = lastTimestamps.slice(-9);
                lastTimestamps.push(timestamp);
            }

            Object.assign(stateObject, {
                state,
                lastTimestamps,
                lastInteraction: new Date(),
                off: false,
                name: this.options.nameFromState(state)
            });

            if (senderUpdate) {
                delete senderUpdate.state;
                Object.assign(stateObject, senderUpdate);
            }

        } catch (e) {
            await this.stateStorage.saveState(originalState);
            // await emitPromise;
            Object.assign(e, { req, res });
            throw e;
        }

        if (postbackAcumulator.length === 0) {
            messageSender.defer(this.stateStorage.saveState(stateObject));
            return {
                req, res, data: res.data, state: stateObject.state
            };
        }

        try {

            await this.stateStorage.saveState(stateObject);

            // process postbacks
            const {
                state = stateObject.state,
                data = res.data
            } = await this._processPostbacks(
                postbackAcumulator,
                senderId,
                pageId,
                messageSender,
                responderData,
                llm,
                res.senderMeta
            );

            // await emitPromise; // probably has been resolved this time

            return {
                req, res, data, state
            };
        } catch (e) {
            Object.assign(e, { req, res });
            throw e;
        }
    }

    static _shakeShort (str, outputLength) {
        const senderHash = crypto.createHash('shake256', { outputLength })
            .update(str)
            .digest('hex');

        return senderHash.match(/[a-f0-9]{1,13}/g)
            .map((v) => toBase(parseInt(v, 16)))
            .join('');
    }

    static _createSessionId (pageId, senderId, timestamp = Date.now()) {
        const senderShort = Processor._shakeShort(`${senderId}|${pageId}}`, 12);

        const rand = toBase(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));

        const randTS = toBase(Math.floor(Date.now() % 10000));

        const ts = toBase(Math.floor(MAX_TS - timestamp));

        // console.log({
        //     base: `${ts}.${senderShort}`.length,
        //     ts,
        //     senderShort,
        //     randTS,
        //     rand,
        //     randL: rand.length
        // });

        return `${ts}.${senderShort}`
            .padEnd(28, randTS)
            .padEnd(32, rand);
    }

    /**
     *
     * @private
     * @param {Request} req
     * @param {Responder} res
     */
    _emitEvent (req, res) {
        const { _lastAction: lastAction = null } = req.state;
        let { _lastAction: act = null } = res.newState;
        act = act || req.action();

        const shouldNotTrack = res.data._initialEventShouldNotBeTracked === true;

        if (shouldNotTrack) {
            return Promise.resolve();
        }

        const trackingSkill = typeof res.newState._trackAsSkill === 'undefined'
            ? (req.state._trackAsSkill || null)
            : res.newState._trackAsSkill;

        const params = [
            req.senderId,
            act,
            req.text(),
            req,
            lastAction,
            false,
            trackingSkill,
            res
        ];

        return new Promise((resolve) => {
            process.nextTick(() => {
                try {
                    this.emit('event', ...params);
                } catch (e) {
                    this.options.log.error('Firing Processor event failed', e);
                }
                resolve();
            });
        });
    }

    _processPostbacks (
        postbackAcumulator,
        senderId,
        pageId,
        messageSender,
        responderData,
        llm,
        senderMeta
    ) {
        return postbackAcumulator.reduce((promise, postback) => promise
            .then(() => postback)
            .then(({ action, data = {}, features }) => {
                let request;
                if (typeof action === 'object') {
                    request = action;
                } else {
                    request = Request.postBack(senderId, action, data);
                }
                Object.assign(request, { features });
                return this._processMessage(
                    request,
                    pageId,
                    messageSender,
                    responderData,
                    llm,
                    null,
                    senderMeta
                );
            }), Promise.resolve({}));
    }

    _getOrCreateToken (senderId, pageId) {
        if (!senderId || !this.tokenStorage) {
            return null;
        }

        return this.tokenStorage.getOrCreateToken(senderId, pageId)
            .then((token) => token.token);
    }

    _loadState (senderId, pageId, lock) {
        if (!senderId) {
            return Promise.resolve({
                state: { ...this.options.defaultState }
            });
        }

        return new Promise((resolve, reject) => {
            let retries = this.options.retriesWhenWaiting;

            const onLoad = (res) => {
                if (!res) {
                    if (retries-- < 0) {
                        this.stateStorage
                            .getState(senderId, pageId)
                            .then((state) => {
                                this.options.log.warn(`Locked state: ${senderId}, lock: ${lock}, at ${Date.now()}`, state);
                            })
                            .catch(() => {});

                        reject(new Error(`Loading state timed out: another event is blocking it (${senderId}, lock: ${lock})`));
                        return;
                    }

                    this._model(senderId, pageId, lock, retries)
                        .then(onLoad)
                        .catch(reject);
                } else {
                    resolve(res);
                }
            };

            onLoad();
        });
    }

    _wait () {
        const wait = Math.round(this.options.waitForLockedState / this.options.retriesWhenWaiting);
        return new Promise((r) => setTimeout(() => r(null), wait));
    }

    _model (senderId, pageId, timeout, retries) {
        const { defaultState } = this.options;

        const now = Date.now();
        const warnIfItTookTooLong = (r = null) => {
            const duration = Date.now() - now;
            if (duration >= (this.options.waitForLockedState / 2)) {
                try {
                    this.options.log.warn(`Loading state (${senderId}) for timeout ${timeout} took too long (${duration}ms).`);
                } catch (e) {
                    // noop
                }
            }
            return r;
        };

        return this.stateStorage
            .getOrCreateAndLock(senderId, pageId, { ...defaultState }, timeout)
            .then(warnIfItTookTooLong)
            .catch((err) => {
                warnIfItTookTooLong();
                if (!err || err.code !== 11000) {
                    this.options.log.error('Bot processor load error', err);
                }
                if (retries === 0) {
                    return null;
                }
                return this._wait();
            });
    }

}

// console.log(Processor._createSessionId('p', 's'));

module.exports = Processor;
