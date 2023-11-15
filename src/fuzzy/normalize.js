/*
 * @author David Menger
 */
'use strict';

const { normalize } = require('../utils/tokenizer');

/**
 * Preserves only letters (with or withour diacritics) and makes everything lowercased
 *
 * @param {string} str - input string
 * @returns {string}
 */
function cleanup (str) {
    return str
        .replace(/[`']+(\s|$)|(\s|^)['`]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 *
 * @param {string} str
 * @param {boolean} strict
 * @returns {string}
 */
function normalizeEntity (str, strict) {
    if (strict) {
        return `${str}`.toLocaleLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }
    return cleanup(normalize(str));
}

/**
 *
 * @param {string} str
 * @returns {string}
 */
function normalizePreserveEntities (str) {

    let ret = normalize(str);

    str.replace(/@[A-Z0-9-]+/g, (entity, start) => {
        const begin = ret.substring(0, start);
        const end = ret.substring(start + entity.length);

        ret = `${begin}${entity}${end}`;

        return entity;
    });

    return ret;
}

module.exports = {
    normalize,
    cleanup,
    normalizePreserveEntities,
    normalizeEntity
};
