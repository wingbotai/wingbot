/*
 * @author David Menger
 */
'use strict';

const { replaceDiacritics } = require('./utils/tokenizer');

const FULL_EMOJI_REGEX = /^#((?:[\u2600-\u27bf].?|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])+)$/;
const HAS_CLOSING_HASH = /^#(.+)#$/;

/**
 * @typedef {string} Compare
 */

/**
 * @enum {Compare}
 */
const COMPARE = {
    EQUAL: 'eq',
    NOT_EQUAL: 'ne',
    RANGE: 'range'
};

/**
 * @typedef {Object} Entity
 * @param {string} entity
 * @param {string} value
 * @param {number} score
 */

/**
 * @typedef {Object} Intent
 * @param {string} [intent]
 * @param {number} score
 * @param {Entity[]} [entities]
 */

/**
 * @typedef {Object} EntityExpression
 * @prop {string} entity - the requested entity
 * @prop {boolean} [optional] - the match is optional
 * @prop {Compare} [op] - comparison operation
 * @prop {string[]|number[]} [compare] - value to compare with
 */


/**
 * @typedef {string|EntityExpression} IntentRule
 */

/**
 * @typedef {Object} RegexpComparator
 * @prop {RegExp} r - regular expression
 * @prop {boolean} t - use normalized text
 */

/**
 * @typedef {Object} PreprocessorOutput
 * @prop {RegexpComparator[]} regexps
 * @prop {string[]} intents
 * @prop {EntityExpression[]} entities
 */

/**
 * @typedef {Object} AIRequest
 * @prop {Function} text
 * @prop {Intent[]|null} intents
 * @prop {Entity[]} entities
 */

class AiMatching {

