'use strict';

const { default: fetch } = require('node-fetch');
const assert = require('assert');
const { tokenize } = require('../utils');
const CachedModel = require('./CachedModel');

const DEFAULT_MATCHES = 3;
const SERVICE_URL = 'https://model.wingbot.ai';

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
     * @param {string} options.model
     * @param {number} [options.cacheSize]
     * @param {number} [options.matches]
     * @param {Function} [options.fetch]
     * @param {{ warn: Function }} [log]
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
        this._model = options.model;
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
            `text=${encodeURIComponent(tokenize(text).replace(/-/g, ' '))}`,
            `matches=${encodeURIComponent(this._matches)}`
        ];

        try {
            const res = await this._fetch(
                `${this._serviceUrl}/${this._model}?${qs.join('&')}`,
                { timeout: 20000 }
            );

            const response = await res.json();

            if (response.error || !Array.isArray(response.tags)) {
                this._log.warn(response.error);
                return [];
            }

            return {
                intents: response.tags,
                entities: response.entities
            };
        } catch (e) {
            this._log.warn('AI query failed', e);
            return [];
        }
    }

}

module.exports = WingbotModel;
