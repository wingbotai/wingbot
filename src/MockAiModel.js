/**
 * @author David Menger
 */
'use strict';

const CachedModel = require('./wingbot/CachedModel');

/** @typedef {import('./wingbot/CachedModel').Result} Result */
/** @typedef {import('./wingbot/CachedModel').Intent} Intent */

/**
 * Class for mocking AI requests
 */
class MockAiModel extends CachedModel {

    /**
     *
     *
     * @param {object} options
     * @param {number} [options.cacheSize]
     * @param {{ warn: Function, error: Function }} [log]
     * @param {Map<string,Intent[]|Result>} mockMap
     */
    constructor (options, log = console, mockMap = new Map()) {
        super(options, log);

        this._mockMap = mockMap;
    }

    _mapIntent (intent) {
        return {
            score: 1,
            entities: [],
            ...intent
        };
    }

    async _queryModel (text) {
        if (this._mockMap.has(text)) {
            const res = this._mockMap.get(text);
            if (!res) {
                return [];
            }
            if (!Array.isArray(res) && !res.intents) {
                return [this._mapIntent(res)];
            }
            if (res.intents) {
                return {
                    ...res,
                    intents: res.intents.map((i) => this._mapIntent(i))
                };
            }
            return res.map((i) => this._mapIntent(i));
        }
        return [];
    }
}

module.exports = MockAiModel;
