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
     *
     * @memberOf Processor
     */
    constructor (reducer, options = {}) {
        this.options = {
            appUrl: '',
            stateStorage: new MemoryStateStorage(),
            tokenStorage: null,
            translator: w => w,
            timeout: 300,
            log: console,
            defaultState: {},
            autoTyping: false
        };

        Object.assign(this.options, options);

        this.reducer = reducer;

        this.stateStorage = this.options.stateStorage;

        this.tokenStorage = this.options.tokenStorage;
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

    reportSendError (err, message) {
        if (!message || !message.sender || !message.sender.id) {
            return;
        }
        if (err.code !== 403) {
            this.options.log.error(err, message);
        }
        const senderId = message.sender.id;

        this._loadState(senderId)
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
        if (typeof message !== 'object' || message === null ||
            !((message.sender && message.sender.id) || message.optin)) {

            this.options.log.warn('message should be an object', message);
            return { status: 500 };
        }

        const senderId = message.sender && message.sender.id;

        // ignore messages from the page
        if (pageId === senderId && senderId) {
            return { status: 304 };
        }

        let result;
        try {
            await this._processMessage(message, pageId, messageSender, responderData);
            result = await messageSender.finished();
        } catch (e) {
            this.reportSendError(e, message);
            const { code = 500 } = e;
            this.options.log.error(e);
            result = { status: code };
        }
        return result;
    }

    async _processMessage (message, pageId, messageSender, responderData) {
        let senderId = message.sender && message.sender.id;

        const postbackAcumulator = [];

        let [stateObject, token] = await Promise.all([ // eslint-disable-line prefer-const
            this._loadState(senderId),
            this._getOrCreateToken(senderId)
        ]);

        // ensure the request was not processed
        if (stateObject.lastTimestamps && message.timestamp
                && stateObject.lastTimestamps.indexOf(message.timestamp) !== -1) {

            throw Object.assign(new Error('Message has been already processed'), { code: 403 });
        }

        // prepare request and responder
        let { state } = stateObject;

        const req = new Request(message, state, pageId);
        const res = new Responder(senderId, messageSender, token, this.options, responderData);
        const postBack = this._createPostBack(postbackAcumulator);

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

        // update state
        const senderUpdate = await messageSender.modifyStateBeforeStore();

        if (senderUpdate && senderUpdate.senderId) {
            senderId = senderUpdate.senderId; // eslint-disable-line prefer-destructuring
            stateObject = await this._loadState(senderId);
            state = stateObject.state; // eslint-disable-line prefer-destructuring
        }

        state = this._mergeState(state, req, res);

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
                const request = Request.postBack(senderId, action, data);
                return this._processMessage(request, pageId, messageSender, responderData);
            }), Promise.resolve());
    }

    _mergeState (previousState, req, res) {
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
        return state;
    }

    _getOrCreateToken (senderId) {
        if (!senderId || !this.tokenStorage) {
            return null;
        }

        return this.tokenStorage.getOrCreateToken(senderId)
            .then(token => token.token);
    }

    _loadState (senderId) {
        if (!senderId) {
            return Promise.resolve({
                state: Object.assign({}, this.options.defaultState)
            });
        }

        return new Promise((resolve, reject) => {
            let retrys = 4;

            const onLoad = (res) => {
                if (!res) {
                    if (retrys-- < 0) {
                        reject(new Error('Bot processor timed out'));
                        return;
                    }

                    this._model(senderId)
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
        return new Promise(r => setTimeout(() => r(null), this.options.timeout + 25));
    }

    _model (senderId) {
        const { timeout, defaultState } = this.options;
        return this.stateStorage
            .getOrCreateAndLock(senderId, defaultState, timeout)
            .catch((err) => {
                if (!err || err.code !== 11000) {
                    this.options.log.error('Bot processor load error', err);
                }
                return this._wait();
            });
    }

}

module.exports = Processor;
