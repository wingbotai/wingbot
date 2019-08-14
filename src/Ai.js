/*
 * @author David Menger
 */
'use strict';

const { WingbotModel } = require('./wingbot');
const AiMatching = require('./AiMatching');

const DEFAULT_PREFIX = 'default';

let uq = 1;


/**
 * @typedef {Object} EntityExpression
 * @prop {string} entity - the requested entity
 * @prop {boolean} [optional] - entity is optional, can be missing in request
 * @prop {Compare} [op] - comparison operation (eq|ne|range)
 * @prop {string[]|number[]} [compare] - value to compare with
 */

/**
 * Text filter function
 *
 * @callback textFilter
 * @param {string} text - input text
 * @returns {string} - filtered text
 */


/**
 * @typedef {string|EntityExpression} IntentRule
 */

/**
 * @class Ai
 */
class Ai {

    constructor (matcher = new AiMatching()) {
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

        /**
         * Preprocess text for NLP
         * For example to remove any confidential data
         *
         * @param {string} text
         * @type {textFilter}
         */
        this.textFilter = text => text;

        this.matcher = matcher;
    }

    /**
     * Usefull method for testing AI routes
     *
     * @param {string} [intent] - intent name
     * @param {number} [score] - the score of the top intent
     * @returns {this}
     * @example
     * const { Tester, ai, Route } = require('bontaut');
     *
     * const bot = new Route();
     *
     * bot.use(['intentAction', ai.localMatch('intentName')], (req, res) => {
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
    mockIntent (intent = null, score = null) {
        if (intent === null) {
            this._mockIntent = null;
        } else {
            this._mockIntent = { intent, score };
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
     * @example
     * const { ai, Router } = require('wingbot');
     *
     * const bot = new Router();
     *
     * bot.use(ai.load());
     */
    load () {
        return async (req) => {
            if (!req.isText()) {
                return true;
            }

            if (!req.intents) {
                await this._loadIntents(req);
            }

            return true;
        };
    }

    /**
     * Returns matching middleware
     *
     * **supports:**
     *
     * - intents (`'intentName'`)
     * - entities (`'@entity'`)
     * - entities with conditions (`'@entity=PRG,NYC'`)
     * - entities with conditions (`'@entity>=100'`)
     * - complex entities (`{ entity:'entity', op:'range', compare:[null,1000] }`)
     * - optional entities (`{ entity:'entity', optional: true }`)
     * - wildcard keywords (`'#keyword#'`)
     * - phrases (`'#first-phrase|second-phrase'`)
     * - emojis (`'#😄🙃😛'`)
     *
     * @param {IntentRule|IntentRule[]} intent
     * @param {number} [confidence]
     * @returns {Function} - the middleware
     * @memberOf Ai
     * @example
     * const { Router, ai } = require('wingbot');
     *
     * ai.register('app-model');
     *
     * bot.use(ai.match('intent1'), (req, res) => {
     *     console.log(req.intent(true)); // { intent: 'intent1', score: 0.9604 }
     *
     *     res.text('Oh, intent 1 :)');
     * });
     */
    match (intent, confidence = null) {
        const matcher = this._createIntentMatcher(intent, confidence);

        return async (req, res) => {
            if (!req.isText()) {
                return false;
            }

            if (!req.intents) {
                await this._loadIntents(req);
            }

            return matcher(req, res);
        };
    }

    /**
     * Returns matching middleware, that will export the intent to the root router
     * so the intent will be matched in a local context (nested Router)
     *
     * @param {IntentRule|IntentRule[]} intent
     * @param {number} [confidence]
     * @returns {Function} - the middleware
     * @memberOf Ai
     * @example
     * const { Router, ai } = require('wingbot');
     *
     * ai.register('app-model');
     *
     * bot.use(ai.localMatch('intent1'), (req, res) => {
     *     console.log(req.intent(true)); // { intent: 'intent1', score: 0.9604 }
     *
     *     res.text('Oh, intent 1 :)');
     * });
     */
    localMatch (intent, confidence = null) {
        const matcher = this._createIntentMatcher(intent, confidence);

        const resolver = async (req, res) => {
            if (!req.isText()) {
                return false;
            }

            if (!req.intents) {
                await this._loadIntents(req);
            }

            return matcher(req, res);
        };

        const id = uq++;

        resolver.globalIntents = new Map([[id, {
            id,
            matcher,
            local: true,
            path: '/*'
        }]]);

        return resolver;
    }

