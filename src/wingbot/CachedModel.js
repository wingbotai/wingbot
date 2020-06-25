/*
 * @author David Menger
 */
'use strict';

const DEFAULT_CACHE_SIZE = 10;

/**
 * @typedef {object} Entity
 * @param {string} entity
 * @param {string} value
 * @param {number} score
 */

/**
 * @typedef {object} Intent
 * @param {string} intent
 * @param {number} score
 * @param {Entity[]} [entities]
 */

/**
 * @typedef {object} Result
 * @param {Entity[]} entities
 * @param {Intent[]} intents
 */
class CachedModel {

    /**
     * @param {object} options
     * @param {number} [options.cacheSize]
     * @param {{ warn: Function }} [log]
     */
    constructor (options, log = console) {
        this._options = options;
        this._log = log;

        this._cacheSize = options.cacheSize || DEFAULT_CACHE_SIZE;
        this._cache = [];
        this._cacheMap = new Map();
    }

    /**
     * @param {string} text - the user input
     * @returns {Promise<Result>}
     */
    async resolve (text) {
        if (this._cacheMap.has(text)) {
            return this._cacheMap.get(text);
        }

        const promise = this._queryModel(text)
            .then((res) => {
                // clean the cache
                while (this._cache.length > this._cacheSize) {
                    const clean = this._cache.shift();
                    this._cacheMap.delete(clean);
                }

                if (Array.isArray(res)) { // probably the array of intents
                    return { intents: res, entities: [] };
                }

                return res;
            });

        this._cache.push(text);
        this._cacheMap.set(text, promise);

        return promise;
    }

    /**
     *
     * @param {string} text
     * @returns {Promise<Intent[]|Result>}
     */
    async _queryModel (text) { // eslint-disable-line no-unused-vars
        throw new Error('Not implemented!');
    }

}

module.exports = CachedModel;
