/**
 * @author David Menger
 */
'use strict';

const { normalize } = require('./normalize');

const SHORTEN_BY = 2;
const NGRAMS = 3;

/**
 *
 * @param {string|number} word
 * @returns {string}
 */
function preNormalize (word) {
    return normalize(word)
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function stem (normalized, stemmer) {
    if (!stemmer) {
        return normalized;
    }

    const stems = normalized
        .split(/\s+/g)
        .map((w) => stemmer(w) || w);

    return `${normalized} ${stems.join(' ')}`;
}

/** @typedef {{ (word: string): string}} Stemmer */

/**
 *
 * @param {string|number} word
 * @param {Stemmer} stemmer
 * @returns {string}
 */
function cleanup (word, stemmer) {
    const normalized = preNormalize(word);
    return stem(normalized, stemmer);
}

/**
 *
 * @param {string} normalized
 * @param {Stemmer} stemmer
 * @returns {string}
 */
function cleanupPreNormalized (normalized, stemmer) {
    return stem(normalized, stemmer);
}

/**
 *
 * @param {number} ngramCount
 * @returns {number}
 */
function shortArrayIndex (ngramCount) {
    return Math.floor(ngramCount / SHORTEN_BY) + 1;
}

/**
 *
 * @param {string} word
 * @returns {string[]}
 */
function splitToNgrams (word) {
    const prolonged = ` ${word} `;
    const len = prolonged.length - NGRAMS + 1;
    if (len <= 0) {
        return word.length > 0 ? [prolonged] : [];
    }
    const ret = new Array(len);
    for (let i = 0; i < len; i++) {
        const sub = prolonged.substring(i, i + NGRAMS);
        ret[i] = sub;
    }
    return ret;
}

module.exports = {
    cleanup,
    shortArrayIndex,
    splitToNgrams,
    cleanupPreNormalized,
    preNormalize
};
