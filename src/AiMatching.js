/*
 * @author David Menger
 */
'use strict';

const { replaceDiacritics, tokenize } = require('./utils/tokenizer');
const { vars } = require('./utils/stateVariables');
const stateData = require('./utils/stateData');

/** @typedef {import('handlebars')} Handlebars */
/** @typedef {import('./Ai').Result} Result */

/** @type {Handlebars} */
let handlebars;
try {
    // @ts-ignore
    handlebars = module.require('handlebars');
} catch (er) {
    // @ts-ignore
    handlebars = { compile: (text) => () => text };
}

const FULL_EMOJI_REGEX = /^#((?:[\u2600-\u27bf].?|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])+)$/;
const HAS_CLOSING_HASH = /^#(.+)#$/;
const ENTITY_REGEX = /^@([^=><!?]+)(\?)?([!=><]{1,2})?([^=><!]+)?$/i;

/**
 * @typedef {object} EntityMatchingResult
 * @prop {number} score
 * @prop {number} handicap
 * @prop {number} fromState
 * @prop {number} minScore
 * @prop {number} metl
 * @prop {Entity[]} matched
 */

/**
 * RegExp to test a string for a ISO 8601 Date spec
 *  YYYY
 *  YYYY-MM
 *  YYYY-MM-DD
 *  YYYY-MM-DDThh:mmTZD
 *  YYYY-MM-DDThh:mm:ssTZD
 *  YYYY-MM-DDThh:mm:ss.sTZD
 *
 * @see https://www.w3.org/TR/NOTE-datetime
 * @type {RegExp}
 */
const ISO_8601_REGEX = /^\d{4}-\d\d-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?$/i;

/**
 * @typedef {string} Compare
 */

/**
 * @enum {Compare}
 */
const COMPARE = {
    EQUAL: 'eq',
    NOT_EQUAL: 'ne',
    RANGE: 'range',
    GT: 'gt',
    GTE: 'gte',
    LT: 'lt',
    LTE: 'lte'
};

/**
 * @typedef {object} Entity
 * @prop {string} entity
 * @prop {string} value
 * @prop {number} score
 * @prop {number} [start]
 * @prop {number} [end]
 */

/**
 * @typedef {object} Intent
 * @prop {string} [intent]
 * @prop {number} score
 * @prop {Entity[]} [entities]
 */

/**
 * @typedef {string|number|Function} Comparable
 */

/**
 * @typedef {object} EntityExpression
 * @prop {string} entity - the requested entity
 * @prop {boolean} [optional] - the match is optional
 * @prop {Compare} [op] - comparison operation
 * @prop {Comparable[]} [compare] - value to compare
 */

/**
 * @typedef {string|EntityExpression} IntentRule
 */

/**
 * @typedef {object} RegexpComparator
 * @prop {RegExp} r - regular expression
 * @prop {boolean} t - use normalized text
 * @prop {boolean} f - is full match
 */

/**
 * @typedef {object} PreprocessorOutput
 * @prop {RegexpComparator[]} regexps
 * @prop {string[]} intents
 * @prop {EntityExpression[]} entities
 */

/**
 * @typedef {object} AIRequest
 * @prop {Function} text
 * @prop {Intent[]|null} intents
 * @prop {Entity[]} entities
 * @prop {object} [configuration]
 * @prop {object} [state]
 * @prop {Function} [actionData]
 */

/**
 * @typedef {object} ConfidenceProvider
 * @prop {number} confidence
 */

const ENTITY_OK = 0.79; // 0.835 on NLP;

/**
 * @class {AiMatching}
 *
 * Class responsible for NLP Routing by score
 */
class AiMatching {

    /**
     *
     * @param {ConfidenceProvider} ai
     */
    constructor (ai = { confidence: 0.8 }) {
        /**
         * When the entity is optional, the final score should be little bit lower
         * (0.002 by default)
         *
         * @type {number}
         */
        this.optionalHandicap = 0.002;

        /**
         * When the entity is equal-optional, the final score should be little bit lower
         * (0.001 by default)
         *
         * @type {number}
         */
        this.optionalEqualityHandicap = 0.001;

        /**
         * When there are additional entities then required add a handicap for each unmatched entity
         * Also works, when an optional entity was not matched
         * (0.02 by default)
         *
         * @type {number}
         */
        this.redundantEntityHandicap = 0.02;

        /**
         * Upper threshold for redundant entity handicaps
         *
         * @type {number}
         */
        this.redundantEntityClamp = 0.1;

        /**
         * When there is additional intent, the final score will be lowered by this value
         * (0.02 by default)
         *
         * @type {number}
         */
        this.redundantIntentHandicap = 0.02;

        /**
         * When more than one AI features (Intent, Entity, Regex) are matching,
         * enrich the score using the {multiMatchGain} ^ {additionalFeaturesCount}
         * (1.2 by default)
         *
         * @type {number}
         */
        this.multiMatchGain = 1.2;

        /**
         * Score of a context entity within a conversation state
         * (1 by default)
         */
        this.stateEntityScore = 1;

        /**
         * Score of matched regexp
         * (1.02 by default)
         */
        this.regexpScore = 1.02;

        this._ai = ai;
    }

