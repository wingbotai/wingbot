/*
 * @author David Menger
 */
'use strict';

const { WingbotModel } = require('./wingbot');
const AiMatching = require('./AiMatching');
const { vars } = require('./utils/stateVariables');
const { deepEqual } = require('./utils/deepMapTools');
const systemEntities = require('./systemEntities');
const CustomEntityDetectionModel = require('./wingbot/CustomEntityDetectionModel');

let uq = 1;

/** @typedef {import('./AiMatching').Compare} Compare */

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

/** @typedef {import('./Request').IntentAction} IntentAction */
/** @typedef {import('./Request')} Request */
/** @typedef {import('./Request').TextAlternative} TextAlternative */
/** @typedef {import('./Responder')} Responder */
/** @typedef {import('./Router').Resolver} Resolver */
/** @typedef {import('./utils/stateData').IStateRequest} IStateRequest */
/** @typedef {import('./wingbot/CachedModel').Result} Result */
/** @typedef {import('./wingbot/CustomEntityDetectionModel').Phrases} Phrases */
/** @typedef {import('./wingbot/CustomEntityDetectionModel').EntityDetector} EntityDetector */
/** @typedef {import('./wingbot/CustomEntityDetectionModel').DetectorOptions} DetectorOptions */
/** @typedef {import('./wingbot/CustomEntityDetectionModel').Entity} Entity */
// eslint-disable-next-line max-len
/** @typedef {import('./wingbot/CustomEntityDetectionModel').WordEntityDetector} WordEntityDetector */

/**
 * @typedef {object} WordDetectorData
 * @prop {WordEntityDetector} detector
 * @prop {number} [maxWordCount]
 */

/**
 * @callback WordEntityDetectorFactory
 * @returns {Promise<WordDetectorData>}
 */

/** @typedef {[string,EntityDetector|RegExp,DetectorOptions]} DetectorArgs */

/**
 * @class Ai
 */
class Ai {

    constructor () {
        /**
         * @private
         * @type {Map<string,CustomEntityDetectionModel>}
         */
        this._keyworders = new Map();

        /**
         * @private
         * @type {Map<string,DetectorArgs>}
         */
        this._detectors = new Map(
            systemEntities.map((a) => [a[0], a])
        );

        /**
         * @private
         * @type {WordEntityDetectorFactory}
         */
        this._wordEntityDetectorFactory = null;

        /**
         * @private
         * @type {WordEntityDetector|Promise<WordEntityDetector>}
         */
        this._wordEntityDetector = null;

        this._wordEntityDetectorMaxWordCount = 0;

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
         * Upper limit for NLP resolving of STT alternatives
         *
         * @type {number}
         */
        this.sttMaxAlternatives = 3;

        /**
         * Minimal score to consider text as recognized well
         *
         * @type {number}
         */
        this.sttScoreThreshold = 0;

        /**
         * The logger (console by default)
         *
         * @type {object}
         */
        this.logger = console;

        /**
         * The prefix translator - for request-specific prefixes
         *
         * @param {string} defaultModel
         * @param {IStateRequest} req
         */
        this.getPrefix = (defaultModel, req) => req.state.lang || defaultModel; // eslint-disable-line

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
        this.matcher = new AiMatching(this);

        /**
         * @type {string}
         */
        this.DEFAULT_PREFIX = 'default';
    }

