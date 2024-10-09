/*
 * @author David Menger
 */
'use strict';

const CustomEntityDetectionModel = require('./CustomEntityDetectionModel');

const DEFAULT_CACHE_SIZE = 0;
const DEFAULT_PHRASES_CACHE_TIME = 3600000; // one hour

/**
 * @typedef {object} Entity
 * @prop {string} entity
 * @prop {string} value
 * @prop {number} score
 */

/**
 * @typedef {object} Intent
 * @prop {string} intent
 * @prop {number} score
 * @prop {Entity[]} [entities]
 */

/**
 * @typedef {object} Result
 * @prop {string} [text]
 * @prop {Entity[]} entities
 * @prop {Intent[]} intents
 */

/** @typedef {import('../Request')} Request */

class CachedModel extends CustomEntityDetectionModel {

    /**
     * @param {object} options
     * @param {string} [options.prefix]
     * @param {number} [options.cacheSize]
     * @param {boolean} [options.verbose]
     * @param {number} [options.cachePhrasesTime]
     * @param {{ warn: Function, error: Function, log: Function }} [log]
     */
    constructor (options, log = console) {
        super(options, log);

        this._cacheSize = options.cacheSize || DEFAULT_CACHE_SIZE;
        this._cache = [];
        this._cacheMap = new Map();

        /**
         * @type {number}
         */
        this.phrasesCacheTime = DEFAULT_PHRASES_CACHE_TIME;

        this._phrasesCache = null;
        this._phrasesCachedAt = 0;
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

        const promise = this._queryModel(local.text, local.entities)
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

        const expectedEntities = req ? req.expectedEntities() : [];

        const before = local.entities
            .filter((e) => this._entityDetectors.has(e.entity)
                && this._entityDetectors.get(e.entity).clearOverlaps);

        if (this._options.verbose) this._log.log(`#NLP: ${text} [before]`, { before, intents, entities });

        [intents, entities] = this._attachEntities(intents, entities, before, expectedEntities);

        const after = local.entities
            .filter((e) => !this._entityDetectors.has(e.entity)
                || !this._entityDetectors.get(e.entity).clearOverlaps);

        if (this._options.verbose) this._log.log(`#NLP: ${text} [after]`, { after, intents, entities });

        [intents, entities] = this._attachEntities(intents, entities, after);

        if (this._options.verbose) this._log.log(`#NLP: ${text} [attached]`, { intents, entities, expectedEntities });

        return {
            text: local.text,
            intents,
            entities
        };
    }

    _attachEntities (intents, entities, attachEntities, expectedEntities = null) {
        const retEntities = [...entities, ...attachEntities];
        const retIntents = intents
            .map((i) => {
                const ents = [...(i.entities || []), ...attachEntities];

                return {
                    ...i,
                    entities: this.nonOverlapping(ents, expectedEntities || [], !expectedEntities)
                };
            });

        return [
            retIntents,
            this.nonOverlapping(retEntities, expectedEntities || [], !expectedEntities)
        ];
    }

    async getPhrases () {
        if (this._phrasesCachedAt > (Date.now() - this.phrasesCacheTime)) {
            return this._phrasesCache;
        }

        if (!this._phrasesCache) {
            this._phrasesCache = this._getPhrases()
                .then((phrases) => {
                    this._phrasesCache = phrases;
                    this._phrasesCachedAt = Date.now();
                    return phrases;
                })
                .catch((e) => {
                    this._log.warn('AI query failed', e);
                    this._phrasesCache = CustomEntityDetectionModel.getEmptyPhrasesObject();
                    // cache the temporary result for one minute
                    this._phrasesCachedAt = (Date.now() - this.phrasesCacheTime) + 60000;
                    return this._phrasesCache;
                });
        }

        return this._phrasesCache;
    }

    /**
     *
     * @param {string} text
     * @param {Entity[]} entities
     * @returns {Promise<Intent[]|Result>}
     */
    async _queryModel (text, entities) { // eslint-disable-line no-unused-vars
        throw new Error('Not implemented!');
    }

}

module.exports = CachedModel;
