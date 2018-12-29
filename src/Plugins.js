/*
 * @author David Menger
 */
'use strict';

const Responder = require('./Responder'); // eslint-disable-line no-unused-vars
const Request = require('./Request'); // eslint-disable-line no-unused-vars


/**
 * @callback Plugin
 * @param {Request} req
 * @param {Responder} res
 * @param {Function} [postBack]
 * @param {{isLastIndex:boolean,path:string,expectedPath:string}} [context]
 * @param {Object} [paramsData]
 */

/**
 * Custom code plugins for BuildRouter and wingbot.ai
 */
class Plugins {

    constructor () {
        this._plugins = new Map();
    }

    getPluginFactory (name) {
        if (!this._plugins.has(name)) {
            throw new Error(`Unknown Plugin: ${name}. Ensure its registration.`);
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
     * @param {Plugin} [plugin] - plugin - optional when including plugin object
     */
    register (name, plugin) {
        if (typeof name === 'string') {
            this._plugins.set(name, plugin);
            return;
        }
        name._plugins.forEach((el, key) => {
            this._plugins.set(el, key);
        });
    }

}

module.exports = Plugins;
