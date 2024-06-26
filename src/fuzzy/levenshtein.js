/**
 * @author David Menger
 */
'use strict';

const NUMERIC_KOEF = 4;
const SUFFIX_WEIGHT = 0.055;

const SEED_DEFAULT = 0.5;
const SEED_FUZZY = 0.25;
const SEED_FUZZY_MULTIPLICATOR = -0.25;

const WORD_HANDICAP_K_DEFAULT = 0.9;
const WORD_HANDICAP_K_FUZZY = 0.6;

function _min (d0, d1, d2, bx, ay) {
    if (d0 < d1 || d2 < d1) {
        return d0 > d2
            ? d2 + 1
            : d0 + 1;
    }
    return bx === ay
        ? d1
        : d1 + 1;
}

/**
 *
 * @param {string} left
 * @param {string} right
 * @returns {number}
 */
function levenshtein (left, right) {
    if (left === right) {
        return 0;
    }

    let a = left;
    let b = right;

    if (a.length > b.length) {
        const tmp = a;
        a = b;
        b = tmp;
    }

    let la = a.length;
    let lb = b.length;

    while (la > 0 && (a.charCodeAt(la - 1) === b.charCodeAt(lb - 1))) {
        la--;
        lb--;
    }

    let offset = 0;

    while (offset < la && (a.charCodeAt(offset) === b.charCodeAt(offset))) {
        offset++;
    }

    la -= offset;
    lb -= offset;

    if (la === 0 || lb < 3) {
        return lb;
    }

    let x = 0;
    let y;
    let d0;
    let d1;
    let d2;
    let d3;
    let dd;
    let dy;
    let ay;
    let bx0;
    let bx1;
    let bx2;
    let bx3;

    const vector = [];

    for (y = 0; y < la; y++) {
        vector.push(y + 1);
        vector.push(a.charCodeAt(offset + y));
    }

    const len = vector.length - 1;

    for (; x < lb - 3;) {
        bx0 = b.charCodeAt(offset + (d0 = x));
        bx1 = b.charCodeAt(offset + (d1 = x + 1));
        bx2 = b.charCodeAt(offset + (d2 = x + 2));
        bx3 = b.charCodeAt(offset + (d3 = x + 3));
        x += 4;
        dd = x;
        for (y = 0; y < len; y += 2) {
            dy = vector[y];
            ay = vector[y + 1];
            d0 = _min(dy, d0, d1, bx0, ay);
            d1 = _min(d0, d1, d2, bx1, ay);
            d2 = _min(d1, d2, d3, bx2, ay);
            dd = _min(d2, d3, dd, bx3, ay);
            vector[y] = dd;
            d3 = d2;
            d2 = d1;
            d1 = d0;
            d0 = dy;
        }
    }

    for (; x < lb;) {
        bx0 = b.charCodeAt(offset + (d0 = x));
        dd = ++x;
        for (y = 0; y < len; y += 2) {
            dy = vector[y];
            dd = _min(dy, d0, dd, bx0, vector[y + 1]);
            vector[y] = dd;
            d0 = dy;
        }
    }

    return dd;
}

function addSeed (seed, len, value, base = seed) {
    return base + (((len - value) / len) * (1 - seed));
}

function numStats (left, right) {
    const len = Math.max(left.length, right.length);
    const leftNum = left.replace(/[^0-9]+/g, '');
    const rightNum = right.replace(/[^0-9]+/g, '');
    const numLen = Math.max(leftNum.length, rightNum.length);
    const numLev = numLen ? levenshtein(leftNum, rightNum) * NUMERIC_KOEF : 0;
    const numRelLen = len ? numLen / len : 0;

    return {
        len,
        leftNum,
        rightNum,
        numLen,
        numLev,
        numRelLen
    };
}

const STRING_REPLACER = /[^\s-]+/g;
const STRING_SPLITTER = /\s+/g;

/**
 *
 * @param {string} left - training data
 * @param {string} right - query
 * @param {number} [seed]
 * @param {number} [wordKoef]
 * @param {object} [nums]
 * @returns {number}
 */
function relativeLevenshtein (
    left,
    right,
    seed = SEED_DEFAULT,
    wordKoef = WORD_HANDICAP_K_DEFAULT,
    nums = numStats(left, right)
) {
    if (nums.len === 0) {
        return 0;
    }
    let stemLen = Math.min(left.length, right.length);

    const leftWordCount = (left.match(STRING_REPLACER) || ['']).length;
    const rightWordCount = (right.match(STRING_REPLACER) || ['']).length;

    const wordDiff = Math.max(0, rightWordCount - leftWordCount);
    const wordHandicap = (wordKoef ** wordDiff);

    const l = levenshtein(left, right);

    if (nums.numRelLen >= 0.5) {
        const max = nums.len * 0.2; // 1/5 allowed error
        const s = (l / max) * 0.25;

        return Math.max(0, 1 - s) * wordHandicap;
    }

    if (stemLen < 3) {
        return addSeed(seed, nums.len + nums.numLen, l + nums.numLev) * wordHandicap;
    }

    let diff = nums.len - stemLen;

    if (diff <= 2) {
        diff += 2;
        stemLen -= 2;
    }

    let diffWeight = diff * SUFFIX_WEIGHT;

    const lStem = left.substring(0, stemLen);
    const rStem = right.substring(0, stemLen);
    const lSuff = left.substring(stemLen);
    const rSuff = right.substring(stemLen);

    const stemLev = levenshtein(lStem, rStem);
    const suffLev = levenshtein(lSuff, rSuff);

    if (suffLev === 1 && stemLev === 0) {
        diffWeight = (diff - 1) * SUFFIX_WEIGHT;
    }

    const vStem = addSeed(seed, stemLen + nums.numLen, stemLev + nums.numLev, seed - diffWeight);
    const vSuffix = addSeed(1 - diffWeight, diff, suffLev, 0);

    const r = (vStem + vSuffix) * wordHandicap;

    return r;
}

/**
 *
 * @param {string} left
 * @param {string} right
 * @param {number} seed
 * @param {number} [wordKoef]
 * @returns {number}
 */
function multiwordLevenshtein (left, right, seed = SEED_DEFAULT, wordKoef = undefined) {
    const leftSplit = `${left}`.split(STRING_SPLITTER);
    const rightSplit = `${right}`.split(STRING_SPLITTER);

    let sum = 0;
    let sumNums = 0;
    let cntNums = 0;

    const max = Math.max(leftSplit.length, rightSplit.length, 1);
    for (let i = 0; i < max; i++) {
        const ls = leftSplit[i] || '';
        const rs = rightSplit[i] || '';
        const nums = numStats(ls, rs);

        const l = relativeLevenshtein(ls, rs, seed, wordKoef, nums);

        if (nums.numRelLen >= 0.25) {
            cntNums++;
            sumNums += l;
            sum += Math.max(0.85, l);
        } else {
            sum += l;
        }
    }

    const total = sum / max;
    const numeric = cntNums ? (sumNums / cntNums) : 1;

    return total * numeric;
}

module.exports = {
    levenshtein,
    multiwordLevenshtein,
    relativeLevenshtein,
    SEED_DEFAULT,
    SEED_FUZZY,
    SEED_FUZZY_MULTIPLICATOR,
    WORD_HANDICAP_K_FUZZY,
    WORD_HANDICAP_K_DEFAULT
};
