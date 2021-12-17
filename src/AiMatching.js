/*
 * @author David Menger
 */
'use strict';

const { replaceDiacritics } = require('./utils/tokenizer');
const { vars } = require('./utils/stateVariables');

/** @typedef {import('handlebars')} Handlebars */

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
 * @param {string} entity
 * @param {string} value
 * @param {number} score
 */

/**
 * @typedef {object} Intent
 * @param {string} [intent]
 * @param {number} score
 * @param {Entity[]} [entities]
 */

/**
 * @typedef {object} EntityExpression
 * @prop {string} entity - the requested entity
 * @prop {boolean} [optional] - the match is optional
 * @prop {Compare} [op] - comparison operation
 * @prop {(string|number|Function)[]} [compare] - value to compare
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
 * @prop {object} [state]
 */

/**
 * @class {AiMatching}
 *
 * Class responsible for NLP Routing by score
 */
class AiMatching {

    constructor () {
        /**
         * When the entity is optional, the final score should be little bit lower
         * (0.001 by default)
         *
         * @type {number}
         */
        this.optionalHandicap = 0.001;

        /**
         * When there are additional entities then required add a handicap for each unmatched entity
         * Also works, when an optional entity was not matched
         * (0.02 by default)
         *
         * @type {number}
         */
        this.redundantEntityHandicap = 0.02;

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
            const flt = parseFloat(value);
            return Number.isNaN(flt) ? returnIfEmpty : flt;
        }
        if (typeof value === 'number') {
            return value;
        }
        return returnIfEmpty;
    }

    _hbsOrFn (value, cb) {
        if (typeof value === 'string' && value.match(/\{\{.+\}\}/)) {
            const compiler = handlebars.compile(value);
            return (data) => {
                const res = compiler(data);
                return cb(res);
            };
        }
        return cb(value);
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
                this._hbsOrFn(val, (r) => this._normalizeToNumber(r, 0))
            ];
        }

        if (op === COMPARE.RANGE) {
            const [min, max] = arr;

            return [
                this._hbsOrFn(min, (r) => this._normalizeToNumber(r, -Infinity)),
                this._hbsOrFn(max, (r) => this._normalizeToNumber(r, Infinity))
            ];
        }

        return arr.map((cmp) => this._hbsOrFn(cmp, (r) => `${r}`));
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
                && rule.compare.length === 1
                && typeof rule.compare[0] !== 'function') {

                const key = `@${rule.entity}`;
                const value = rule.compare[0];

                return Object.assign(o, vars.dialogContext(key, value));
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
                        .map((s) => `^${s}$`.toLowerCase())
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
     * Calculate a matching score of preprocessed rule against the request
     *
     * @param {AIRequest} req
     * @param {PreprocessorOutput} rule
     * @param {boolean} [stateless]
     * @param {Entity[]} [reqEntities]
     * @returns {Intent|null}
     */
    match (req, rule, stateless = false, reqEntities = req.entities) {
        const { regexps, intents, entities } = rule;

        const noIntentHandicap = req.intents.length === 0 ? 0 : this.redundantIntentHandicap;
        const regexpScore = this._matchRegexp(req, regexps, noIntentHandicap);

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

            let useState;
            if (stateless) {
                useState = {};
            } else if (intents.length === 0) {
                useState = Object.entries(req.state)
                    .reduce((o, [k, v]) => {
                        if (k.startsWith('@')) {
                            return o;
                        }
                        return Object.assign(o, { [k]: v });
                    }, {});
            } else {
                useState = req.state;
            }

            const { score, handicap, matched } = this
                ._entityMatching(
                    entities,
                    reqEntities,
                    useState
                );

            const allOptional = entities.every((e) => e.optional);
            if (score === 0 && !allOptional) {
                return null;
            }
            const countOfAdditionalItems = Math.max(
                matched.length - (regexpScore !== 0 ? 0 : 1),
                0
            );

            const baseScore = regexps.length === 0
                ? score - noIntentHandicap
                : (regexpScore + score) / 2;

            return {
                intent: null,
                entities: matched,
                score: (baseScore - handicap)
                    * (this.multiMatchGain ** countOfAdditionalItems)
            };
        }

        if (!req.intents || req.intents.length === 0) {
            return null;
        }

        let winningIntent = null;

        intents
            .reduce((total, wanted) => {
                let max = total;
                for (const requestIntent of req.intents) {
                    const { score, entities: matchedEntities } = this
                        ._intentMatchingScore(wanted, requestIntent, entities, req, stateless);

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
     *
     * @private
     * @param {string} wantedIntent
     * @param {Intent} requestIntent
     * @param {EntityExpression[]} wantedEntities
     * @param {AIRequest} req
     * @param {boolean} stateless
     * @returns {{score:number,entities:Entity[]}}
     */
    _intentMatchingScore (wantedIntent, requestIntent, wantedEntities, req, stateless = false) {
        if (wantedIntent !== requestIntent.intent) {
            return { score: 0, entities: [] };
        }

        const useEntities = requestIntent.entities || req.entities;

        if (wantedEntities.length === 0) {
            return {
                score: requestIntent.score - (useEntities.length * this.redundantEntityHandicap),
                entities: []
            };
        }

        const {
            score: entitiesScore, handicap, matched, minScore
        } = this
            ._entityMatching(
                wantedEntities,
                useEntities,
                stateless ? {} : req.state,
                requestIntent.entities
                    ? (x) => Math.atan((x - 0.76) * 40) / Math.atan((1 - 0.76) * 40)
                    : (x) => x
            );

        const allOptional = wantedEntities.every((e) => e.optional);
        if (entitiesScore === 0 && !allOptional) {
            return { score: 0, entities: [] };
        }

        const score = (Math.min(minScore + (handicap / 2), requestIntent.score) - handicap)
            * ((this.multiMatchGain * entitiesScore) ** matched.length);

        return {
            score,
            entities: matched
        };
    }

    /**
     *
     * @private
     * @param {EntityExpression[]} wantedEntities
     * @param {Entity[]} requestEntities
     * @param {object} [requestState]
     * @param {Function} [scoreFn]
     * @returns {{score: number, handicap: number, matched: Entity[], minScore: number }}
     */
    _entityMatching (wantedEntities, requestEntities = [], requestState = {}, scoreFn = (x) => x) {
        const occurences = new Map();

        const matched = [];
        let handicap = 0;
        let sum = 0;
        let minScore = 1;

        for (const wanted of wantedEntities) {
            const usedIndexes = occurences.has(wanted.entity)
                ? occurences.get(wanted.entity)
                : [];

            let entityExists = false;
            const index = requestEntities
                .findIndex((e, i) => {
                    if (e.entity !== wanted.entity || usedIndexes.includes(i)) {
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
                        score: 1
                    };

                    matching = this
                        ._entityIsMatching(
                            wanted.op, wanted.compare, requestEntity.value, requestState
                        );
                }
            } else if (!entityExists) {
                matching = this
                    ._entityIsMatching(wanted.op, wanted.compare, undefined, requestState);
            }

            if (!matching && !wanted.optional) {
                return {
                    score: 0, handicap: 0, matched: [], minScore
                };
            }

            if (!matching) { // optional
                handicap += this.redundantEntityHandicap;
                continue;
            }

            if (wanted.optional) {
                handicap += this.optionalHandicap;
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

        handicap += (requestEntities.length - matched.length) * this.redundantEntityHandicap;
        const score = matched.length === 0 ? 0 : sum / matched.length;

        return {
            score, handicap, matched, minScore
        };
    }

    _entityIsMatching (op, compare, value, requestState) {
        const operation = op || (typeof compare !== 'undefined' ? COMPARE.EQUAL : null);

        if (typeof value === 'undefined') {
            return operation === COMPARE.NOT_EQUAL
                ? compare.length === 0
                : false;
        }

        const useCmp = (compare || []).map((c) => (typeof c === 'function'
            ? c(requestState)
            : c));

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
                return normalized >= min && normalized <= max;
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
                return this._numberComparison(op, cmp, normalized);
            }
            default:
                return true;
        }
    }

    _numberComparison (op, cmp, normalized) {
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
     * @param {AIRequest} req
     * @param {RegexpComparator[]} regexps
     * @param {number} noIntentHandicap
     * @returns {number}
     */
    _matchRegexp (req, regexps, noIntentHandicap) {
        if (regexps.length === 0) {
            return 0;
        }

        const scores = regexps.map(({ r, t, f }) => {
            const m = req.text(t).match(r);

            if (!m) {
                return 0;
            }

            return f ? 1 : 1 - noIntentHandicap;
        });

        return Math.max(0, ...scores);
    }

}

module.exports = AiMatching;
