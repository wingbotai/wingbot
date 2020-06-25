/*
 * @author David Menger
 */
'use strict';

const EventEmitter = require('events');
const { MemoryStateStorage } = require('./tools');
const Responder = require('./Responder');
const Request = require('./Request');
const Ai = require('./Ai');
const ReturnSender = require('./ReturnSender');

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

const NAME_FROM_STATE = (state) => {
    if (state.user && state.user.firstName) {
        return `${state.user.firstName} ${state.user.lastName}`;
    }
    if (state.user && state.user.name) {
        return `${state.user.name}`;
    }
    return null;
};

class Processor extends EventEmitter {

    /**
     * Creates an instance of Processor
     *
     * @param {ReducerWrapper|Function|Router} reducer
     * @param {object} [options] - processor options
     * @param {string} [options.appUrl] - url basepath for relative links
     * @param {object} [options.stateStorage] - chatbot state storage
     * @param {object} [options.tokenStorage] - frontend token storage
     * @param {Function} [options.translator] - text translate function
     * @param {number} [options.timeout] - chat sesstion lock duration (30000)
     * @param {number} [options.justUpdateTimeout] - simple read and write lock (1000)
     * @param {number} [options.waitForLockedState] - wait when state is locked (12000)
     * @param {number} [options.retriesWhenWaiting] - number of attampts (6)
     * @param {Function} [options.nameFromState] - override the name translator
     * @param {boolean|AutoTypingConfig} [options.autoTyping] - enable or disable automatic typing
     * @param {Function} [options.log] - console like error logger
     * @param {object} [options.defaultState] - default chat state
     * @param {boolean} [options.autoSeen] - send seen automatically
     * @param {boolean} [options.waitsForSender] - use 'false' resolve the processing promise
     *     without waiting for message sender
     * @param {number} [options.redirectLimit] - maximum number of redirects at single request
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
            waitsForSender: true
        };

        Object.assign(this.options, options);

        this.reducer = reducer;

        /**
         * @type {StateStorage}
         */
        this.stateStorage = this.options.stateStorage;

        this.tokenStorage = this.options.tokenStorage;

        /**
         * @type {Plugin[]}
         * @private
         */
        this._plugins = [];
        this._middlewares = [];
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

    _createPostBack (postbackAcumulator, req, res) {
        const postBack = (action, inputData = {}, dontWaitTillEndOfLoop = false) => {
            let data = inputData;
            if (typeof data === 'function') {
                // @ts-ignore
                data = data();
            }

            if (dontWaitTillEndOfLoop) {
                let previousAction;
                return Promise.resolve(data)
                    .then((resolvedData) => {
                        let reduceResult;
                        Object.assign(resolvedData, { _localpostback: true });
                        previousAction = req.setAction(action, resolvedData);
                        if (typeof this.reducer === 'function') {
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
                        data: Object.assign(result || {}, { _localpostback: true })
                    })));
            } else {
                Object.assign(data, { _localpostback: true });
                postbackAcumulator.push({ action, data });
            }

            return Promise.resolve();
        };

