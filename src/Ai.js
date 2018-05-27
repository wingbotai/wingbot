/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const { WingbotModel } = require('./wingbot');
const Router = require('./Router');

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
                return Router.CONTINUE;
            }

            if (!req._intents) {
                req._intents = await this._queryModel(prefix, req);
            }

            return Router.CONTINUE;
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
     *     console.log(req.intent()); // { intent: 'intent1', score: 0.9604 }
     *
     *     res.text('Oh, intent 1 :)');
     * });
     */
    match (intent, confidence = null, prefix = DEFAULT_PREFIX) {
        const intents = Array.isArray(intent) ? intent : [intent];

        return async (req) => {
            if (!req.isText()) {
                return Router.BREAK;
            }

            if (!req._intents) {
                req._intents = await this._queryModel(prefix, req);
            }

            if (req._intents.length === 0) {
                return Router.BREAK;
            }

            const [winningIntent] = req._intents;

            const useConfidence = confidence === null
                ? this.confidence
                : confidence;

            if (intents.includes(winningIntent.intent)
                    && winningIntent.score >= useConfidence) {

                return Router.CONTINUE;
            }

            return Router.BREAK;
        };
    }

    async _queryModel (prefix, req) {
        if (this._mockIntent !== null) {
            return [{
                intent: this._mockIntent.intent,
                score: this._mockIntent.confidence || this.confidence
            }];
        } else if (req.data.intent) {
            return [{
                intent: req.data.intent,
                score: this.confidence
            }];
        }
        const prefixForRequest = this.getPrefix(prefix, req);
        const model = this._keyworders.get(prefixForRequest);
        assert.ok(!!model, 'The AI model should be registered!');

        return model.resolve(req.text(), req);
    }

}

Ai.ai = new Ai();

module.exports = Ai;
