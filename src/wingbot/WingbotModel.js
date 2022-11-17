'use strict';

const { default: fetch } = require('node-fetch');
const assert = require('assert');
const CachedModel = require('./CachedModel');

const DEFAULT_MATCHES = 3;
const SERVICE_URL = 'https://model.wingbot.ai';
const TRAINING_URL = 'http://training.wingbot.ai';

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

/**
 * @class
 */
class WingbotModel extends CachedModel {

    /**
     * @param {object} options
     * @param {string} [options.serviceUrl]
     * @param {string} [options.trainingUrl]
     * @param {string} options.model
     * @param {number} [options.cacheSize]
     * @param {number} [options.matches]
     * @param {Function} [options.fetch]
     * @param {{ warn: Function, log: Function, error: Function }} [log]
     */
    constructor (options, log = console) {
        super(options, log);

        assert.equal(typeof options.model, 'string', 'The model option has to be string');

        this._matches = options.matches || DEFAULT_MATCHES;

        /** @type {fetch} */
        this._fetch = fetch;

        // @ts-ignore
        if (options.fetch) this._fetch = options.fetch;

        this._serviceUrl = options.serviceUrl || SERVICE_URL;
        this._trainingUrl = options.trainingUrl || TRAINING_URL;
        this._model = options.model;
    }

    async _getPhrases () {
        const res = await this._fetch(
            `${this._trainingUrl}/${this._model}-phrases.json`,
            { timeout: 10000 }
        );

        if ([404, 401, 403].includes(res.status)) {
            // model does not exist probably
            return { phrases: new Map() };
        }

        if (res.status !== 200) {
            throw new Error(`Failed to load Phrases: ${res.statusText}`);
        }

        const { phrases = [] } = await res.json();

        return { phrases: new Map(phrases) };
    }

    /**
     *
     * @param {string} text
     * @returns {Promise<Result>}
     */
    async _queryModel (text) {
        if ((text || '').trim().length === 0) {
            return [];
        }

        const qs = [
            `text=${encodeURIComponent(text)}`,
            `matches=${encodeURIComponent(this._matches)}`
        ];

        try {
            const res = await this._fetch(
                `${this._serviceUrl}/${this._model}?${qs.join('&')}`,
                { timeout: 20000 }
            );

            if (res.status === 403) {
                // model does not exist
                this._log.log(`NLP model '${this._model}' does not exist or is not deployed yet.`);
                return { intents: [], entities: [] };
            }

            const response = await res.json();

            if (res.status >= 300) {
                this._log.warn(`AI query failed: ${response.message || res.statusText}`);
                return { intents: [], entities: [] };
            }

            return {
                intents: response.intents || response.tags,
                entities: response.entities
            };
        } catch (e) {
            this._log.warn('AI query failed', e);
            return { intents: [], entities: [] };
        }
    }

}

module.exports = WingbotModel;
