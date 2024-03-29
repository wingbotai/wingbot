/*
 * @author David Menger
 */
'use strict';

const { pathToRegexp } = require('path-to-regexp');
const ReducerWrapper = require('./ReducerWrapper');
const { makeAbsolute } = require('./utils');

const Responder = require('./Responder'); // eslint-disable-line no-unused-vars
const Request = require('./Request'); // eslint-disable-line no-unused-vars

function defaultPathContext () {
    return { globalIntentsMeta: {}, path: '/*' };
}

/** @typedef {true|false|null|undefined|number|void} RoutingInstruction */

/**
 * @callback PostBackDataCallback
 * @returns {object|Promise<object>}
 */

/**
 * @callback PostBack postback function
 * @param {string} [action]
 * @param {object|PostBackDataCallback} [data]
 * @param {boolean} [dispatchSync]
 * @returns {Promise<RoutingInstruction>}
 */

/**
 * @template {object} [S=object]
 * @template {BaseConfiguration} [C=object]
 * @callback Resolver processing function
 * @param {Request<S,C>} [req]
 * @param {Responder} [res]
 * @param {PostBack} [postBack]
 * @returns {RoutingInstruction|Promise<RoutingInstruction>}
 */

/**
 * @template {object} [S=object]
 * @template {BaseConfiguration} [C=object]
 * @callback Reduce processing function
 * @param {Request<S,C>} [req]
 * @param {Responder} [res]
 * @param {PostBack} [postBack]
 * @param {string} [path]
 * @returns {Promise<RoutingInstruction>}
 */

/**
 * @template {object} [S=object]
 * @template {BaseConfiguration} [C=object]
 * @typedef {object} IRouter
 * @prop {Reduce<S,C>} reduce
 */

/**
 * @typedef {object} BotPath
 * @prop {string} path
 */

/**
 * @typedef {string|RegExp|BotPath} RouteExp
 */

/**
 *
 * @template {object} [S=object]
 * @template {BaseConfiguration} [C=object]
 * @typedef {Resolver<S,C>|RouteExp|IRouter} Middleware flow control statement or function
 */

/**
 * @typedef {import('./Responder').Persona} Persona
 */

/**
 * @typedef {Object<string|'_default',PersonConfiguration>} PersonConfiguration
 */

/**
 * @typedef {object} BaseConfiguration
 * @prop {PersonConfiguration} [persona]
 * @prop {string} [gaMeasurementId]
 * @prop {string} [gaApiSecret]
 */

/**
 * Cascading router
 *
 * @template {object} [S=object]
 * @template {BaseConfiguration} [C=object]
 * @class Router
 * @extends {ReducerWrapper}
 */
class Router extends ReducerWrapper {

    /**
     * @param {C|Promise<C>} [configuration]
     */
    constructor (configuration = null) {
        super();

        /** @type {C|Promise<C>} */
        // @ts-ignore
        this._configuration = configuration instanceof Promise
            ? configuration.then((c) => {
                this._configuration = c;
                return c;
            })
            : configuration || {};

        this._routes = [];

        this.globalIntents = new Map();
    }

    /**
     * @returns {C|null}
     */
    get configuration () {
        return this._configuration instanceof Promise
            ? null
            : this._configuration;
    }

    /**
     *
     * @returns {C|Promise<C>}
     */
    getConfiguration () {
        return this._configuration;
    }

    /**
     *
     * @param {Partial<C>} c
     * @returns {Promise<C>}
     */
    async updateConfiguration (c) {
        const cfg = this._configuration instanceof Promise
            ? await this._configuration
            : this._configuration;
        return Object.assign(cfg, c);
    }

