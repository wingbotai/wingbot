/*
 * @author David Menger
 */
'use strict';

const Responder = require('./Responder'); // eslint-disable-line no-unused-vars
const Request = require('./Request'); // eslint-disable-line no-unused-vars
const Router = require('./Router'); // eslint-disable-line no-unused-vars
const plugins = require('../plugins');
const RouterWrap = require('./RouterWrap');
const wrapPluginFunction = require('./utils/wrapPluginFunction');

/**
 * @callback Plugin
 * @param {Request} req
 * @param {Responder} res
 * @param {Function} [postBack]
 * @param {{isLastIndex:boolean,path:string,expectedPath:string}} [context]
 * @param {object} [paramsData]
 */

/**
 * Custom code plugins for BuildRouter and wingbot.ai
 */
class Plugins {

    constructor () {
        this._plugins = new Map();
    }

    getPluginFactory (name, paramsData = {}) {
        let plugin;
        if (plugins.has(name)) {
            plugin = plugins.get(name);
        } else if (!this._plugins.has(name)) {
            throw new Error(`Unknown Plugin: ${name}. Ensure its registration.`);
        } else {
            plugin = this._plugins.get(name);
        }
        if (plugin && plugin.pluginFactory) {
            return plugin.pluginFactory(paramsData);
        }
        return plugin;
    }

    /**
     * Get plugin for the router
     *
     * @param {string} name
     * @param {object} [paramsData]
     * @param {Map<string,Function[]>} [items]
     * @param {object} [context]
     * @param {boolean} [context.isLastIndex]
     * @param {Router} [context.router]
     * @example
     *
     * const { Router } = require('wingbot');
     *
     * const bot = new Router();
     *
     * // simply
     * bot.use('simple-route', plugins.getWrappedPlugin('myCoolPLugin'));
     *
     * // fully
     * bot.use('full-plugin-route', plugins
     *  .getWrappedPlugin(
     *     'fancyPLugin',
     *     { param: 123 },
     *     new Map([
     *       ['onSuccess', [(req, res) => { res.text('yes, success'); }]]
     *     ])
     * ));
     */
    getWrappedPlugin (
        name,
        paramsData = {},
        items = new Map(),
        context = { isLastIndex: true }
    ) {
        const customFn = this.getPluginFactory(name, paramsData);
        if (typeof customFn === 'object') {
            // this is an attached router

            return new RouterWrap(customFn, items, paramsData);
        }

        const { router = new Router() } = context;

        return wrapPluginFunction(customFn, paramsData, items, context, router);
    }

    code (name, factoryFn = null) {
        console.warn('Plugins#code() is deprecated, use #register() instead'); // eslint-disable-line no-console
        this.register(name, factoryFn);
    }

    /**
     * Register plugin
     *
     * @param {string|Plugins} name - plugin name or plugins object to include
     * @param {Plugin|Router} [plugin] - plugin - optional when including plugin object
     */
    register (name, plugin) {
        if (typeof name === 'string') {
            // @ts-ignore
            if (typeof plugin !== 'function') {
                // eslint-disable-next-line no-console
                console.warn(`For <Router> plugins, please use registerFactory() instead of register() (plugin: ${name})`);
            }
            this._plugins.set(name, plugin);
            return;
        }
        name._plugins.forEach((el, key) => {
            this._plugins.set(key, el);
        });
    }

    /**
     * Register plugin factory
     *
     * @param {string} name - plugin name or plugins object to include
     * @param {Function} pluginFactory - function, which returns a plugin
     */
    registerFactory (name, pluginFactory) {
        if (typeof pluginFactory !== 'function') {
            // eslint-disable-next-line no-console
            console.warn(`Plugin factory expected, ${typeof pluginFactory} given (plugin: ${name})`);
        }
        this._plugins.set(name, { pluginFactory });
    }

}

module.exports = Plugins;
