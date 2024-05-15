/**
 * @author David Menger
 */
'use strict';

const { shortArrayIndex, splitToNgrams, cleanup } = require('./fuzzyUtils');
const {
    multiwordLevenshtein, SEED_FUZZY, SEED_FUZZY_MULTIPLICATOR, WORD_HANDICAP_K_FUZZY
} = require('./levenshtein');

const LOWER_DUPLICATES = 0.9;

function getIndexesToIterate (ngrams, tfEntry) {
    if (tfEntry.length === 2) {
        return [1, 1];
    }
    const min = Math.ceil(ngrams * 0.6);
    const max = Math.floor(ngrams * 1.5);
    return [shortArrayIndex(min), shortArrayIndex(max)];
}

/**
 * @typedef {object} FuzzySearchOptions
 * @prop {boolean} [keepMultipleValues]
 * @prop {Stemmer} [stemmer]
 * @prop {number} [threshold]
 */

/** @typedef {import('./prepareFuzzyIndex').FuzzyIndexData} FuzzyIndexData */
/** @typedef {import('./prepareFuzzyIndex').Stemmer} Stemmer */
/** @typedef {import('../Ai').WordEntityDetector} WordEntityDetector */
/** @typedef {import('../Ai').WordDetectorData} WordDetectorData */

/**
 * @typedef {object} Entity
 * @prop {string} entity
 * @prop {string} value
 * @prop {string[]} [synonyms]
 */

function searchFnFactory (indexMap, ngramCounts, entities, maxIdf, {
    stemmer = null,
    keepMultipleValues = false,
    threshold = 0.835,
    limit = undefined
}, hasFuzzyMultiplier = false) {
    /** @type {WordEntityDetector} */
    const searchFn = (search) => {
        const cleanQuery = cleanup(search, stemmer);
        const tokens = splitToNgrams(cleanQuery);
        const results = new Map();

        tokens.forEach((token) => {
            const entry = indexMap.get(token);
            if (!entry) {
                return;
            }
            const [idf] = entry;
            const [startIndex, endIndex] = getIndexesToIterate(tokens.length, entry);

            const maxIndex = Math.min(endIndex, entry.length - 1);
            for (let i = startIndex; i <= maxIndex; i++) {
                for (const id of entry[i]) {
                    let res = results.get(id);
                    if (!res) {
                        res = { cnt: 0, idf: 0 };
                        results.set(id, res);
                    }
                    res.cnt++;
                    res.idf += idf;
                }
            }

        });

        let maxScore = 0;
        let maxRelIdf = 0; // small but positive
        const levenshteinSeed = hasFuzzyMultiplier
            ? SEED_FUZZY_MULTIPLICATOR
            : SEED_FUZZY;

        const percentage = hasFuzzyMultiplier
            ? 0.6
            : 0.5;

        const preprocessed = Array.from(results.entries())
            .filter(([id, { cnt }]) => {
                const [ngramCount] = ngramCounts[id];
                const percentageOfMatchedNgrams = (cnt * 2) / (ngramCount + tokens.length);
                return percentageOfMatchedNgrams >= percentage;
            })
            .map(([id, { cnt, idf }]) => {
                const [, entityIndex, cleanText] = ngramCounts[id];
                const [entity, value] = entities[entityIndex];
                const relIdf = (idf / cnt) / maxIdf;
                let score = multiwordLevenshtein(
                    cleanText,
                    cleanQuery,
                    levenshteinSeed,
                    WORD_HANDICAP_K_FUZZY
                );
                let start = 0;

                if (cleanQuery.match(/^[^\s]{1,3}\s+.{6,}$/)) {
                    const without = cleanQuery.replace(/^[^\s]{1,3}\s+/, '');
                    const altScore = multiwordLevenshtein(
                        cleanText,
                        without,
                        levenshteinSeed,
                        WORD_HANDICAP_K_FUZZY
                    );

                    if (altScore > score) {
                        score = altScore;
                        start = cleanQuery.length - without.length;
                    }
                }

                if (maxScore < score) maxScore = score;
                if (maxRelIdf < relIdf) maxRelIdf = relIdf;

                return {
                    entity,
                    value,
                    _relIdf: relIdf,
                    score,
                    ...(start ? { start } : {})
                };
            });

        const found = preprocessed.map((o) => {
            const { _relIdf: relIdf } = o;
            // eslint-disable-next-line no-param-reassign
            delete o._relIdf;

            const koef = maxRelIdf <= 0 ? relIdf : (relIdf / maxRelIdf);
            const addToScore = ((1 - maxScore) / 2) * koef;

            Object.assign(o, {
                score: Math.round((o.score + addToScore) * 10000) / 10000
            });

            return o;
        });

        found.sort((a, z) => z.score - a.score);

        const known = new Map();
        const res = found
            .filter((result) => {
                const key = keepMultipleValues ? `${result.entity}|${result.value}` : result.entity;
                if (result.score < threshold) {
                    return false;
                }
                if (known.has(key)) {
                    const { result: origResult, score, alts } = known.get(key);
                    if (!keepMultipleValues
                            && Math.abs(score - result.score) < (1 - LOWER_DUPLICATES)
                            && origResult.value !== result.value) {

                        if (!alts.some((a) => a.value === result.value)) {
                            // five percent down for collisions
                            origResult.score *= LOWER_DUPLICATES;
                        }

                        alts.push(result);

                        Object.assign(origResult, {
                            alternatives: alts
                        });
                    }
                    return false;
                }
                known.set(key, { result, score: result.score, alts: [] });
                return true;
            })
            .slice(0, limit);

        res.forEach((entity) => {
            if ('alternatives' in entity) {
                // @ts-ignore
                let { alternatives } = entity;

                const kn = new Set([entity.value]);
                alternatives = alternatives
                    // @ts-ignore
                    .sort((a, z) => z.score - a.score)
                    .filter((e) => !known.has(e.value) && kn.add(e.value));

                // @ts-ignore
                for (let i = 0; i < alternatives.length; i++) {
                    const alt = alternatives[i];
                    // @ts-ignore
                    Object.assign(alt, {
                        // @ts-ignore
                        score: alt.score * (LOWER_DUPLICATES ** alternatives.length)
                    });
                }

                Object.assign(entity, { alternatives });
            }
        });

        return res;
    };

    return searchFn;
}

/**
 *
 * @param {FuzzyIndexData} data
 * @param {FuzzySearchOptions} [options]
 * @returns {WordDetectorData}
 */
function factoryFuzzySearch (data, options = {}) {
    const {
        ngramCounts,
        entities,
        indexArray,
        maxIdf,
        hasFuzzyMultiplier,
        maxWordCount
    } = data;

    const indexMap = new Map(indexArray);

    const detector = searchFnFactory(
        indexMap,
        ngramCounts,
        entities,
        maxIdf,
        options,
        hasFuzzyMultiplier
    );

    return {
        detector,
        maxWordCount
    };
}

module.exports = factoryFuzzySearch;