    _normalizePath (path) {
        let normalizedPath;

        if (!path.match(/^\//)) {
            normalizedPath = `/${path}`;
        } else {
            normalizedPath = path;
        }

        return normalizedPath.replace(/\/$/, '');
    }

    /* eslint jsdoc/check-param-names: 0 */
    /**
     * Appends middleware, action handler or another router
     *
     * @param {...Middleware<S,C>|Middleware<S,C>[]} resolvers - list of resolvers
     * @returns {this}
     *
     * @example
     * // middleware
     * router.use((req, res, postBack) => Router.CONTINUE);
     *
     * // route with matching regexp
     * router.use(/help/, (req, res) => {
     *     res.text('Hello!');
     * });
     *
     * // route with matching function (the function is considered as matcher
     * // in case of the function accepts zero or one argument)
     * router.use('action', req => req.text() === 'a', (req, res) => {
     *     res.text('Hello!');
     * });
     *
     * // use multiple reducers
     * router.use('/path', reducer1, reducer2);
     *
     * @memberOf Router
     */
    use (...resolvers) {

        const pathContext = defaultPathContext();

        const reducers = this.createReducersArray(resolvers, pathContext);

        this._routes.push({
            reducers,
            path: pathContext.path
        });

        reducers.forEach(({ globalIntents }) => {
            for (const gi of globalIntents.values()) {
                const {
                    id, matcher, action: intentPath, local, title,
                    entitiesSetState = {}, usedEntities, meta = {}
                } = gi;
                const action = intentPath === '/*'
                    ? pathContext.path
                    : `${pathContext.path}${intentPath}`.replace(/^\/\*/, '');

                this.globalIntents.set(id, {
                    id,
                    matcher,
                    usedEntities,
                    entitiesSetState,
                    action,
                    localPath: pathContext.path,
                    local,
                    title,
                    meta: { ...pathContext.globalIntentsMeta, ...meta }
                });
            }
        });

        return this;
    }
    /* eslint jsdoc/check-param-names: 1 */

    // protected method for bot
    createReducersArray (resolvers, pathContext = defaultPathContext()) {
        return resolvers.map((reducer) => {

            // or condition
            if (Array.isArray(reducer)) {
                let isAnyReducer = false;
                const globalIntents = new Map();

                const reducersArray = reducer.map((re) => {
                    const {
                        resolverPath,
                        reduce,
                        isReducer,
                        globalIntents: gis,
                        globalIntentsMeta,
                        configuration
                    } = this._createReducer(
                        re,
                        pathContext.path
                    );
                    gis.forEach((g) => globalIntents.set(g.id, g));
                    Object.assign(pathContext, { path: resolverPath });
                    Object.assign(pathContext.globalIntentsMeta, globalIntentsMeta);
                    isAnyReducer = isAnyReducer || isReducer;
                    return { reduce, isReducer, configuration };
                });

                return {
                    reducers: reducersArray,
                    isReducer: isAnyReducer,
                    isOr: true,
                    globalIntents
                };
            }

            const {
                resolverPath, reduce, isReducer, globalIntents, globalIntentsMeta, configuration
            } = this._createReducer(
                reducer,
                pathContext.path
            );

            Object.assign(pathContext, { path: resolverPath });
            Object.assign(pathContext.globalIntentsMeta, globalIntentsMeta);

            return {
                reduce, isReducer, globalIntents, configuration
            };
        });
    }

    _createReducer (reducer, thePath) {
        let resolverPath = thePath;
        let reduce = reducer;
        let isReducer = false;
        const {
            globalIntents = new Map(),
            path,
            globalIntentsMeta = {},
            configuration = null
        } = reducer;

        if (typeof reducer === 'string' || path) {
            const usePath = path || reducer;
            resolverPath = this._normalizePath(usePath);
            resolverPath = resolverPath.replace(/\*/g, '(.*)');
            const pathMatch = pathToRegexp(resolverPath, [], { end: resolverPath === '' });

            reduce = (req, res, relativePostBack, pathContext, action) => {
                const actionMatches = action && (resolverPath === '/*' || pathMatch.exec(action));

                if (actionMatches) {
                    return Router.CONTINUE;
                }

                return Router.BREAK;
            };

            isReducer = true;

        } else if (reducer instanceof RegExp) {
            reduce = (req) => (req.isText() && req.text(true).match(reducer)
                ? Router.CONTINUE
                : Router.BREAK);

        } else if (typeof reduce === 'object' && reduce.reduce) {
            isReducer = true;

            // @ts-ignore
            reduce.on('action', (...args) => this.emit('action', ...args));
            // @ts-ignore
            reduce.on('_action', (...args) => this.emit('_action', ...args));

            const reduceFn = reduce.reduce.bind(reduce);
            reduce = (...args) => reduceFn(...args);
        } else {
            reduce = reducer;
        }

        return {
            resolverPath, isReducer, reduce, globalIntents, globalIntentsMeta, configuration
        };
    }

    _relativePostBack (origPostBack, path) {
        return function postBack (action, data = {}, dontWaitTillEndOfLoop = false) {
            if (typeof action === 'object') {
                return origPostBack(action, data, dontWaitTillEndOfLoop);
            }

            return origPostBack(makeAbsolute(action, path), data, dontWaitTillEndOfLoop);
        };
    }

    async reduce (req, res, postBack = () => {}, path = '/') {
        const action = this._action(req, path);
        const relativePostBack = this._relativePostBack(postBack, path);
        let iterationResult;

        for (const route of this._routes) {
            iterationResult = await this._reduceTheArray(
                route,
                route,
                action,
                req,
                res,
                relativePostBack,
                path
            );
            if (typeof iterationResult === 'string' || Array.isArray(iterationResult)) {
                return iterationResult;
            }
            if (iterationResult !== Router.CONTINUE) {
                return Router.END;
            }
        }

        return Router.CONTINUE;
    }

    // used as protected method
    async processReducers (reducers, req, res, postBack, action, doNotTrack = false) {
        const routeToReduce = {
            reducers,
            path: res.routePath
        };

        return this._reduceTheArray(
            routeToReduce,
            routeToReduce,
            action,
            req,
            res,
            postBack,
            res.path,
            doNotTrack
        );
    }

    async _reduceTheArray (route, reducerContainer, action, req, res, relativePostBack, path = '/', doNotTrack = false) {
        let breakOn = Router.BREAK;
        let continueOn = Router.CONTINUE;

        if (reducerContainer.isOr) {
            breakOn = Router.CONTINUE;
            continueOn = Router.BREAK;
        }

        for (const reducer of reducerContainer.reducers) {

            let pathContext = `${path === '/' ? '' : path}${route.path.replace(/\/\*/, '')}`;
            res.setPath(path, route.path);
            if (reducer.configuration) {
                req.configuration = reducer.configuration;
            }

            let result;

            if (reducer.reducers) {
                result = await this._reduceTheArray(
                    route,
                    reducer,
                    action,
                    req,
                    res,
                    relativePostBack,
                    path,
                    true
                );
            } else {
                result = reducer.reduce(req, res, relativePostBack, pathContext, action, this);

                if (result instanceof Promise) {
                    result = await result;
                }
            }

            if (!reducer.isReducer
                    && [Router.BREAK, Router.CONTINUE].indexOf(result) === -1) {
                pathContext = `${path === '/' ? '' : path}${route.path}`;

                // store the last visited path
                if (result !== Router.ENDED_PREVIOUSLY) {
                    res.setState({ _lastVisitedPath: path === '/' ? null : path });
                    // console.log({ action: req.action(), pathContext, path });
                    this._emitAction(req, res, pathContext, doNotTrack);
                }
            }

            if (result === breakOn) {
                if (reducerContainer.isOr) {
                    return Router.CONTINUE;
                }
                break; // skip the rest path reducers, continue with next route

            } else if (result !== continueOn) {

                return Router.END;
            }
        }

        return continueOn;
    }

    _action (req, path) {
        let action = req.action();

        let pathFallback = '/';
        if (!action && req.isText() && req.state._lastVisitedPath) {
            action = req.state._lastVisitedPath;
            pathFallback = null;
        }

        // try to normalize the action
        if (action) {
            if (!action.match(/^\//)) {
                action = `/${action}`;
            }
            if (action.indexOf(path) === 0) {
                // return relative path with slash at the begining
                if (path !== '/') {
                    return action.substr(path.length) || pathFallback;
                }

                return action;
            }
        }

        return null;
    }
}

/**
 * Return `Router.CONTINUE` when action matches your route
 * Its same as returning `true`
 *
 * @property {boolean}
 */
Router.CONTINUE = true;

/**
 * Return `Router.BREAK` when action does not match your route
 * Its same as returning `false`
 *
 * @property {boolean}
 */
Router.BREAK = false;

/**
 * Returning `Router.END` constant stops dispatching request
 * Its same as returning `undefined`, but not in plugin. Returning undefined in plugin
 *
 * @property {null}
 */
Router.END = null;

/**
 * Let the plugin wrapper to decide, when end or not
 * Its same as returning `undefined`
 *
 * @property {undefined}
 */
Router.NEXT = undefined;

Router.ENDED_PREVIOUSLY = -1; // system status

module.exports = Router;
