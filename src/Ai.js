/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const { WingbotModel } = require('./wingbot');

const DEFAULT_PREFIX = 'default';

/**
 * @class Ai
 */
class Ai {

    constructor () {
        this._keyworders = new Map();

        /**
         * Upper threshold - for match method and for navigate method
         *
         * @type {number}
         */
        this.confidence = 0.94;

        /**
         * The logger (console by default)
         *
         * @type {Object}
         */
        this.logger = console;

        /**
         * The prefix translator - for request-specific prefixes
         *
         * @param {string} prefix
         * @param {Request} req
         */
        this.getPrefix = (prefix, req) => prefix; // eslint-disable-line

        this._mockIntent = null;

        /**
         * Backward compatibility - to be able to use older "callback" middleware
         *
         * @type {boolean}
         */
        this.disableBookmarking = false;
    }

    /**
     * Usefull method for testing AI routes
     *
     * @param {string} [intent] - intent name
     * @param {number} [confidence] - the confidence of the top intent
     * @returns {this}
     * @example
     * const { Tester, ai, Route } = require('bontaut');
     *
     * const bot = new Route();
     *
     * bot.use(['intentAction', ai.match('intentName')], (req, res) => {
     *     res.text('PASSED');
     * });
     *
     * describe('bot', function () {
     *     it('should work', function () {
     *         ai.mockIntent('intentName');
     *
     *         const t = new Tester(bot);
     *
     *         return t.text('Any text')
     *             .then(() => {
     *                 t.actionPassed('intentAction');
     *
     *             t.any()
     *                 .contains('PASSED');
     *         })
     *     });
     * });
     */
    mockIntent (intent = null, confidence = null) {
        if (intent === null) {
            this._mockIntent = null;
        } else {
            this._mockIntent = { intent, confidence };
        }
        return this;
    }

    /**
     * Registers Wingbot AI model
     *
     * @template T
     * @param {string|WingbotModel|T} model - wingbot model name or AI plugin
     * @param {string} prefix - model prefix
     *
     * @returns {WingbotModel|T}
     * @memberOf Ai
     */
    register (model, prefix = 'default') {
        let modelObj;

        if (typeof model === 'string') {
            modelObj = new WingbotModel({
                model
            }, this.logger);
        } else {
            modelObj = model;
        }

        this._keyworders.set(prefix, modelObj);

        return modelObj;
    }

    /**
     * Middleware, which ensures, that AI data are properly loaded in Request
     *
     * @param {string} prefix - AI model prefix
     * @example
     * const { ai, Router } = require('wingbot');
     *
     * const bot = new Router();
     *
     * bot.use(ai.load());
     */
    load (prefix = DEFAULT_PREFIX) {
        return async (req) => {
            if (!req.isText()) {
                return true;
            }

            if (!req._intents) {
                req._intents = await this._queryModel(prefix, req);
            }

            return true;
        };
    }

    /**
     * Returns matching middleware
     *
     * @param {string|Array} intent
     * @param {number} [confidence]
     * @param {string} [prefix]
     * @returns {Function} - the middleware
     * @memberOf Ai
     * @example
     * const { Router, ai } = require(''wingbot');
     *
     * ai.register('app-model');
     *
     * bot.use(ai.match('intent1'), (req, res) => {
     *     console.log(req.intent(true)); // { intent: 'intent1', score: 0.9604 }
     *
     *     res.text('Oh, intent 1 :)');
     * });
     */
    match (intent, confidence = null, prefix = DEFAULT_PREFIX) {
        const intents = Array.isArray(intent) ? intent : [intent];

        return async (req, res) => {
            if (!req.isText()) {
                return false;
            }

            if (!req._intents) {
                req._intents = await this._queryModel(prefix, req);
            }

            if (req._intents.length === 0) {
                return false;
            }

            const [winningIntent] = req._intents;

            const useConfidence = confidence === null
                ? this.confidence
                : confidence;

            if (!intents.includes(winningIntent.intent)
                    || winningIntent.score < useConfidence) {

                return false;
            }

            const action = req.action();

            // when there's an action, store the current path as a bookmark
            if (!this.disableBookmarking && action && action !== res.currentAction()) {
                res.setBookmark();
                return false;
            }

            return true;
        };
    }

    /**
     * Returns matching middleware, that will export the intent to the root router
     * so the intent will be matched in a global context
     *
     * @param {string|Array} intent
     * @param {number} [confidence]
     * @returns {Function} - the middleware
     * @memberOf Ai
     * @example
     * const { Router, ai } = require(''wingbot');
     *
     * ai.register('app-model');
     *
     * bot.use(ai.match('intent1'), (req, res) => {
     *     console.log(req.intent(true)); // { intent: 'intent1', score: 0.9604 }
     *
     *     res.text('Oh, intent 1 :)');
     * });
     */
    globalMatch (intent, confidence = null) {
        const resolver = this.match(intent, confidence);
        const intents = Array.isArray(intent)
            ? intent
            : [intent];
        // @ts-ignore
        resolver.globalIntents = intents.map(i => ({
            intent: i,
            path: '/*'
        }));

        // @todo same interface as a router to be able to scale the feature

        return resolver;
    }

    _getModelForRequest (req, prefix = DEFAULT_PREFIX) {
        const prefixForRequest = this.getPrefix(prefix, req);
        return this._keyworders.get(prefixForRequest);
    }

    _getMockIntent (req) {
        if (this._mockIntent !== null) {
            return [{
                intent: this._mockIntent.intent,
                score: this._mockIntent.confidence || this.confidence
            }];
        } else if (req.data && req.data.intent) {
            return [{
                intent: req.data.intent,
                score: this.confidence
            }];
        }
        return null;
    }

    async preloadIntent (req) {
        if (req._intents || !req.isText()) {
            return;
        }
        const mockIntent = this._getMockIntent(req);
        if (mockIntent) {
            req._intents = mockIntent;
        } else if (!req._intents && this._keyworders.size !== 0 && req.isText()) {
            const model = this._getModelForRequest(req);
            if (!model) {
                return;
            }
            req._intents = await this._queryModel(DEFAULT_PREFIX, req, model);
        }
    }

    async _queryModel (prefix, req, useModel = null) {
        const mockIntent = this._getMockIntent(req);
        if (mockIntent) {
            return mockIntent;
        }
        let model = useModel;
        if (!model) {
            model = this._getModelForRequest(req, prefix);
            assert.ok(!!model, 'The AI model should be registered!');
        }
        return model.resolve(req.text(), req);
    }

}

Ai.ai = new Ai();

module.exports = Ai;