    get redundantHandicap () {
        return (this.redundantEntityHandicap + this.redundantIntentHandicap) / 2;
    }

    set redundantHandicap (handicap) {
        this.redundantEntityHandicap = handicap;
        this.redundantIntentHandicap = handicap;
    }

    _normalizeToNumber (value, returnIfEmpty = null) {
        if (typeof value === 'string') {
            if (value.match(ISO_8601_REGEX)) {
                return value;
            }
            const flt = parseFloat(value);
            return Number.isNaN(flt) ? returnIfEmpty : flt;
        }
        if (typeof value === 'number') {
            return value;
        }
        return returnIfEmpty;
    }

    _hbsOrFn (value) {
        if (typeof value === 'string') {
            let useValue = value;
            if (useValue.match(/^\$[a-zA-Z0-9_-]+$/)) {
                useValue = `{{${useValue}}}`;
            }
            if (useValue.match(/\{\{.+\}\}/)) {
                const compiler = handlebars.compile(useValue);
                // @ts-ignore
                compiler.template = useValue;
                return compiler;
            }
        }
        return value;
    }

    _normalizeComparisonArray (compare, op) {
        const arr = Array.isArray(compare) ? compare : [compare];

        if ([
            COMPARE.GTE,
            COMPARE.GT,
            COMPARE.LTE,
            COMPARE.LT
        ].includes(op)) {
            const [val] = arr;

            return [
                this._hbsOrFn(val)
            ];
        }

        if (op === COMPARE.RANGE) {
            const [min, max] = arr;

            return [
                this._hbsOrFn(min),
                this._hbsOrFn(max)
            ];
        }

        return arr.map((cmp) => this._hbsOrFn(cmp));
    }

    _stringOpToOperation (op) {
        switch (op) {
            case '>':
                return COMPARE.GT;
            case '>=':
            case '=>':
                return COMPARE.GTE;
            case '<':
                return COMPARE.LT;
            case '<=':
            case '=<':
                return COMPARE.LTE;
            case '!=':
                return COMPARE.NOT_EQUAL;
            case '<>':
            case '><':
                return COMPARE.RANGE;
            case '=':
            case '==':
            default:
                return COMPARE.EQUAL;
        }
    }

    _parseEntityString (entityString) {
        // eslint-disable-next-line prefer-const
        let [, entity, optional, op, compare] = entityString.trim().match(ENTITY_REGEX);

        optional = !!optional;

        if (!op) {
            return { entity, optional };
        }

        op = this._stringOpToOperation(op);
        compare = this._normalizeComparisonArray(compare ? compare.split(',') : [], op);

        return {
            entity, op, compare, optional
        };
    }

    /**
     *
     * @param {PreprocessorOutput} rule
     * @returns {object}
     */
    getSetStateForEntityRules ({ entities }) {
        return entities.reduce((o, rule) => {

            if (rule instanceof RegExp) {
                return o;
            }
            if (!rule.op) {
                const key = `@${rule.entity}`;
                return Object.assign(o, vars.dialogContext(key, {
                    _$entity: key
                }));
            }

            if (rule.op === COMPARE.EQUAL
                && rule.compare
                && rule.compare.length === 1) {

                const key = `@${rule.entity}`;
                const value = rule.compare[0];

                // @ts-ignore
                return vars.dialogContext(key, value && (value.template || value));
            }
            return o;
        }, {});
    }

    /**
     * Create a rule to be cached inside a routing structure
     *
     * @param {IntentRule|IntentRule[]} intentRule
     * @param {boolean} onlyExpected
     * @returns {string[]}
     */
    parseEntitiesFromIntentRule (intentRule, onlyExpected = false) {
        const expressions = Array.isArray(intentRule) ? intentRule : [intentRule];

        let entities = this._parseEntitiesFromIntentRule(expressions);

        if (onlyExpected) {
            entities = entities
                .filter((e) => e.op !== COMPARE.NOT_EQUAL || e.compare.length !== 0);
        }

        return entities.map((e) => e.entity);
    }

