/*
 * @author David Menger
 */
'use strict';

const { WingbotModel } = require('./wingbot');
const { replaceDiacritics } = require('./utils/tokenizer');

const DEFAULT_PREFIX = 'default';
const FULL_EMOJI_REGEX = /^#((?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])+)$/;
const HAS_CLOSING_HASH = /^#(.+)#$/;

let uq = 0;

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

            if (!req._intents) {
                req._intents = await this._queryModel(req);
            }

            return true;
        };
    }

    /**
     * Returns matching middleware
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
    match (intent, confidence = null) {
        const matcher = this._createIntentMatcher(intent, confidence);

        return async (req, res) => {
            if (!req.isText()) {
                return false;
            }

            if (!req._intents) {
                req._intents = await this._queryModel(req);
            }

            return matcher(req, res);
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
        const matcher = this._createIntentMatcher(intent, confidence);

        const resolver = async (req, res) => {
            if (!req.isText()) {
                return false;
            }

            if (!req._intents) {
                req._intents = await this._queryModel(req);
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
        const expressions = Array.isArray(intent) ? intent : [intent];

        const intents = expressions.filter(ex => !ex.match(/^#/));

        /**
         * 1. Emoji lists
         *      conversts #😀😃😄 to /^[😀😃😄]+$/ and matches not webalized
         * 2. Full word lists with a closing hash (opens match)
         *      convers #abc-123|xyz-34# to /abc-123|xyz-34/
         * 3. Full word lists without an open tag
         *      convers #abc-123|xyz-34 to /^abc-123$|^xyz-34$/
         */

        const regexps = expressions
            .filter(ex => ex.match(/^#/))
            .map((rawExp) => {
                const exp = replaceDiacritics(rawExp);
                const fullEmoji = exp.match(FULL_EMOJI_REGEX);

                if (fullEmoji) {
                    return {
                        r: new RegExp(`^[${fullEmoji[1]}]+$`),
                        t: false
                    };
                }

                let regexText;

                const withClosingHash = exp.match(HAS_CLOSING_HASH);

                if (withClosingHash) {
                    [, regexText] = withClosingHash;
                    regexText = regexText.toLowerCase();
                } else {
                    regexText = exp.replace(/^#/, '')
                        .split('|')
                        .map(s => `^${s}$`.toLowerCase())
                        .join('|');
                }

                let r;
                try {
                    r = new RegExp(regexText);
                } catch (e) {
                    // fail - simply allows to use bad characters
                    regexText = regexText
                        .replace(/[a-z0-9|-]+/, '');
                    r = new RegExp(regexText);
                }

                return { r, t: true };
            });

        return (req, res, skipBookmarking = false) => {
            if (regexps.length !== 0) {
                const match = regexps.some(({ r, t }) => {
                    if (t) {
                        return req.text(true).match(r);
                    }
                    return req.text().match(r);
                });

                if (match) {
                    return true;
                }
            }

            if (!req._intents || req._intents.length === 0) {
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
            if (!this.disableBookmarking
                && !skipBookmarking
                && action
                && !res.bookmark()
                && action !== res.currentAction()) {

                res.setBookmark();
                return false;
            }

            return true;
        };
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
                score: req.data.score || this.confidence
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
                req._intents = [];
                return;
            }
            req._intents = await this._queryModel(req, model);
        } else {
            req._intents = [];
        }
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
                return [];
            }
        }
        return model.resolve(req.text(), req);
    }

}

Ai.ai = new Ai();

module.exports = Ai;