    constructor () {
        this.optionalHandicap = 0.001;
        this.redundantHandicap = 0.05;
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

    _normalizeComparisonArray (compare, op) {
        const arr = Array.isArray(compare) ? compare : [compare];

        if (op === COMPARE.RANGE) {
            const [min, max] = arr;

            return [
                this._normalizeToNumber(min, -Infinity),
                this._normalizeToNumber(max, Infinity)
            ];
        }

        return arr.map(cmp => `${cmp}`);
    }

    /**
     *
     * @param {IntentRule|IntentRule[]} intent
     * @returns {PreprocessorOutput}
     */
    preprocessRule (intent) {
        const expressions = Array.isArray(intent) ? intent : [intent];

        const entities = expressions
            .filter(ex => typeof ex === 'object' || ex.match(/^@/))
            .map((ex) => {
                if (typeof ex === 'string') {
                    return { entity: ex.replace(/^@/, '') };
                }
                if (!ex.op) {
                    return ex;
                }

                return {
                    ...ex,
                    compare: this._normalizeComparisonArray(ex.compare, ex.op)
                };
            });

        /** @type {string[]} */
        // @ts-ignore
        const intents = expressions
            .filter(ex => typeof ex === 'string' && !ex.match(/^[#@]/));

        /**
         * 1. Emoji lists
         *      conversts #😀😃😄 to /^[😀😃😄]+$/ and matches not webalized
         * 2. Full word lists with a closing hash (opens match)
         *      convers #abc-123|xyz-34# to /abc-123|xyz-34/
         * 3. Full word lists without an open tag
         *      convers #abc-123|xyz-34 to /^abc-123$|^xyz-34$/
         */

        const regexps = expressions
            .filter(ex => typeof ex === 'string' && ex.match(/^#/))
            .map((rawExp) => {
                // @ts-ignore
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

        return { regexps, intents, entities };
    }

    /**
     *
     * @param {AIRequest} req
     * @param {PreprocessorOutput} rules
     * @returns {Intent|null}
     */
    match (req, rules) {
        const { regexps, intents, entities } = rules;

        const regexpMatching = this._matchRegexp(req, regexps);

        if (regexpMatching || (intents.length === 0 && regexps.length === 0)) {
            const noIntentHandicap = req.intents.length === 0 ? 0 : this.redundantHandicap;

            if (entities.length === 0) {
                if (!regexpMatching) {
                    return null;
                }
                const handicap = req.entities.length * this.redundantHandicap;
                return {
                    intent: null,
                    entites: [],
                    score: 1 - noIntentHandicap - handicap
                };
            }
            const { score, handicap, matched } = this._entityMatching(entities, req.entities);
            if (score === 0) {
                return null;
            }
            return {
                intent: null,
                entities: matched,
                score: score - noIntentHandicap - handicap
            };
        }

        if (!req.intents || req.intents.length === 0) {
            return null;
        }

        let winningIntent = null;

        intents
            .reduce((total, wantedIntent) => {
                let max = total;
                for (const requestIntent of req.intents) {
                    const score = this
                        ._intentMatchingScore(wantedIntent, requestIntent, entities, req.entities);

                    if (score > max) {
                        max = score;
                        winningIntent = {
                            ...requestIntent,
                            score
                        };
                    }
                }

                return max;
            }, 0);

        return winningIntent;
    }

    /**
     *
     * @param {string} wantedIntent
     * @param {Intent} requestIntent
     * @param {EntityExpression[]} wantedEntities
     * @param {Entity[]} [allEntities]
     * @returns {number}
     */
    _intentMatchingScore (wantedIntent, requestIntent, wantedEntities, allEntities) {
        if (wantedIntent !== requestIntent.intent) {
            return 0;
        }

        const useEntities = requestIntent.entities || allEntities;

        if (wantedEntities.length === 0) {
            return requestIntent.score - (useEntities.length * this.redundantHandicap);
        }

        const { score, handicap } = this
            ._entityMatching(wantedEntities, useEntities);

        if (score === 0) {
            return 0;
        }

        return requestIntent.score - handicap;
    }

    /**
     *
     * @param {EntityExpression[]} wantedEntities
     * @param {Entity[]} requestEntities
     * @returns {{score: number, handicap: number, matched: Entity[] }}
     */
    _entityMatching (wantedEntities, requestEntities = []) {
        const occurences = new Map();

        const matched = [];
        let handicap = 0;
        let sum = 0;

        for (const wanted of wantedEntities) {
            const start = occurences.has(wanted.entity)
                ? occurences.get(wanted.entity)
                : 0;

            const index = requestEntities
                .findIndex((e, i) => e.entity === wanted.entity && i >= start);

            const matching = index !== -1
                && this._entityIsMatching(wanted.op, wanted.compare, requestEntities[index].value);

            if (!matching && !wanted.optional) {
                return { score: 0, handicap: 0, matched: [] };
            }

            if (!matching) { // optional
                handicap += this.redundantHandicap;
                continue;
            }

            if (wanted.optional) {
                handicap += this.optionalHandicap;
            }

            matched.push(requestEntities[index]);
            sum += requestEntities[index].score;
            occurences.set(wanted.entity, index + 1);
        }

        handicap += (requestEntities.length - matched.length) * this.redundantHandicap;
        const score = matched.length === 0 ? 0 : sum / matched.length;

        return { score, handicap, matched };
    }

    _entityIsMatching (op, compare, value) {
        switch (op || (typeof compare !== 'undefined' ? COMPARE.EQUAL : null)) {
            case COMPARE.EQUAL:
                return compare.includes(`${value}`);
            case COMPARE.NOT_EQUAL:
                return !compare.includes(`${value}`);
            case COMPARE.RANGE: {
                const [min, max] = compare;
                const normalized = this._normalizeToNumber(value);
                if (normalized === null) {
                    return false;
                }
                return normalized >= min && normalized <= max;
            }
            default:
                return true;
        }
    }

    /**
     *
     * @param {AIRequest} req
     * @param {RegexpComparator[]} regexps
     * @returns {boolean}
     */
    _matchRegexp (req, regexps) {
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
        return false;
    }

}

module.exports = AiMatching;
