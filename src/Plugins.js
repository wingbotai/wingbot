/*
 * @author David Menger
 */
'use strict';

/**
 * Custom code plugins for BuildRouter and wingbot.ai
 */
class Plugins {

    constructor () {
        this._plugins = new Map();
    }

    getPluginFactory (name) {
        if (!this._plugins.has(name)) {
            throw new Error(`Unknown Resolver: ${name}. Ensure its registration.`);
        }
        return this._plugins.get(name);
    }

    code (name, factoryFn = null) {
        console.warn('Plugins#code() is deprecated, use #register() instead'); // eslint-disable-line no-console
        this.register(name, factoryFn);
    }

    /**
     * Register plugin
     *
     * @param {string|Plugins} name - plugin name or plugins object to include
     * @param {Function} [factoryFn] - plugin factory - optional when including plugin object
     */
    register (name, factoryFn) {
        if (typeof name === 'string') {
            this._plugins.set(name, factoryFn);
            return;
        }
        name._plugins.forEach((el, key) => {
            this._plugins.set(el, key);
        });
    }

}

module.exports = Plugins;
