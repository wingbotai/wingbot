/*
 * @author David Menger
 */
'use strict';

const EventEmitter = require('events');
const { MemoryStateStorage } = require('./tools');
const Responder = require('./Responder');
const Request = require('./Request');
const ReturnSender = require('./ReturnSender');

/**
 * @typedef {Object} AutoTypingConfig
 * @prop {number} time - duration
 * @prop {number} perCharacters - number of characters
 * @prop {number} minTime - minimum writing time
 * @prop {number} maxTime - maximum writing time
 */

/**
 * @typedef {Object} Plugin
 * @prop {Function} middleware
 * @prop {Function} processMessage
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
     * @param {Object} [options] - processor options
     * @param {string} [options.appUrl] - url basepath for relative links
     * @param {Object} [options.stateStorage] - chatbot state storage
     * @param {Object} [options.tokenStorage] - frontend token storage
     * @param {Function} [options.translator] - text translate function
     * @param {number} [options.timeout] - text translate function
     * @param {Function} [options.nameFromState] - override the name translator
     * @param {boolean|AutoTypingConfig} [options.autoTyping] - enable or disable automatic typing
     * @param {Function} [options.log] - console like error logger
     * @param {Object} [options.defaultState] - default chat state
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
            translator: w => w,
            timeout: 30000,
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
        this._middlewares.push(plugin.middleware());
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
                    .then(result => ({
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

        this._loadState(senderId, pageId, 500)
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
        // @ts-ignore
        if (this.reducer && typeof this.reducer.preload === 'function') {
            // @ts-ignore
            this.reducer.preload()
                .catch(e => this.options.log.error('preload error', e));
        }

        try {
            for (const plugin of this._plugins) {
                const res = await plugin.processMessage(message, pageId, messageSender);
                if (typeof res !== 'object' || typeof res.status !== 'number') {
                    throw new Error('The plugin should always return the status code');
                }
                if (res.status === 200) {
                    return res;
                }
            }
        } catch (e) {
            const { code = 500 } = e;
            this.reportSendError(e, message, pageId);
            return { status: code };
        }

        if (typeof message !== 'object' || message === null
            || !((message.sender && message.sender.id) || message.optin)
            || !(message.message || message.referral || message.optin
                || message.pass_thread_control || message.postback
                || message.take_thread_control)) {

            this.options.log.warn('message should be an object', message);
            return { status: 400 };
        }

        const senderId = message.sender && message.sender.id;

        // ignore messages from the page
        if (pageId === senderId && senderId) {
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

    async _processMessage (message, pageId, messageSender, responderData, fromEvent = false) {
        let senderId = message.sender && message.sender.id;

        // prevent infinite cycles
        let { _actionCount: actionCount = 0 } = responderData;
        actionCount++;
        if (actionCount >= this.options.redirectLimit) {
            return Promise.reject(new Error(`Reached ${actionCount} redirects on ${JSON.stringify(message)}. Check cyclic redirects.`));
        }
        Object.assign(responderData, { _actionCount: actionCount });

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
                const modStateCopy = Object.assign({}, modState);
                if (modStateCopy.state) {
                    Object.assign(stateObject.state, modStateCopy.state);
                    delete modStateCopy.state;
                }
                Object.assign(stateObject, modStateCopy);
            }

            // prepare request and responder
            let { state } = stateObject;

            req = new Request(message, state, pageId);
            res = new Responder(senderId, messageSender, token, this.options, responderData);
            const postBack = this._createPostBack(postbackAcumulator, req, res);

            let continueToReducer = true;
            // process plugin middlewares
            for (const middleware of this._middlewares) {
                let middlewareRes = middleware(req, res, postBack);
                if (middlewareRes instanceof Promise) {
                    middlewareRes = await middlewareRes;
                }
                if (middlewareRes === null) { // end
                    continueToReducer = false;
                    break;
                }
            }

            if (continueToReducer) {
                if (this.options.autoSeen && (!req.isReferral() || req.action()) && fromEvent) {
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

            // update state
            const senderUpdate = await messageSender.modifyStateBeforeStore(req, res);

            if (senderUpdate && senderUpdate.senderId) {
                senderId = senderUpdate.senderId; // eslint-disable-line prefer-destructuring
                stateObject = await this._loadState(senderId, pageId, 500);
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
        const { _lastAction: act = null } = res.newState;
        const params = [req.senderId, act, req.text(), req, lastAction];

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
        const state = Object.assign({}, previousState, res.newState);

        const isUserEvent = req.isMessage() || req.isPostBack()
            || req.isReferral() || req.isAttachment();

        // reset expectations
        if (isUserEvent && !res.newState._expected) {
            state._expected = null;
        }

        // reset expectated keywords
        if (isUserEvent && !res.newState._expectedKeywords) {
            state._expectedKeywords = null;
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
            .then(token => token.token);
    }

    _loadState (senderId, pageId, lock = 0) {
        if (!senderId) {
            return Promise.resolve({
                state: Object.assign({}, this.options.defaultState)
            });
        }

        return new Promise((resolve, reject) => {
            let retrys = lock === 0 ? 0 : 8;

            const onLoad = (res) => {
                if (!res) {
                    if (retrys-- < 0) {
                        reject(new Error('Bot processor timed out'));
                        return;
                    }

                    this._model(senderId, pageId, lock)
                        .then(onLoad)
                        .catch(reject);
                } else {
                    resolve(res);
                }
            };

            onLoad();
        });
    }

    _wait (timeout) {
        const wait = Math.min(timeout + 50, 1000);
        return new Promise(r => setTimeout(() => r(null), wait));
    }

    _model (senderId, pageId, timeout) {
        const { defaultState } = this.options;
        return this.stateStorage
            .getOrCreateAndLock(senderId, pageId, defaultState, timeout)
            .catch((err) => {
                if (!err || err.code !== 11000) {
                    this.options.log.error('Bot processor load error', err);
                }
                return this._wait(timeout);
            });
    }

}

module.exports = Processor;