    /**
     *
     * @param {IntentRule[]} intentRules
     * @returns {EntityExpression[]}
     */
    _parseEntitiesFromIntentRule (intentRules) {
        return intentRules
            .filter((ex) => typeof ex === 'object' || ex.match(/^@/))
            .map((ex) => {
                if (typeof ex === 'string') {
                    return this._parseEntityString(ex);
                }
                if (!ex.op) {
                    return ex;
                }

                return {
                    ...ex,
                    compare: this._normalizeComparisonArray(ex.compare, ex.op)
                };
            });
    }

    _escapeRegExp (string) {
        return string
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    /**
     * Create a rule to be cached inside a routing structure
     *
     * @param {IntentRule|IntentRule[]} intentRule
     * @returns {PreprocessorOutput}
     */
    preprocessRule (intentRule) {
        const expressions = Array.isArray(intentRule) ? intentRule : [intentRule];

        const entities = this._parseEntitiesFromIntentRule(expressions);

        /** @type {string[]} */
        // @ts-ignore
        const intents = expressions
            .filter((ex) => typeof ex === 'string' && !ex.match(/^[#@]/));

        /**
         * 1. Emoji lists
         *      conversts #😀😃😄 to /^[😀😃😄]+$/ and matches not webalized
         * 2. Full word lists with a closing hash (opens match)
         *      convers #abc-123|xyz-34# to /abc-123|xyz-34/
         * 3. Full word lists without an open tag
         *      convers #abc-123|xyz-34 to /^abc-123$|^xyz-34$/
         */

        const regexps = expressions
            .filter((ex) => typeof ex === 'string' && ex.match(/^#/))
            .map((rawExp) => {
                // @ts-ignore
                const exp = replaceDiacritics(rawExp);
                const fullEmoji = exp.match(FULL_EMOJI_REGEX);

                if (fullEmoji) {
                    return {
                        r: new RegExp(`^[${fullEmoji[1]}]+$`),
                        f: true,
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
                        .map((s) => `^${this._escapeRegExp(s)}$`.toLowerCase())
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

                return { r, t: true, f: !withClosingHash };
            });

        return { regexps, intents, entities };
    }

    /**
     *
     * @param {string} text
     * @param {PreprocessorOutput} rule
     * @param {Result} nlpResult
     * @param {{}} state
     * @returns {Intent|null}
     */
    matchText (text, rule, nlpResult, state = {}) {
        return this._match(text, rule, state, nlpResult, true);
    }

    _match (text, rule, useState, nlpResult, stateless = false, noEntityThreshold = false) {
        let state = useState;

        if (stateless) {
            state = Object.fromEntries(
                Object.entries(state)
                    .filter(([k]) => !k.startsWith('@'))
            );
        }

        const { regexps, intents, entities } = rule;
        const { entities: reqEntities = [], intents: reqIntents = [] } = nlpResult;
        const tokenized = tokenize(text) || text.trim();

        const noIntentHandicap = reqIntents.length === 0 ? 0 : this.redundantIntentHandicap;
        const regexpScore = this._matchRegexp(text, tokenized, regexps, noIntentHandicap);
        const textLength = text.length;

        if (regexpScore !== 0 || (intents.length === 0 && regexps.length === 0)) {

            if (entities.length === 0) {
                if (regexpScore === 0) {
                    return null;
                }
                const handicap = reqEntities.length * this.redundantEntityHandicap;
                return {
                    intent: null,
                    entities: [],
                    score: regexpScore - handicap
                };
            }

            const {
                score, handicap, matched, metl
            } = this
                ._entityMatching(
                    textLength,
                    entities,
                    reqEntities,
                    state,
                    undefined,
                    undefined,
                    noEntityThreshold
                );

            const allOptional = entities.every((e) => e.optional
                && (!e.op || reqEntities.every((n) => n.entity !== e.entity)));

            if (score <= 0 && !allOptional) {
                return null;
            }
            const countOfAdditionalItems = Math.max(
                matched.length - (regexpScore !== 0 ? 0 : 1),
                0
            );

            const baseScore = regexps.length === 0
                ? score - noIntentHandicap
                : (regexpScore + score) / 2;

            let finalScore = (baseScore - handicap)
                * (this.multiMatchGain ** countOfAdditionalItems);

            if (metl && textLength) {
                const remainingScore = Math.max(0, Math.min(1, finalScore) - (
                    this._ai.confidence + this.redundantEntityHandicap
                ));

                const remainingTextLen = (textLength - metl);
                const minus = (remainingTextLen / textLength) * remainingScore;

                // eslint-disable-next-line max-len,object-curly-newline
                // console.log({ minus, metl, textLength, remainingScore })

                finalScore -= minus;
            }

            // eslint-disable-next-line max-len,object-curly-newline
            // console.log({ countOfAdditionalItems, multiMatch: this.multiMatchGain ** countOfAdditionalItems, handicap, useHandicap, finalScore, rule, baseScore, score, allOptional, entities, reqEntities, matchedEntitiesTextLength });

            if (finalScore <= 0) {
                return null;
            }

            return {
                intent: null,
                entities: matched,
                score: finalScore
            };
        }

        if (reqIntents.length === 0) {
            return null;
        }

        let winningIntent = null;

        intents
            .reduce((total, wanted) => {
                let max = total;
                for (const requestIntent of reqIntents) {
                    const { score, entities: matchedEntities } = this
                        ._intentMatchingScore(
                            textLength,
                            wanted,
                            requestIntent,
                            entities,
                            reqEntities,
                            state,
                            noEntityThreshold
                        );

                    if (score > max) {
                        max = score;

                        winningIntent = {
                            ...requestIntent,
                            score,
                            entities: matchedEntities
                                .filter((e) => e.value !== undefined)
                        };
                    }
                }

                return max;
            }, 0);

        return winningIntent;
    }

    /**
     * Calculate a matching score of preprocessed rule against the request
     *
     * @param {AIRequest} req
     * @param {PreprocessorOutput} rule
     * @param {boolean} [stateless]
     * @param {Entity[]} [reqEntities]
     * @param {boolean} [noEntityThreshold]
     * @returns {Intent|null}
     */
    match (req, rule, stateless = false, reqEntities = req.entities, noEntityThreshold = false) {
        const { intents } = rule;

        const state = stateData(req);

        return this._match(req.text(), rule, state, {
            intents: req.intents,
            entities: reqEntities
        }, stateless || intents.length === 0, noEntityThreshold);
    }

    _getMultiMatchGain (entitiesScore, matchedCount, fromState = 0) {
        return (this.multiMatchGain * entitiesScore) ** Math.max(matchedCount - fromState, 0);
    }

    /**
     *
     * @private
     * @param {number} textLength
     * @param {string} wantedIntent
     * @param {Intent} requestIntent
     * @param {EntityExpression[]} wantedEntities
     * @param {Entity[]} reqEntities
     * @param {object} useState
     * @param {boolean} [noEntityThreshold]
     * @returns {{score:number,entities:Entity[]}}
     */
    _intentMatchingScore (
        textLength,
        wantedIntent,
        requestIntent,
        wantedEntities,
        reqEntities,
        useState,
        noEntityThreshold = false
    ) {
        if (wantedIntent !== requestIntent.intent) {
            return { score: 0, entities: [] };
        }

        const useEntities = requestIntent.entities || reqEntities;

        if (wantedEntities.length === 0) {
            return {
                score: requestIntent.score - (useEntities.length * this.redundantEntityHandicap),
                entities: []
            };
        }

        const {
            score: entitiesScore, handicap, matched, minScore, fromState
        } = this
            ._entityMatching(
                textLength,
                wantedEntities,
                useEntities,
                useState,
                requestIntent.entities
                    ? (x) => Math.atan((x - 0.76) * 40) / Math.atan((1 - 0.76) * 40)
                    : (x) => x,
                reqEntities,
                noEntityThreshold
            );

        // eslint-disable-next-line max-len,object-curly-newline
        // console.log({ wantedEntities, entitiesScore, handicap, matched, minScore, requestIntent });

        const allOptional = wantedEntities.every((e) => e.optional
            && (!e.op || useEntities.every((n) => n.entity !== e.entity)));

        if (entitiesScore <= 0 && !allOptional) {
            return { score: 0, entities: [] };
        }

        const normalizedScore = Math.min(minScore + (handicap / 2), requestIntent.score);
        const scoreWithHandicap = normalizedScore - handicap;
        const multiMatchGain = this._getMultiMatchGain(entitiesScore, matched.length, fromState);

        const score = Math.round((scoreWithHandicap * multiMatchGain) * 10000) / 10000;

        // eslint-disable-next-line max-len,object-curly-newline
        // console.log({ IMS: score, normalizedScore, scoreWithHandicap, multiMatchGain, wantedEntities });

        return {
            score,
            entities: matched
        };
    }

    /**
     *
     * @private
     * @param {number} textLen
     * @param {EntityExpression[]} wantedEntities
     * @param {Entity[]} requestEntities
     * @param {object} [requestState]
     * @param {Function} [scoreFn]
     * @param {Entity[]} [allEntities]
     * @param {boolean} [noEntityThreshold]
     *
     * @returns {EntityMatchingResult}
     */
    _entityMatching (
        textLen,
        wantedEntities,
        requestEntities = [],
        requestState = {},
        scoreFn = (x) => x,
        allEntities = requestEntities,
        noEntityThreshold = false
    ) {
        const occurences = new Map();

        const matched = [];
        let handicap = 0;
        let sum = 0;
        let minScore = 1;
        let fromState = 0;
        let metl = 0;

        let optHandicap = 0;

        for (const wanted of wantedEntities) {
            const usedIndexes = occurences.has(wanted.entity)
                ? occurences.get(wanted.entity)
                : [];

            let entityExists = false;
            const index = requestEntities
                .findIndex((e, i) => {
                    if (e.entity !== wanted.entity
                        || usedIndexes.includes(i)
                        || (!noEntityThreshold && e.score < ENTITY_OK)) {
                        return false;
                    }
                    entityExists = true;
                    return this._entityIsMatching(wanted.op, wanted.compare, e.value, requestState);
                });

            let requestEntity = requestEntities[index];

            let matching = false;
            if (index !== -1) {
                requestEntity = requestEntities[index];
                matching = true;
            } else if (!entityExists && requestState[`@${wanted.entity}`]) {

                const requestedAbsenceOfEntity = wanted.op === COMPARE.NOT_EQUAL
                    && wanted.compare.length === 0;

                if (requestedAbsenceOfEntity) {
                    matching = false;
                } else {
                    requestEntity = {
                        value: requestState[`@${wanted.entity}`],
                        entity: wanted.entity,
                        score: this.stateEntityScore
                    };

                    fromState += 1;

                    matching = this._entityIsMatching(
                        wanted.op,
                        wanted.compare,
                        requestEntity.value,
                        requestState
                    );
                }
            } else if (!entityExists) {
                matching = this
                    ._entityIsMatching(wanted.op, wanted.compare, undefined, requestState);
            }

            if (!matching && (!wanted.optional || entityExists)) {
                return {
                    score: 0, handicap: 0, matched: [], minScore, fromState, metl
                };
            }

            if (!matching) { // && optional && !entityExists
                if (optHandicap < this.redundantEntityHandicap) {
                    handicap += this.redundantEntityHandicap;
                } else {
                    handicap += this.optionalHandicap;
                }
                optHandicap += this.redundantEntityHandicap;
                continue;
            }

            if (wanted.optional) {
                const oph = wanted.op
                    ? this.optionalEqualityHandicap
                    : this.optionalHandicap;

                handicap += oph;
            }

            if (wanted.op === COMPARE.NOT_EQUAL) {
                handicap += requestEntity
                    ? this.optionalHandicap
                    : this.redundantEntityHandicap + this.optionalHandicap;
            }

            if (requestEntity && !wanted.optional && wanted.op !== COMPARE.NOT_EQUAL) {
                minScore = Math.min(minScore, scoreFn(requestEntity.score));
            }

            if (requestEntity) {
                if (typeof requestEntity.end === 'number' && typeof requestEntity.start === 'number') {
                    metl += requestEntity.end - requestEntity.start;
                }

                matched.push(requestEntity);
                sum += scoreFn(requestEntity.score);
                if (index !== -1) {
                    if (!occurences.has(wanted.entity)) occurences.set(wanted.entity, []);
                    occurences.get(wanted.entity).push(index);
                }
            } else {
                matched.push({
                    entity: wanted.entity,
                    score: 1 - (this.redundantEntityHandicap * 2),
                    value: undefined
                });
                sum += 1 - (this.redundantEntityHandicap * 2);
            }
        }

        const withCoveringEntity = textLen && textLen <= metl;

        // eslint-disable-next-line max-len
        // console.log({ metl, withCoveringEntity, wantedEntities, sum, handicap, rl: requestEntities.length, ml: matched.length });

        if (withCoveringEntity) {
            handicap -= this.redundantEntityHandicap;
        } else {
            const otherEntitiesTextLen = allEntities
                .filter((re) => !matched.some((e) => e.entity === re.entity))
                .reduce((tot, entity) => (
                    typeof entity.end === 'number' && typeof entity.start === 'number'
                        ? (tot + (entity.end - entity.start))
                        : 0
                ), 0);

            const coveringHandicap = textLen && otherEntitiesTextLen >= textLen
                ? 1
                : 0;

            const matchingSame = requestEntities.reduce((cnt, e) => {
                const inMatching = matched.some((me) => e.entity === me.entity);
                return cnt + (inMatching ? 1 : 0);
            }, 0);

            // all of them can be in state
            const distinctEntities = new Set(matched.map((m) => m.entity)).size;
            const matchSameOver = matchingSame - matched.length;
            const nonMatching = requestEntities.length - matchingSame;

            const redundantCount = nonMatching
                + (matchSameOver > distinctEntities ? matchSameOver * 0.5 : matchSameOver);

            // eslint-disable-next-line max-len
            // console.log({ distinctEntities, redundantCount, nonMatching, matchSameOver, mat: matched.length, req: requestEntities.length });

            const redundantHandicap = Math.min(
                this.redundantEntityHandicap * (redundantCount + fromState + coveringHandicap),
                this.redundantEntityClamp
            );

            handicap += redundantHandicap;

            // eslint-disable-next-line max-len
            // console.log({ redundantHandicap, requestEntities, matched, handicap, coveringHandicap, otherEntitiesTextLen });

        }
        const score = matched.length === 0 ? 0 : sum / matched.length;

        return {
            score, handicap, matched, minScore, fromState, metl
        };
    }

    _entityIsMatching (op, compare, value, requestState) {
        const operation = op || (typeof compare !== 'undefined' ? COMPARE.EQUAL : null);

        if (typeof value === 'undefined') {
            return operation === COMPARE.NOT_EQUAL
                ? compare.length === 0
                : false;
        }

        let useCmp = (compare || [])
            .map((c) => (typeof c === 'function'
                ? c(requestState)
                : c));

        if ([COMPARE.EQUAL, COMPARE.NOT_EQUAL].includes(operation)) {
            useCmp = useCmp.map((c) => (typeof c === 'string' ? c : `${c}`));
        }

        switch (operation) {
            case COMPARE.EQUAL:
                return useCmp.length === 0 || useCmp.includes(`${value}`);
            case COMPARE.NOT_EQUAL:
                return useCmp.length !== 0 && !useCmp.includes(`${value}`);
            case COMPARE.RANGE: {
                const [min, max] = useCmp;
                const normalized = this._normalizeToNumber(value);
                if (normalized === null) {
                    return false;
                }
                return normalized >= this._normalizeToNumber(min, -Infinity)
                    && normalized <= this._normalizeToNumber(max, Infinity);
            }
            case COMPARE.GT:
            case COMPARE.LT:
            case COMPARE.GTE:
            case COMPARE.LTE: {
                const [cmp] = useCmp;
                const normalized = this._normalizeToNumber(value);
                if (normalized === null) {
                    return false;
                }
                return this._numberComparison(op, this._normalizeToNumber(cmp, 0), normalized);
            }
            default:
                return true;
        }
    }

    _numberComparison (op, cmp, normalized) {
        if (typeof cmp !== typeof normalized) {
            return false;
        }
        switch (op) {
            case COMPARE.GT:
                return normalized > cmp;
            case COMPARE.LT:
                return normalized < cmp;
            case COMPARE.GTE:
                return normalized >= cmp;
            case COMPARE.LTE:
                return normalized <= cmp;
            default:
                return false;
        }
    }

    /**
     *
     * @param {string} text
     * @param {string} tokenized
     * @param {RegexpComparator[]} regexps
     * @param {number} noIntentHandicap
     * @returns {number}
     */
    _matchRegexp (text, tokenized, regexps, noIntentHandicap) {
        if (regexps.length === 0) {
            return 0;
        }

        const scores = regexps.map(({ r, t, f }) => {
            const txt = t ? tokenized : text;
            const m = txt.match(r);

            if (!m) {
                return 0;
            }

            return f
                ? this.regexpScore
                : this.regexpScore - noIntentHandicap;
        });

        return Math.max(0, ...scores);
    }

}

module.exports = AiMatching;