    /**
     *
     * @param {string} text
     * @param {string|Request} prefix
     * @returns {Promise<Entity[]>}
     */
    async detectEntities (text, prefix = this.DEFAULT_PREFIX) {
        let model;

        if (typeof prefix === 'string') {
            model = this._keyworders.get(prefix);
        } else {
            const usePrefix = this.getPrefix(this.DEFAULT_PREFIX, prefix);
            model = this._keyworders.get(usePrefix);
        }

        if (!model) {
            return [];
        }

        const entities = await model.resolveEntities(text);

        // @ts-ignore
        return entities;
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
     * @template {CustomEntityDetectionModel} T
     * @param {string|WingbotModel|T} model - wingbot model name or AI plugin
     * @param {string} prefix - model prefix
     * @param {object} [options={}]
     * @param {number} [options.cacheSize]
     * @param {boolean} [options.verbose]
     * @param {number} [options.cachePhrasesTime]
     *
     *
     * @returns {T}
     * @memberOf Ai
     */
    register (model = null, prefix = this.DEFAULT_PREFIX, options = {}) {
        /** @type {T} */
        let modelObj;

        if (!model) {
            // @ts-ignore
            modelObj = new CustomEntityDetectionModel({ ...options, prefix });
        } else if (typeof model === 'string') {
            // @ts-ignore
            modelObj = new WingbotModel({
                ...options,
                model,
                prefix
            }, this.logger);
        } else {
            // @ts-ignore
            modelObj = model;
            modelObj.prefix = prefix;
        }

        this._keyworders.set(prefix, modelObj);

        if (typeof this._wordEntityDetector === 'function') {
            modelObj.wordEntityDetector = this._wordEntityDetector;
        }

        for (const entityArgs of this._detectors.values()) {
            modelObj.setEntityDetector(...entityArgs);
        }

        return modelObj;
    }

    /**
     *
     * @param {string} name
     * @param {EntityDetector|RegExp} detector
     * @param {object} [options]
     * @param {boolean} [options.anonymize] - if true, value will not be sent to NLP
     * @param {Function|string} [options.extractValue] - entity extractor
     * @param {boolean} [options.matchWholeWords] - match whole words at regular expression
     * @param {boolean} [options.replaceDiacritics] - keep diacritics when matching regexp
     * @param {boolean} [options.caseSensitiveRegex] - make regex case sensitive
     * @param {string[]} [options.dependencies] - array of dependent entities
     * @param {boolean} [options.clearOverlaps] - let longer entities from NLP to replace entity
     * @returns {this}
     */
    registerEntityDetector (name, detector, options = {}) {
        const useOptions = { clearOverlaps: true, ...options };

        this._detectors.set(name, [name, detector, useOptions]);

        for (const model of this._keyworders.values()) {
            model.setEntityDetector(name, detector, useOptions);
        }

        return this;
    }

    /**
     *
     * @param {WordEntityDetector|WordEntityDetectorFactory|WordDetectorData} wordEntityDetector
     */
    setWordEntityDetector (wordEntityDetector) {
        if (typeof wordEntityDetector === 'function' && wordEntityDetector.length === 0) {
            // @ts-ignore
            this._wordEntityDetectorFactory = wordEntityDetector;
            this._wordEntityDetector = null;
            return this;
        }

        let detector;
        if (typeof wordEntityDetector === 'object') {
            ({ detector } = wordEntityDetector);
            this._wordEntityDetectorMaxWordCount = Math.max(
                this._wordEntityDetectorMaxWordCount,
                wordEntityDetector.maxWordCount || 0
            );
        } else {
            detector = wordEntityDetector;
        }

        // @ts-ignore
        this._wordEntityDetector = detector;

        for (const model of this._keyworders.values()) {
            // @ts-ignore
            model.wordEntityDetector = detector;
            model.maxWordCount = Math.max(model.maxWordCount, this._wordEntityDetectorMaxWordCount);
        }
        return this;
    }

    /**
     * Sets options to entity detector.
     * Useful for disabling anonymization of local system entities.
     *
     * @param {string} name
     * @param {object} options
     * @param {boolean} [options.anonymize]
     * @param {boolean} [options.clearOverlaps] - set true to override entities from NLP
     * @returns {this}
     * @example
     *
     * ai.register('wingbot-model-name')
     *     .setDetectorOptions('phone', { anonymize: false })
     *     .setDetectorOptions('email', { anonymize: false })
     */
    configureEntityDetector (name, options) {
        if (!this._detectors.has(name)) {
            throw new Error(`Can't set entity detector options. Entity "${name}" does not exist.`);
        }
        Object.assign(this._detectors.get(name)[2], options);
        for (const model of this._keyworders.values()) {
            model.setDetectorOptions(name, options);
        }
        return this;
    }

    /**
     * Remove registered model
     *
     * @param {string} [prefix]
     */
    deregister (prefix = this.DEFAULT_PREFIX) {
        this._keyworders.delete(prefix);
    }

    /**
     * Returns registered AI model
     *
     * @param {string} prefix - model prefix
     *
     * @returns {CustomEntityDetectionModel}
     * @memberOf Ai
     */
    getModel (prefix = this.DEFAULT_PREFIX) {
        const model = this._keyworders.get(prefix);
        if (!model) {
            throw new Error(`Model ${prefix} not registered yet. Register the model first.`);
        }
        return model;
    }

    get localEnhancement () {
        return (1 - this.confidence) / 2;
    }

    async processSetStateEntities (req, setState) {
        const keys = Object.keys(setState);

        for (const key of keys) {
            if (!key.match(/^@/) || typeof setState[key] !== 'string') continue;

            const cleanKey = `${key}`.replace(/^@/, '');
            // eslint-disable-next-line no-param-reassign
            setState[key] = await this._resolveCustomEntityValue(req, cleanKey, setState[key]);
        }
    }

    async _resolveCustomEntityValue (req, entity, text) {
        const model = this._getModelForRequest(req);
        if (!model || typeof model.resolveEntityValue !== 'function') {
            return text;
        }
        return model.resolveEntityValue(entity, text);
    }

    /**
     * Returns matching middleware, that will export the intent to the root router
     * so the intent will be matched in a global context
     *
     * @param {string} path
     * @param {IntentRule|IntentRule[]} intents
     * @param {string|Function} [title] - disambiguation title
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
        const usedEntities = this.matcher.parseEntitiesFromIntentRule(intents, true);
        const rules = this.matcher.preprocessRule(intents);
        const matcher = this._createIntentMatcher(rules, usedEntities);
        const entitiesSetState = Ai.ai.matcher.getSetStateForEntityRules(rules);
        const id = uq++;

        const resolver = {
            path,
            globalIntents: new Map([[id, {
                id,
                matcher,
                usedEntities,
                entitiesSetState,
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
     * @param {string|Function} [title] - disambiguation title
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
        const usedEntities = this.matcher.parseEntitiesFromIntentRule(intents, true);
        const rules = this.matcher.preprocessRule(intents);
        const matcher = this._createIntentMatcher(rules, usedEntities);
        const entitiesSetState = Ai.ai.matcher.getSetStateForEntityRules(rules);
        const id = uq++;

        const resolver = {
            path,
            globalIntents: new Map([[id, {
                id,
                matcher,
                usedEntities,
                entitiesSetState,
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
     * @returns {Resolver} - the middleware
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
        const usedEntities = this.matcher.parseEntitiesFromIntentRule(intent, true);
        const rules = this.matcher.preprocessRule(intent);
        const matcher = this._createIntentMatcher(rules, usedEntities);

        return async (req, res) => {
            if (!req.isTextOrIntent()) {
                return false;
            }

            if (!req.intents) {
                await this._loadIntents(req, res);
            }

            const winningIntent = matcher(req);

            if (!winningIntent || winningIntent.score < this.confidence) {
                return false;
            }

            req._winningIntent = winningIntent;

            return true;
        };
    }

    ruleIsMatching (intent, req, stateless = false, noEntityThreshold = false) {
        const rules = this.matcher.preprocessRule(intent);
        const winningIntent = this.matcher.match(
            req,
            rules,
            stateless,
            undefined,
            noEntityThreshold
        );

        if (!winningIntent || winningIntent.score < this.threshold) {
            return null;
        }

        const usedEntities = this.matcher.parseEntitiesFromIntentRule(intent, true);
        const setState = this._getSetStateForEntities(
            usedEntities,
            winningIntent.entities,
            req.entities,
            req.state
        );

        const alterScoreMax = (1 - ((1 - this.confidence) / 2));
        const alterEntities = winningIntent.entities
            .filter((e) => alterScoreMax >= e.score && e.alternatives && e.alternatives.length > 0);

        let alternatives = [];
        if (alterEntities.length === 1) {
            const [alterEntity] = alterEntities;
            alternatives = alterEntity.alternatives
                .map((alternative) => {
                    if (alternative.value === alterEntity.value
                        && alternative.entity === alterEntity.entity) {
                        return null;
                    }
                    const reqEntities = req.entities
                        .map((reqEntity) => {
                            if (reqEntity.entity === alterEntity.entity
                                && reqEntity.value === alterEntity.value) {

                                return alternative;
                            }
                            return reqEntity;
                        });

                    const winner = this.matcher.match(req, rules, stateless, reqEntities);

                    if (!winner || winner.score < this.threshold) {
                        return null;
                    }

                    const alterSetState = this._getSetStateForEntities(
                        this.matcher.parseEntitiesFromIntentRule(intent, true),
                        winner.entities,
                        reqEntities,
                        req.state
                    );

                    return {
                        ...winner,
                        setState: alterSetState,
                        aboveConfidence: winner.score >= this.confidence
                    };
                })
                .filter((alt) => alt !== null);
        }

        return {
            ...winningIntent,
            setState,
            aboveConfidence: winningIntent.score >= this.confidence,
            alternatives
        };
    }

    _getSetStateForEntities (usedEntities = [], entities = [], detectedEntities = [], state = {}) {
        return usedEntities
            .reduce((o, entityName) => {
                const entity = entities.find((e) => e.entity === entityName)
                    || detectedEntities.find((e) => e.entity === entityName);

                if (!entity) {
                    return o;
                }

                // if the entity is already set without metadata, persist it
                const key = `@${entityName}`;

                if (deepEqual(state[key], entity.value)
                    && !detectedEntities.some((e) => e.entity === entityName)) {

                    return Object.assign(o, vars.preserveMeta(key, entity.value, state));
                }

                return Object.assign(o, vars.dialogContext(key, entity.value));
            }, {});
    }

    _createIntentMatcher (rules, usedEntities) {
        return (req) => {
            const winningIntent = this.matcher.match(req, rules);

            if (!winningIntent || this.threshold > winningIntent.score) {
                return null;
            }

            const aboveConfidence = winningIntent.score >= this.confidence;
            const setState = this._getSetStateForEntities(
                usedEntities,
                winningIntent.entities,
                req.entities,
                req.state
            );

            return {
                ...winningIntent,
                setState,
                aboveConfidence
            };
        };
    }

    // eslint-disable-next-line max-len
    _getModelForRequest (req, isConfident = req.isConfidentInput(), defaultModel = this.DEFAULT_PREFIX) {
        if (isConfident) {
            return null;
        }

        const prefixForRequest = this.getPrefix(defaultModel, req);

        if (this._keyworders.has(prefixForRequest)) {
            return this._keyworders.get(prefixForRequest);
        }

        return this._keyworders.get(defaultModel);
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

    /**
     *
     * @returns {Promise}
     */
    preloadDetectors () {
        if (this._wordEntityDetectorFactory === null || this._wordEntityDetector) {
            return Promise.resolve(this._wordEntityDetector);
        }

        const promise = this._wordEntityDetectorFactory()
            .then((detector) => {
                this.setWordEntityDetector(detector);
                return detector;
            })
            .catch((e) => {
                // eslint-disable-next-line no-console
                console.error('AI.preloadDetectors FAILED', e);
                this._wordEntityDetector = null;
            });

        // @ts-ignore
        this._wordEntityDetector = promise;

        return promise;
    }

    /**
     *
     * @param {Request} req
     * @param {Responder} [res]
     * @returns {Promise}
     */
    async preloadAi (req, res = null) {
        if (req.supportsFeature(req.FEATURE_PHRASES)) {
            const model = this._getModelForRequest(req, false);

            if (model.phrasesCacheTime) {
                model.getPhrases()
                    .catch(() => {});
            }
        }
        return this._preloadIntent(req, res);
    }

    /**
     * Returns phrases model from AI
     *
     * @param {Request} req
     * @returns {Promise<Phrases>}
     */
    async getPhrases (req) {
        const model = this._getModelForRequest(req, false);

        if (model) {
            return model.getPhrases();
        }
        return CustomEntityDetectionModel.getEmptyPhrasesObject();
    }

    /**
     *
     * @param {Request} req
     * @param {Responder} res
     * @param {Result} result
     * @returns {void}
     */
    _setResultToReqRes (req, res, result) {
        const { text = null, intents, entities = [] } = result;
        Object.assign(req, { intents, entities, _anonymizedText: text });

        if (!res) {
            return;
        }

        const entitiesObj = (entities || []).reduce((o, { entity, value }) => {
            const list = o[entity] || [];
            list.push(value);
            return Object.assign(o, { [entity]: list });
        }, {});

        res.setData({
            '@': entitiesObj
        });
    }

    /**
     *
     * @param {Request} req
     * @param {Responder} [res]
     * @returns {Promise}
     */
    async _preloadIntent (req, res = null) {
        const mockIntent = this._getMockIntent(req);

        if (mockIntent) {
            this._setResultToReqRes(req, res, mockIntent);
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

            await this._loadIntents(req, res, model);
        } else {
            req.intents = [];
        }
    }

    async _loadIntents (req, res = null, model = null) {
        const result = await this._queryModel(req, model);
        this._setResultToReqRes(req, res, result);
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

        await this.preloadDetectors();

        const texts = req.textAlternatives()
            .filter((alt) => alt.score >= this.sttScoreThreshold)
            .slice(0, this.sttMaxAlternatives);

        return this._queryModelWithTexts(model, texts, req);
    }

    /**
     *
     * @param {CustomEntityDetectionModel} model
     * @param {TextAlternative[]} texts
     * @param {Request} [req]
     * @returns {Promise<Result>}
     */
    async _queryModelWithTexts (model, texts, req = null) {
        const altKoef = (1 - this.confidence);
        const altMax = Math.max(0, ...texts.map((t) => t.score));

        const results = await Promise.all(
            texts.map(({ text, score = 1 }) => model
                .resolve(this.textFilter(text), req)
                .then((res) => ({
                    ...res,
                    intents: res.intents
                        .map((i) => ({
                            ...i,
                            score: i.score - (altKoef * (altMax - score))
                        }))
                        .sort(({ score: a }, { score: z }) => z - a)
                })))
        );

        results.sort(({
            intents: [aIntent = { score: 0 }]
        }, {
            intents: [zIntent = { score: 0 }]
        }) => zIntent.score - aIntent.score);

        const [winner = { intents: [], entities: [] }, ...others] = results;

        if (others.length === 0) {
            return winner;
        }

        const { intents } = winner;

        const known = new Set(intents.map((i) => i.intent));

        others.forEach((other) => {
            intents.push(
                ...other.intents.filter(({ score, intent }) => {
                    if (score >= this.confidence || known.has(intent)) {
                        return false;
                    }
                    known.add(intent);
                    return true;
                })
            );
        });

        intents.sort(({ score: a }, { score: z }) => z - a);

        return {
            ...winner,
            intents
        };
    }

    /**
     *
     * @param {string} text
     * @param {string|IStateRequest} langOrReq
     * @returns {Promise<Result>}
     */
    async queryModel (text, langOrReq = this.DEFAULT_PREFIX) {
        let model;

        if (typeof langOrReq === 'string') {
            model = this._keyworders.has(langOrReq)
                ? this._keyworders.get(langOrReq)
                : this._keyworders.get(this.DEFAULT_PREFIX);
        } else {
            model = this._getModelForRequest(langOrReq);
        }

        if (!model) {
            return {
                text,
                intents: [],
                entities: []
            };
        }

        return this._queryModelWithTexts(model, [{ text, score: 1 }]);
    }

    /**
     *
     * @param {IntentAction[]} aiActions
     * @param {boolean} [forQuickReplies]
     * @returns {boolean}
     */
    shouldDisambiguate (aiActions, forQuickReplies = false) {
        if (aiActions.length === 0
            || aiActions[0].aboveConfidence === false
            || (forQuickReplies && !aiActions[0].hasAiTitle)) {

            return false;
        }

        // if (aiActions[0].intent) {
        //     const { entities = [] } = aiActions[0].intent;
        //     const [{ score = 0, alternatives = [] } = {}] = entities;

        //     if (entities.length === 1
        //         && score < (1 - ((1 - this.confidence) / 2))
        //         && alternatives.length) {

        //         return true;
        //     }
        // }

        // there will be no winner, if there are two different intents
        if (aiActions.length > 1 && aiActions[1].aboveConfidence !== false) {

            const [first, second] = aiActions;

            const firstScore = first.sort;
            const secondScore = second.sort;

            const margin = 1 - (secondScore / firstScore);
            const bothHaveTitle = first.title && second.title;
            const similarScore = margin < (1 - Ai.ai.confidence);
            const hasAititles = !forQuickReplies || second.hasAiTitle;

            let intentsDiffers = true;
            if (first.intent && second.intent && first.intent.intent === second.intent.intent) {
                let { entities: firstEntities = [] } = first.intent;
                let { entities: secondEntities = [] } = second.intent;

                if (firstEntities.length > secondEntities.length) {
                    [firstEntities, secondEntities] = [secondEntities, firstEntities];
                }

                const entitiesDiffers = secondEntities.some((f) => !firstEntities
                    .some((s) => s.entity === f.entity && s.value === f.value));

                intentsDiffers = entitiesDiffers;
            }

            if (bothHaveTitle
                && similarScore
                && hasAititles
                && intentsDiffers) {

                return true;
            }
        }

        return false;
    }

}

Ai.ai = new Ai();

module.exports = Ai;