        return postBack;
    }

    reportSendError (err, message, pageId) {
        if (err.code === 204) {
            this.options.log.info('nothing sent', message);
            return;
        }
        if (err.code !== 403) {
            this.options.log.error(err, message);
        }
        if (!message || !message.sender || !message.sender.id) {
            return;
        }
        const senderId = message.sender.id;

        this._loadState(senderId, pageId, this.options.justUpdateTimeout)
            .then((state) => {
                Object.assign(state, {
                    lastSendError: new Date(),
                    lastErrorMessage: err.message,
                    lastErrorCode: err.code
                });
                return this.stateStorage.saveState(state);
            })
            .catch((e) => {
                this.options.log.error(e);
            });
    }

    async _preload () {
        // @ts-ignore
        if (this.reducer && typeof this.reducer.preload === 'function') {
            // @ts-ignore
            return this.reducer.preload()
                .catch((e) => this.options.log.error('preload error', e))
                // mute log errors
                .catch(() => {});
        }
        return Promise.resolve();
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
            this.reportSendError(e, message, pageId);
            return { status: code };
        }

        if (typeof message !== 'object' || message === null
            || !((message.sender && message.sender.id) || message.optin)
            || !(message.message || message.referral || message.optin
                || typeof message.intent === 'string'
                || (Array.isArray(message.entities) && message.entities.length !== 0)
                || message.pass_thread_control || message.postback
                || message.take_thread_control)) {

            this.options.log.warn('message should be an object', message);
            await preloadPromise;
            return { status: 400 };
        }

        const senderId = message.sender && message.sender.id;

        // ignore messages from the page
        if (pageId === senderId && senderId) {
            await preloadPromise;
            return { status: 304 };
        }

        let result;
        try {
            const { req, res } = await this
                ._processMessage(message, pageId, messageSender, responderData, true);

            if (this.options.waitsForSender) {
                result = await messageSender.finished(req, res);
            } else {
                messageSender.finished(req, res).catch(() => {});
                result = { code: 200 };
            }
        } catch (e) {
            const { code = 500 } = e;
            this.reportSendError(e, message, pageId);
            result = { status: code, error: e.message };
        }
        await preloadPromise;
        return result;
    }

    async _finishSender (message, pageId, messageSender, req, res) {
        let result;
        try {
            result = await messageSender.finished(req, res);
        } catch (e) {
            const { code = 500 } = e;
            this.reportSendError(e, message, pageId);
            result = { status: code, error: e.message };
        }
        return result;
    }

    /**
     * Get matching NLP intents
     *
     * @param {string|object} text
     * @param {string} [pageId]
     * @param {boolean} [allowEmptyAction]
     * @returns {Promise<IntentAction[]>}
     */
    async aiActionsForText (text, pageId = 'none', allowEmptyAction = false) {
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
            const req = new Request(request, {}, pageId, this.reducer.globalIntents);

            await Ai.ai.preloadIntent(req);

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

    async _processMessage (message, pageId, messageSender, responderData, fromEvent = false) {
        let senderId = message.sender && message.sender.id;

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

        try {
            // ensure the request was not processed
            if (stateObject.lastTimestamps && message.timestamp
                    && stateObject.lastTimestamps.indexOf(message.timestamp) !== -1) {
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

            // @ts-ignore
            req = new Request(message, state, pageId, this.reducer.globalIntents);
            res = new Responder(senderId, messageSender, token, this.options, responderData);
            const postBack = this._createPostBack(postbackAcumulator, req, res);

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

            await Ai.ai.preloadIntent(req);

            // @deprecated backward compatibility
            const aByAi = req.actionByAi();
            if (aByAi && aByAi !== req.action()) {
                res.setBookmark(aByAi);
            }

            // process setState
            const setState = req.getSetState();
            Object.assign(req.state, setState);
            res.setState(setState);

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
                let reduceResult;
                if (typeof this.reducer === 'function') {
                    reduceResult = this.reducer(req, res, postBack);
                } else {
                    reduceResult = this.reducer.reduce(req, res, postBack);
                }
                if (reduceResult instanceof Promise) { // note the result can be undefined
                    await reduceResult;
                }

                if (fromEvent) {
                    this._emitEvent(req, res);
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

            state = this._mergeState(state, req, res, senderUpdate);

            let lastTimestamps = stateObject.lastTimestamps || [];
            if (message.timestamp) {
                lastTimestamps = lastTimestamps.slice(-9);
                lastTimestamps.push(message.timestamp);
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
            throw e;
        }

        await this.stateStorage.saveState(stateObject);

        // process postbacks
        await this._processPostbacks(
            postbackAcumulator,
            senderId,
            pageId,
            messageSender,
            responderData
        );

        return { req, res };
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
            return;
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

        process.nextTick(() => {
            try {
                this.emit('event', ...params);
            } catch (e) {
                this.options.log.error('Firing Processor event failed', e);
            }
        });
    }

    _processPostbacks (postbackAcumulator, senderId, pageId, messageSender, responderData) {
        return postbackAcumulator.reduce((promise, postback) => promise
            .then(() => postback)
            .then(({ action, data = {} }) => {
                let request;
                if (typeof action === 'object') {
                    request = action;
                } else {
                    request = Request.postBack(senderId, action, data);
                }
                return this._processMessage(request, pageId, messageSender, responderData);
            }), Promise.resolve());
    }

    _mergeState (previousState, req, res, senderStateUpdate) {
        const state = { ...previousState, ...res.newState };

        const isUserEvent = req.isMessage() || req.isPostBack()
            || req.isReferral() || req.isAttachment()
            || req.isTextOrIntent();

        // reset expectations
        if (isUserEvent && !res.newState._expected) {
            state._expected = null;
        }

        // reset expected keywords
        if (isUserEvent && !res.newState._expectedKeywords) {
            state._expectedKeywords = null;
        }

        // reset expected confident input
        if (isUserEvent
            && typeof state._expectedConfidentInput !== 'undefined'
            && !res.newState._expectedConfidentInput) {
            state._expectedConfidentInput = false;
        }

        if (senderStateUpdate && senderStateUpdate.state) {
            Object.assign(state, senderStateUpdate.state);
        }

        return state;
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
            .getOrCreateAndLock(senderId, pageId, defaultState, timeout)
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

module.exports = Processor;
