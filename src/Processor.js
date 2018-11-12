/*
 * @author David Menger
 */
'use strict';

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

class Processor {

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
     * @param {boolean|AutoTypingConfig} [options.autoTyping] - enable or disable automatic typing
     * @param {Function} [options.log] - console like error logger
     * @param {Object} [options.defaultState] - default chat state
     * @param {boolean} [options.autoSeen] - send seen automatically
     *
     * @memberOf Processor
     */
    constructor (reducer, options = {}) {
        this.options = {
            appUrl: '',
            stateStorage: new MemoryStateStorage(),
            tokenStorage: null,
            translator: w => w,
            timeout: 30000,
            log: console,
            defaultState: {},
            autoTyping: false,
            autoSeen: false
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

    _createPostBack (postbackAcumulator) {
        return (action, inputData = {}) => {
            let data = inputData;
            if (typeof data === 'function') {
                // @ts-ignore
                data = data();
            }

            if (data instanceof Promise) {
                postbackAcumulator.push(data
                    .then(result => ({ action, data: result || {} })));
            } else {
                postbackAcumulator.push({ action, data });
            }
        };
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
            await this._processMessage(message, pageId, messageSender, responderData, true);
            result = await messageSender.finished();
        } catch (e) {
            const { code = 500 } = e;
            this.reportSendError(e, message, pageId);
            result = { status: code };
        }
        return result;
    }

    async _processMessage (message, pageId, messageSender, responderData, fromEvent = false) {
        let senderId = message.sender && message.sender.id;

        const postbackAcumulator = [];

        const [originalState, token] = await Promise.all([
            this._loadState(senderId, pageId, this.options.timeout),
            this._getOrCreateToken(senderId, pageId)
        ]);

        let stateObject = originalState;

        try {
            // ensure the request was not processed
            if (stateObject.lastTimestamps && message.timestamp
                    && stateObject.lastTimestamps.indexOf(message.timestamp) !== -1) {
                throw Object.assign(new Error('Message has been already processed'), { code: 204 });
            }

            // prepare request and responder
            let { state } = stateObject;

            const req = new Request(message, state, pageId);
            const res = new Responder(senderId, messageSender, token, this.options, responderData);
            const postBack = this._createPostBack(postbackAcumulator);

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
                if (this.options.autoSeen && fromEvent) {
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
            }

            // update state
            const senderUpdate = await messageSender.modifyStateBeforeStore();

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
                off: false
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

        return true;
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

        if (senderStateUpdate && senderStateUpdate.state) {
            Object.assign(state, senderStateUpdate.state);
        }

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
            let retrys = lock === 0 ? 0 : 4;

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
        const wait = Math.min(timeout + 50, 2000);
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
