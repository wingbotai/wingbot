/*
 * @author David Menger
 */
'use strict';

const CustomEntityDetectionModel = require('./CustomEntityDetectionModel');

const DEFAULT_CACHE_SIZE = 0;

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

/** @typedef {import('../Request')} Request */
class CachedModel extends CustomEntityDetectionModel {

    /**
     * @param {object} options
     * @param {number} [options.cacheSize]
     * @param {{ warn: Function, error: Function }} [log]
     */
    constructor (options, log = console) {
        super(options, log);

        this._cacheSize = options.cacheSize || DEFAULT_CACHE_SIZE;
        this._cache = [];
        this._cacheMap = new Map();
    }

    /**
     * @param {string} text - the user input
     * @param {Request} [req] - the user input
     * @returns {Promise<Result>}
     */
    async resolve (text, req = null) {
        const local = await super.resolve(text, req);

        if (this._cacheMap.has(text)) {
            return this._cacheMap.get(text);
        }

        const promise = this._queryModel(local.text)
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

        if (this._cacheSize !== 0) {
            this._cache.push(local.text);
            this._cacheMap.set(local.text, promise);
        }

        const res = await promise;
        let { intents = [], entities = [] } = Array.isArray(res) ? { intents: res } : res;

        entities = [...entities, ...local.entities];
        intents = intents.map((i) => ({
            ...i,
            entities: [...(i.entities || []), ...local.entities]
        }));

        return {
            text: local.text,
            intents,
            entities
        };
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
