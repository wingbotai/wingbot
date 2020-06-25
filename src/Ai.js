/*
 * @author David Menger
 */
'use strict';

const { WingbotModel } = require('./wingbot');
const AiMatching = require('./AiMatching');

const DEFAULT_PREFIX = 'default';

let uq = 1;

/**
 * @typedef {object} EntityExpression
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
 * @typedef {object} BotPath
 * @prop {string} path
 */

/**
 * @typedef {object} IntentAction
 * @prop {string} action
 * @prop {Intent} intent
 * @prop {number} sort
 * @prop {boolean} local
 * @prop {boolean} aboveConfidence
 * @prop {boolean} [winner]
 * @prop {string} [title]
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
        this.confidence = 0.8;

        /**
         * Lower threshold - for disambiguation
         *
         * @type {number}
         */
        this.threshold = 0.3;

        /**
         * The logger (console by default)
         *
         * @type {object}
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
         * Preprocess text for NLP
         * For example to remove any confidential data
         *
         * @param {string} text
         * @type {textFilter}
         */
        this.textFilter = (text) => text;

        /**
         * AI Score provider
         *
         * @type {AiMatching}
         */
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
     * Returns matching middleware, that will export the intent to the root router
     * so the intent will be matched in a global context
     *
     * @param {string} path
     * @param {IntentRule|IntentRule[]} intents
     * @param {string} [title] - disambiguation title
     * @param {object} [meta] - metadata for multibot environments
     * @param {object} [meta.targetAppId] - target application id
     * @param {object} [meta.targetAction] - target action
     * @returns {object} - the middleware
     * @memberOf Ai
     * @example
     * const { Router, ai } = require('wingbot');
     *
     * ai.register('app-model');
     *
     * bot.use(ai.global('route-path', 'intent1'), (req, res) => {
     *     console.log(req.intent(true)); // { intent: 'intent1', score: 0.9604 }
     *
     *     res.text('Oh, intent 1 :)');
     * });
     */
    global (path, intents, title = null, meta = {}) {
        const matcher = this._createIntentMatcher(intents);
        const id = uq++;

        const resolver = {
            path,
            globalIntents: new Map([[id, {
                id,
                matcher,
                local: false,
                action: '/*',
                title,
                meta
            }]])
        };

        return resolver;
    }

    /**
     * Returns matching middleware, that will export the intent to the root router
     * so the intent will be matched in a context of local dialogue
     *
     * @param {string} path
     * @param {IntentRule|IntentRule[]} intents
     * @param {string} [title] - disambiguation title
     * @returns {object} - the middleware
     * @memberOf Ai
     * @example
     * const { Router, ai } = require('wingbot');
     *
     * ai.register('app-model');
     *
     * bot.use(ai.global('route-path', 'intent1'), (req, res) => {
     *     console.log(req.intent(true)); // { intent: 'intent1', score: 0.9604 }
     *
     *     res.text('Oh, intent 1 :)');
     * });
     */
    local (path, intents, title = null) {
        const matcher = this._createIntentMatcher(intents);
        const id = uq++;

        const resolver = {
            path,
            globalIntents: new Map([[id, {
                id,
                matcher,
                local: true,
                action: '/*',
                title,
                meta: {}
            }]])
        };

        return resolver;
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
    match (intent) {
        const matcher = this._createIntentMatcher(intent);

        return async (req) => {
            if (!req.isTextOrIntent()) {
                return false;
            }

            if (!req.intents) {
                await this._loadIntents(req);
            }

            const winningIntent = matcher(req);

            if (!winningIntent || winningIntent.score < this.confidence) {
                return false;
            }

            // @todo k cemu? logy? asi ne, zmazat
            req._winningIntent = winningIntent;

            return true;
        };
    }

    ruleIsMatching (intent, req) {
        const rules = this.matcher.preprocessRule(intent);
        const winningIntent = this.matcher.match(req, rules);
        return winningIntent && winningIntent.score >= this.confidence;
    }

    _createIntentMatcher (intent) {
        const rules = this.matcher.preprocessRule(intent);

        return (req) => {
            const winningIntent = this.matcher.match(req, rules);

            if (!winningIntent || this.threshold > winningIntent.score) {
                return null;
            }

            const aboveConfidence = winningIntent.score >= this.confidence;

            return {
                ...winningIntent,
                aboveConfidence
            };
        };
    }

    _getModelForRequest (req, prefix = DEFAULT_PREFIX) {
        if (req.isConfidentInput()) {
            return null;
        }

        const prefixForRequest = this.getPrefix(prefix, req);
        return this._keyworders.get(prefixForRequest);
    }

    _getMockIntent (req) {
        const intentFromData = req.event && req.event.intent;

        if (!this._mockIntent && !intentFromData) {
            return null;
        }

        const { intent, score = null, entities = [] } = intentFromData
            ? req.event
            : this._mockIntent;

        const intents = Array.isArray(intent)
            ? intent.map((i) => ({ intent: i, score: score === null ? this.confidence : score }))
            : [{ intent, score: score === null ? this.confidence : score }];

        return {
            intents,
            entities
        };
    }

    async preloadIntent (req) {
        const mockIntent = this._getMockIntent(req);

        if (mockIntent) {
            req.intents = mockIntent.intents;
            req.entities = mockIntent.entities;
            return;
        }

        if (!req.isText()) {
            return;
        }

        if (this._keyworders.size !== 0) {
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

    /**
     *
     * @param {IntentAction[]} aiActions
     * @returns {boolean}
     */
    shouldDisambiguate (aiActions) {
        if (aiActions.length === 0 || aiActions[0].aboveConfidence === false) {
            return false;
        }

        // there will be no winner, if there are two different intents
        if (aiActions.length > 1 && aiActions[1].aboveConfidence !== false) {

            const [first, second] = aiActions;
            const firstScore = first.sort || first.score;
            const secondScore = second.sort || second.score;

            const margin = 1 - (secondScore / firstScore);
            const oneHasTitle = first.title || second.title;
            const similarScore = margin < (1 - Ai.ai.confidence);
            const intentIsNotTheSame = !first.intent || !second.intent
                || !first.intent.intent
                || first.intent.intent !== second.intent.intent;

            if (oneHasTitle && similarScore && intentIsNotTheSame) {
                return true;
            }
        }

        return false;
    }

}

Ai.ai = new Ai();

module.exports = Ai;
