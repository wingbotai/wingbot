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
const { compileWithState } = require('./utils');

/** @typedef {import('./Router').BaseConfiguration} BaseConfiguration */

/**
 * @template {object} [S=object]
 * @template {BaseConfiguration} [C=object]
 * @typedef {import('./Router').Middleware<S,C>} Middleware
 */

/**
 *
 * @template {object} [S=object]
 * @template {BaseConfiguration} [C=object]
 * @callback Plugin
 * @param {Request<S,C>} req
 * @param {Responder} res
 * @param {Function} [postBack]
 * @param {{isLastIndex:boolean,path:string,expectedPath:string}} [context]
 * @param {object} [paramsData]
 */

/**
 *
 * @template {object} [S=object]
 * @template {BaseConfiguration} [C=object]
 * @callback PluginFactory
 * @param {object} params
 * @param {C} configuration
 * @returns {Router<S,C>|Middleware<S,C>}
 */

/**
 * @typedef {object} PluginFactoryOptions
 * @prop {string[]} [notLastMessageItems]
 */

/**
 * Custom code plugins for BuildRouter and wingbot.ai
 *
 * @template {object} [S=object]
 * @template {object} [C=Object]
 * @class Plugins
 */
class Plugins {

    constructor () {
        this._plugins = new Map();
    }

    /**
     *
     * @param {string} name
     * @returns {PluginFactoryOptions}
     */
    getPluginOptions (name) {
        const plugin = this._getPlug(name, {});

        if (plugin && plugin.options) {
            return plugin.options;
        }

        return {};
    }

    _getPlug (name, defaultPlugin) {
        let plugin;
        if (plugins.has(name)) {
            plugin = plugins.get(name);
        } else if (this._plugins.has(name)) {
            plugin = this._plugins.get(name);
        } else if (defaultPlugin) {
            plugin = defaultPlugin;
        } else {
            throw new Error(`Unknown Plugin: ${name}. Ensure its registration.`);
        }
        return plugin;
    }

    getPluginFactory (name, paramsData = {}, configuration = {}, defaultPlugin = null) {
        const plugin = this._getPlug(name, defaultPlugin);
        if (plugin && plugin.pluginFactory) {
            return plugin.pluginFactory(paramsData, configuration);
        }
        return plugin;
    }

    /* eslint jsdoc/check-types: 0 */
    /**
     * Get plugin for the router
     *
     * @param {string} name
     * @param {object} [paramsData]
     * @param {Map<string,Function[]>|Object<string,Middleware<S>|string>} [items]
     * @param {object} [context]
     * @param {boolean} [context.isLastIndex]
     * @param {Router} [context.router]
     * @param {object} [context.configuration]
     * @param {Middleware} [context.defaultPlugin]
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
     *     {
     *          onSuccess: (req, res) => { res.text('yes, success'); }
     *     }
     * ));
     */
    getWrappedPlugin (
        name,
        paramsData = {},
        items = new Map(),
        context = { isLastIndex: true, configuration: {} }
    ) {
        let useItems = items;

        if (!(items instanceof Map)) {
            // @ts-ignore
            useItems = new Map(
                Object.keys(items)
                    .map((key) => {
                        const responder = typeof items[key] === 'function'
                            ? items[key]
                            : (req, res) => {
                                // @ts-ignore
                                const text = compileWithState(req, res, items[key]);
                                res.text(text);
                            };

                        return [
                            key,
                            [responder]
                        ];
                    })
            );
        }

        const cleanParams = Object.entries(paramsData)
            .filter(([, e]) => e !== null && e !== undefined)
            .map(([k, e]) => ({ [k]: e }))
            .reduce(Object.assign, {});

        const customFn = this.getPluginFactory(
            name,
            cleanParams,
            context.configuration,
            context.defaultPlugin
        );

        if (typeof customFn === 'object') {
            // this is an attached router

            return new RouterWrap(customFn, useItems, cleanParams);
        }

        const { router = new Router() } = context;

        return wrapPluginFunction(customFn, cleanParams, useItems, context, router);
    }

    code (name, factoryFn = null) {
        console.warn('Plugins#code() is deprecated, use #register() instead'); // eslint-disable-line no-console
        this.register(name, factoryFn);
    }

    /**
     * Register plugin
     *
     * @param {string|Plugins<S,C>} name - plugin name or plugins object to include
     * @param {Plugin<S,C>|Router<S,C>} [plugin] - plugin - optional when including plugin object
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
     * @param {PluginFactory<S,C>} pluginFactory - function, which returns a plugin
     * @param {PluginFactoryOptions} [options]
     */
    registerFactory (name, pluginFactory, options = {}) {
        if (typeof pluginFactory !== 'function') {
            // eslint-disable-next-line no-console
            console.warn(`Plugin factory expected, ${typeof pluginFactory} given (plugin: ${name})`);
        }
        this._plugins.set(name, { pluginFactory, options });
    }

}

module.exports = Plugins;
