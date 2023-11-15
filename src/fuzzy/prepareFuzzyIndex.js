/**
 * @author David Menger
 */
'use strict';

const {
    shortArrayIndex,
    splitToNgrams,
    cleanupPreNormalized,
    preNormalize
} = require('./fuzzyUtils');

const SHORTEN_MIN = 5000;

/**
 *
 * @param {number} idf
 * @param {*} tfArray
 * @param {NgramCount[]} ngramCounts
 * @returns {IndexMapTuple}
 */
function divideTfArray (idf, tfArray, ngramCounts) {
    // first index is ID, second tfArray
    if (tfArray.length < SHORTEN_MIN) {
        return [idf, tfArray];
    }

    /** @type {IndexMapTuple} */
    const ret = [idf];
    for (const id of tfArray) {
        const [ngramCount] = ngramCounts[id];
        const i = shortArrayIndex(ngramCount);
        if (!ret[i]) {
            ret[i] = [];
        }
        // @ts-ignore
        ret[i].push(id);
    }
    for (let i = 1; i < ret.length; i++) {
        if (!ret[i]) {
            ret[i] = [];
        }
    }
    return ret;
}

/**
 * @typedef {object} Entity
 * @prop {boolean} [id]
 * @prop {string} entity
 * @prop {string|number} value
 * @prop {string[]} [synonyms]
 */

/** @typedef {[idf: number, ...index: number[][]]} IndexMapTuple */
/** @typedef {[entity: string, value: string|number]} EntityIndex */
/** @typedef {[ngramCount: number, index: number, cleanText: string]} NgramCount */
/** @typedef {[ngram: string, index: IndexMapTuple]} IndexMapEntry */

/** @typedef {Map<string, [number, Set<number>]>} IndexMap */

/**
 * @typedef {object} FuzzyIndexData
 * @prop {NgramCount[]} ngramCounts,
 * @prop {EntityIndex[]} entities,
 * @prop {IndexMapEntry[]} indexArray,
 * @prop {number} maxIdf,
 * @prop {number} tfEntryMaxLen,
 * @prop {number} tfTotal,
 * @prop {number} avgIdf
 * @prop {boolean} hasFuzzyMultiplier
 * @prop {number} maxWordCount
 */

/** @typedef {import('./fuzzyUtils').Stemmer} Stemmer */

const DEFAULT_MULTIPLIER = (w) => [w];

/**
 *
 * @param {Entity[]} data
 * @param {Object} [options]
 * @param {Stemmer} [options.stemmer]
 * @param {Function} [options.multiplier]
 * @returns {FuzzyIndexData}
 */
function prepareFuzzyIndex (data, {
    stemmer = null,
    multiplier = DEFAULT_MULTIPLIER
} = {}) {

    /** @type {IndexMap} */
    const indexMap = new Map();

    function addToIndex (token, id) {
        let entry = indexMap.get(token);
        if (!entry) {
            entry = [null, new Set()];
            indexMap.set(token, entry);
        }
        entry[1].add(id);
    }

    function addItemToIndex (cleanText, id) {
        const tokens = splitToNgrams(cleanText);

        tokens
            .forEach((token) => {
                addToIndex(token, id);
            });

        return tokens.length;
    }

    function cleanForMultiples (text) {
        return text.toLocaleLowerCase().replace(/[^a-z0-9\u00C0-\u017F]+/g, ' ');
    }

    let maxWordCount = 0;
    const entities = new Array(data.length);
    let overAllIndex = 0;
    const ngramCounts = data
        // flattern synonyms
        .reduce((arr, {
            entity, value, synonyms = [], id = null
        }, index) => {
            const known = new Set();
            let texts = Array.isArray(synonyms) && synonyms.length && id === true
                ? synonyms
                : [value, ...synonyms];

            texts = texts.map((text) => cleanForMultiples(text));

            texts = texts
                .map((text) => multiplier(text, texts[0]))
                .reduce((a, multiplied) => [
                    ...a,
                    ...multiplied.filter((word) => {
                        if (known.has(word)) {
                            return false;
                        }
                        known.add(word);
                        return true;
                    })
                ], []);

            entities[index] = [entity, value];
            const ngramsData = texts
                .map((text, i) => {
                    const normalized = preNormalize(text);
                    const wordCount = normalized.split(/\s+/g).length;
                    if (wordCount > maxWordCount) maxWordCount = wordCount;
                    const cleanText = cleanupPreNormalized(normalized, stemmer);
                    const ngramCount = addItemToIndex(cleanText, i + overAllIndex);
                    return [ngramCount, index, cleanText];
                });
            overAllIndex += ngramsData.length;
            arr.push(...ngramsData);
            return arr;
        }, []);

    let totIdf = 0;
    let maxIdf = 0;
    let tfEntryMaxLen = 0;
    let tfTotal = 0;
    for (const [key, entry] of indexMap.entries()) {
        const idf = Math.log10((indexMap.size / entry[1].size));
        const tfArray = Array.from(entry[1].values());
        const tfEntry = divideTfArray(idf, tfArray, ngramCounts);
        // @ts-ignore
        indexMap.set(key, tfEntry);

        // stats
        tfTotal++;
        totIdf += idf;
        if (maxIdf < idf) maxIdf = idf;
        if (tfEntryMaxLen < tfEntry.length) tfEntryMaxLen = tfEntry.length;
    }
    const indexArray = Array.from(indexMap.entries());
    const avgIdf = totIdf / indexArray.length;

    return {
        ngramCounts,
        entities,
        // @ts-ignore
        indexArray,
        maxIdf,
        tfEntryMaxLen,
        tfTotal,
        avgIdf,
        hasFuzzyMultiplier: multiplier !== DEFAULT_MULTIPLIER,
        maxWordCount
    };
}

module.exports = prepareFuzzyIndex;
