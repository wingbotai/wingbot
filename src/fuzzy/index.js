/**
 * @author David Menger
 */
'use strict';

const factoryFuzzySearch = require('./factoryFuzzySearch');
const prepareFuzzyIndex = require('./prepareFuzzyIndex');

/** @typedef {import('./factoryFuzzySearch').Entity} Entity */
/** @typedef {import('./factoryFuzzySearch').FuzzySearchOptions} FuzzySearchOptions */
/** @typedef {import('../Ai').WordEntityDetectorFactory} WordEntityDetectorFactory */

/**
 * @callback EntityFactory
 * @returns {Promise<Entity[]>}
 */

/**
 *
 * @param {Entity[]|EntityFactory} entities
 * @param {FuzzySearchOptions} options
 * @returns {WordEntityDetectorFactory}
 */
function fuzzy (entities, options = {}) {

    return async () => {
        const data = typeof entities === 'function'
            ? (await entities())
            : entities;

        const index = prepareFuzzyIndex(data, options);
        return factoryFuzzySearch(index, options);
    };
}

module.exports = {
    fuzzy,
    prepareFuzzyIndex,
    factoryFuzzySearch
};
