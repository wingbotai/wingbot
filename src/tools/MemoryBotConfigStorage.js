/*
 * @author David Menger
 */
'use strict';

const apiAuthorizer = require('../graphApi/apiAuthorizer');

class MemoryBotConfigStorage {

    /**
     * Creates a new instance
     */
    constructor () {
        this._ts = 0;
        this._config = null;
    }

    /**
     * Returns botUpdate API for wingbot
     *
     * @param {Function} [onUpdate] - async update handler function
     * @param {Function|string[]} [acl] - acl configuration
     * @returns {{updateBot:Function}}
     */
    api (onUpdate = () => Promise.resolve(), acl) {
        const storage = this;
        return {
            async updateBot (args, ctx) {
                if (!apiAuthorizer(args, ctx, acl)) {
                    return null;
                }
                await storage.invalidateConfig();
                await onUpdate();
                return true;
            }
        };
    }

    /**
     * Invalidates current configuration
     *
     * @returns {Promise}
     */
    async invalidateConfig () {
        this._ts = 0;
        this._config = null;
    }

    /**
     * Returns a last timestamp of update
     *
     * @returns {Promise<number>}
     */
    async getConfigTimestamp () {
        return this._ts;
    }

    /**
     * Set the new bot configuration
     *
     * @template T
     * @param {T} newConfig
     * @returns {Promise<T>}
     */
    async updateConfig (newConfig) {
        this._config = newConfig;
        const timestamp = Date.now();
        this._ts = timestamp;
        return Object.assign(newConfig, { timestamp });
    }

    /**
     * @returns {Promise<object|null>}
     */
    async getConfig () {
        return this._config;
    }

}

module.exports = MemoryBotConfigStorage;