    /**
     * Returns matching middleware, that will export the intent to the root router
     * so the intent will be matched in a global context
     *
     * @param {IntentRule|IntentRule[]} intent
     * @param {number} [confidence]
     * @returns {Function} - the middleware
     * @memberOf Ai
     * @example
     * const { Router, ai } = require('wingbot');
     *
     * ai.register('app-model');
     *
     * bot.use(ai.globalMatch('intent1'), (req, res) => {
     *     console.log(req.intent(true)); // { intent: 'intent1', score: 0.9604 }
     *
     *     res.text('Oh, intent 1 :)');
     * });
     */
    globalMatch (intent, confidence = null) {
        const matcher = this._createIntentMatcher(intent, confidence);

        const resolver = async (req, res) => {
            if (!req.isText()) {
                return false;
            }

            if (!req.intents) {
                await this._loadIntents(req);
            }

            return matcher(req, res);
        };

        const id = uq++;

        resolver.globalIntents = new Map([[id, {
            id,
            matcher,
            path: '/*'
        }]]);

        return resolver;
    }

    _createIntentMatcher (intent, confidence = null) {
        const rules = this.matcher.preprocessRule(intent);

        return (req, res, needWinningIntent = false) => {
            const winningIntent = this.matcher.match(req, rules);

            const useConfidence = confidence === null
                ? this.confidence
                : confidence;

            if (needWinningIntent) {
                return winningIntent && winningIntent.score >= useConfidence
                    ? winningIntent
                    : null;
            }

            if (!winningIntent || winningIntent.score < useConfidence) {
                return false;
            }

            const action = req.action();

            if (res.bookmark() && action !== res.currentAction()) {
                return false;
            }

            // do not continue, when there is another action expected
            if (!this.disableBookmarking
                && action
                && action !== res.currentAction()) {

                return false;
            }

            req._winningIntent = winningIntent;

            return true;
        };
    }

    _getModelForRequest (req, prefix = DEFAULT_PREFIX) {
        const prefixForRequest = this.getPrefix(prefix, req);
        return this._keyworders.get(prefixForRequest);
    }

    _getMockIntent (req) {
        const intentFromData = req.data && req.data.intent;

        if (!this._mockIntent && !intentFromData) {
            return null;
        }

        const { intent, score = null, entities = [] } = intentFromData
            ? req.data
            : this._mockIntent;

        return {
            intents: [
                { intent, score: score === null ? this.confidence : score }
            ],
            entities
        };
    }

    async preloadIntent (req) {
        if (req.intents || !req.isText()) {
            return;
        }
        const mockIntent = this._getMockIntent(req);
        if (mockIntent) {
            req.intents = mockIntent.intents;
            req.entities = mockIntent.entities;
        } else if (!req.intents && this._keyworders.size !== 0 && req.isText()) {
            const model = this._getModelForRequest(req);
            if (!model) {
                req.intents = [];
                return;
            }
            await this._loadIntents(req, model);
        } else {
            req.intents = [];
        }
    }

    async _loadIntents (req, model = null) {
        const { intents, entities = [] } = await this._queryModel(req, model);
        Object.assign(req, { intents, entities });
    }

    async _queryModel (req, useModel = null) {
        const mockIntent = this._getMockIntent(req);
        if (mockIntent) {
            return mockIntent;
        }
        let model = useModel;
        if (!model) {
            model = this._getModelForRequest(req);
            if (!model) {
                return { intents: [], entities: [] };
            }
        }
        const text = this.textFilter(req.text());
        return model.resolve(text, req);
    }

}

Ai.ai = new Ai();

module.exports = Ai;
