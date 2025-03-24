/*
 * @author David Menger
 */
'use strict';

const { decompress } = require('compress-json');
const { brotliCompress, brotliDecompress } = require('zlib');
const { promisify } = require('util');
const { default: fetch } = require('node-fetch');
const assert = require('assert');
const path = require('path');
const Router = require('./Router');
const Plugins = require('./Plugins');
const Ai = require('./Ai');
const expected = require('./resolvers/expected');
const bounce = require('./resolvers/bounce');
const { cachedTranslatedCompilator } = require('./resolvers/utils');
const defaultResourceMap = require('./defaultResourceMap');
const { shouldExecuteResolver } = require('./resolvers/resolverTags');

const MESSAGE_RESOLVER_NAME = 'botbuild.message';
const PLUGIN_RESOLVER_NAME = 'botbuild.customCode';

/** @typedef {import('./Router').BaseConfiguration} BaseConfiguration */
/**
 * @typedef {object} BuildInfo
 * @prop {boolean} [expectedToAddResolver]
 * @prop {boolean} [attachedRouter]
 * @prop {boolean} [notLastMessage]
 */

/**
 *
 * @template {object} [S=object]
 * @template {BaseConfiguration} [C=object]
 * @typedef {import('./Router').Middleware<S,C>} Middleware
 */

/**
 * @typedef {object} Resolver
 * @prop {string|number} [id] - only for text messages with random characters
 * @prop {string} type
 * @prop {object} params
 * @prop {string} [params.staticBlockId]
 * @prop {object} [params.items]
 * @prop {string} [tag]
 */

/** @typedef {import('./resolvers/bounce').BounceAllow} BounceAllow */
/** @typedef {import('./resolvers/bounce').BounceReturn} BounceReturn */

/**
 * @typedef {object} Route
 * @prop {number} id
 * @prop {string|null} path
 * @prop {string|null} [skill]
 * @prop {Resolver[]} resolvers
 * @prop {boolean} [isFallback]
 * @prop {string[]} [aiTags]
 * @prop {boolean} [isResponder]
 * @prop {number} [respondsToRouteId]
 * @prop {string|any[]} [aiTitle]
 * @prop {boolean} [aiGlobal]
 * @prop {BounceAllow} [bounceAllowedTo]
 * @prop {BounceReturn} [bounceReturn]
 * @prop {boolean} [isEntryPoint]
 */

/**
 * @typedef {object} RouteTransformation
 * @prop {string} [expectedPath]
 *
 * @typedef {RouteTransformation & Route} TransformedRoute
 */

/**
 * @typedef {Map<string|number,string>} LinksMap
 */

/**
 * @typedef {Map<string|number, Block>} BlockMap
 */

/** @type {TransformedRoute} */
const DUMMY_ROUTE = { id: 0, path: null, resolvers: [] };

/**
 * @typedef {object} Block
 * @prop {string} staticBlockId
 * @prop {Route[]} routes
 * @prop {boolean} [isRoot]
 * @prop {boolean} [disabled]
 * @prop {string} [blockName]
 * @prop {string} [blockType]
 */

/**
 * @typedef {object} BotConfig
 * @prop {string} botId - the ID of bot
 * @prop {string} snapshot - snapshot stage of bot
 * @prop {string|Promise<string>} token - authorization token for bot
 * @prop {string} [url] - specify alternative configuration resource
 */

/**
 * @typedef {object} ConfigStorage
 * @prop {{():Promise}} invalidateConfig
 * @prop {{():Promise<number>}} getConfigTimestamp
 * @prop {{(config:Object):Promise<Object>}} updateConfig
 * @prop {{():Promise<Object>}} getConfig
 */

/**
 * @typedef {object} RouteConfig
 * @prop {string} path
 * @prop {boolean} [enabled]
 */

/**
 * @callback LinkTranslator
 * @param {string} senderId
 * @param {string} textLabel
 * @param {string} urlText
 * @param {boolean} isExtUrl
 * @param {object} state
 * @param {string} pageId
 * @returns {string}
*/

/**
 * @template {BaseConfiguration} [C=object]
 * @typedef {object} BuildRouterContext
 * @prop {LinkTranslator} [linksTranslator] - function, that translates links globally
 * @prop {ConfigStorage} [configStorage] - function, that translates links globally
 * @prop {boolean} [allowForbiddenSnippetWords] - disable security rule
 * @prop {Middleware} [defaultPlugin] - to be able to test configurations without plugins
 * @prop {RouteConfig[]} [routeConfigs] - list of disabled routes
 * @prop {C} [configuration] - context data
 */

/**
 * @typedef {object} BotContextExtention
 * @prop {BlockMap} [nestedBlocksByStaticId]
 * @prop {LinksMap} [linksMap]
 * @prop {boolean} [isLastIndex]
 * @prop {boolean} [isLastMessage]
 * @prop {BuildRouter} [router]
 * @prop {string} [path]
 * @prop {boolean} [isFallback]
 * @prop {string} [expectedPath]
 * @prop {boolean} [isResponder]
 * @prop {string|number} [routeId]
 * @prop {string} [blockName]
 * @prop {string} [blockType]
 * @prop {boolean} [isRoot]
 * @prop {string} [staticBlockId]
 * @prop {Block[]} [blocks]
 * @prop {object} [BuildRouter]
 * @prop {string|number} [resolverId] - only for text messages with random characters
 */

/**
 * @template {BaseConfiguration} [C=object]
 * @typedef {BotContextExtention & BuildRouterContext<C>} BotContext
 */

/**
 * Build bot from Wingbot configuration file or snapshot url
 *
 * @template {object} [S=object]
 * @template {BaseConfiguration} [C=object]
 * @class BuildRouter
 * @extends {Router<S,C>}
 */
class BuildRouter extends Router {

    /**
     * Create new router from configuration
     *
     * @constructor
     * @param {BotConfig|Block} block
     * @param {Plugins} plugins - custom code blocks resource
     * @param {BuildRouterContext<C>|Promise<BuildRouterContext<C>>} context - the building context
     * @param {fetch} [fetchFn] - override a request function
     * @example
     *
     * // usage of plugins
     *
     * const { BuildRouter, Plugins } = require('wingbot');
     * const dynamoDb = require('./lib/dynamodb');
     * const config = require('./config');
     *
     * const plugins = new Plugins();
     *
     * plugins.register('exampleBlock', async (req, res, postBack) => {
     *     await res.run('responseBlockName');
     * });
     *
     * const bot = new BuildRouter({
     *     botId: 'b7a71c27-c295-4ab0-b64e-6835b50a0db0',
     *     snapshot: 'master',
     *     token: 'adjsadlkadjj92n9u9'
     * }, plugins);
     *
     * module.exports = bot;
     */
    constructor (block, plugins = new Plugins(), context = {}, fetchFn = fetch) {
        super(
            context instanceof Promise
                ? context.then((c) => c.configuration)
                : context.configuration
        );

        this._validateBlock(block);

        this._plugins = plugins;

        /** @type {BotContext<C>|Promise<BuildRouterContext<C>>} */
        this._context = context;

        /** @type {BotContext<C>} */
        this._resolvedContext = context instanceof Promise
            ? null
            : context;

        /** @type {LinksMap} */
        this._linksMap = new Map();

        this._loadBotUrl = null;

        this._loadBotAuthorization = null;

        this._botLoaded = null;

        this._fetch = fetchFn;

        this._prebuiltRoutesCount = null;

        this._prebuiltGlobalIntents = null;

        this._brotliCompress = promisify(brotliCompress);
        this._brotliDecompress = promisify(brotliDecompress);

        this.resources = defaultResourceMap();

        this._loadBotAuthorization = 'token' in block ? block.token : null;

        /** @type {ConfigStorage|Promise<ConfigStorage>} */
        this._configStorage = context instanceof Promise
            ? context.then((c) => c.configStorage)
            : context.configStorage;

        this._runningReqs = [];

        this._configTs = 0;

        /**
         * Timeout, when the router is not checking for new configuration
         *
         * @type {number}
         */
        this.keepConfigFor = 60000;

        this._snapshot = null;
        this._botId = null;

        if ('routes' in block) {
            this._buildBot(block);
        } else if (typeof block.url === 'string') {
            this._loadBotUrl = block.url;
        } else if (typeof block.botId === 'string') {
            this._snapshot = block.snapshot || 'production';
            this._botId = block.botId;
            this._loadBotUrl = `https://api.wingbot.ai/bots/${this._botId}/snapshots/${this._snapshot}/blocks`;
        }
    }

    get snapshot () {
        return this._snapshot;
    }

    get botId () {
        return this._botId;
    }

    _validateBlock (block, action = 'build') {
        // @ts-ignore
        assert.ok(block && typeof block === 'object', `Bot ${action} failed: expected the block to be an object, ${typeof block} given`);

        // @ts-ignore
        assert.ok(
            block.url || block.botId || block.routes,
            `Bot ${action} failed: "url", "botId" or "routes" in block, none given`
        );
        // @ts-ignore
        assert.ok(
            block.url || block.botId || block.routes,
            `Bot ${action} failed: "url", "botId" or "routes" in block, none given`
        );
        if (block.routes) {
            // @ts-ignore
            assert.ok(Array.isArray(block.routes), `Bot ${action} failed: "routes" in a block should be an array`);
        }
    }

    async preload () {
        if (this._botLoaded === null) {
            this._botLoaded = this._checkForBotUpdate()
                .then(() => {
                    this._botLoaded = null;
                })
                .catch((e) => {
                    // be able to try in again later
                    this._botLoaded = null;
                    throw e;
                });
        }

        return this._botLoaded;
    }

    async reduce (...args) {
        await this.preload();

        let runningRequest;
        try {
            const reducePromise = super.reduce(...args);

            runningRequest = reducePromise
                .catch(() => { /* mute fails */ });
            this._runningReqs.push(runningRequest);

            return await reducePromise;
        } finally {
            if (runningRequest) {
                this._runningReqs = this._runningReqs
                    .filter((rr) => rr !== runningRequest);
            }
        }
    }

    async _checkForBotUpdate () {
        if (this._configTs > Date.now() - this.keepConfigFor) {
            // do not update recently updated of fixed configurations
            return;
        }

        /** @type {ConfigStorage} */
        let configStorage;
        let snapshot;
        /** @type {BotContext<C>} */
        let context;

        if (this._context instanceof Promise || this._configStorage instanceof Promise) {
            [
                configStorage,
                snapshot,
                context
            ] = await Promise.all([
                Promise.resolve(this._configStorage),
                this.loadBot(),
                this._context
            ]);

            this._context = context;
            this._resolvedContext = context;
            this._configStorage = configStorage;
        } else {
            configStorage = this._configStorage;
            context = this._context;
        }

        if (!configStorage) {
            // not need to wait for existing requests, there are no existing ones
            try {
                if (!snapshot) {
                    snapshot = await this.loadBot();
                }
                this.buildWithSnapshot(snapshot.blocks);
            } catch (e) {
                if (this._configTs > 0 && !snapshot) {
                    // mute
                    // eslint-disable-next-line no-console
                    console.info('Loading new state failed - recovering', e);
                } else {
                    throw e;
                }
            }

            return;
        }

        try {
            // check for current TS
            const ts = await configStorage.getConfigTimestamp();

            if (ts <= this._configTs && this._configTs !== 0 && ts !== 0) {
                // do not update, when there is no better configuration
                return;
            }

            if (snapshot) {
                snapshot = await this._updateConfig(configStorage, snapshot);
            }

            if (ts !== 0 && !snapshot) {
                // probably someone has updated the configuration
                snapshot = await configStorage.getConfig();
                snapshot = await this._decompressIfCompressed(snapshot);
            }

            if (!snapshot || typeof snapshot !== 'object' || !Array.isArray(snapshot.blocks)) {
                // there is no configuration, load it from server
                snapshot = await this.loadBot();
                snapshot = await this._updateConfig(configStorage, snapshot);
            }

            // wait for running request
            await Promise.all(this._runningReqs);

            this.buildWithSnapshot(snapshot.blocks, snapshot.timestamp, snapshot.lastmod);
        } catch (e) {
            await configStorage.invalidateConfig();
            throw e;
        }
    }

    async _updateConfig (configStorage, snapshot) {
        const buf = await this._brotliCompress(Buffer.from(JSON.stringify(snapshot)));
        const compressed = {
            compression: 'brotli',
            base64url: buf.toString('base64url'),
            timestamp: snapshot.timestamp
        };
        const updated = await configStorage.updateConfig(compressed);
        const decoded = await this._decompressIfCompressed(updated);
        return decoded;
    }

    async _decompressIfCompressed (snapshot) {
        if (!snapshot || snapshot.compression !== 'brotli' || !snapshot.base64url) {
            return snapshot;
        }
        const buf = Buffer.from(snapshot.base64url, 'base64url');
        const data = await this._brotliDecompress(buf);

        const parsed = JSON.parse(data.toString('utf8'));
        return {
            ...parsed,
            timestamp: snapshot.timestamp
        };
    }

    /**
     * Loads conversation configuration
     *
     * @returns {Promise<object>}
     */
    async loadBot () {
        const options = {};

        let auth;
        if (this._loadBotAuthorization) {
            auth = await Promise.resolve(this._loadBotAuthorization);
            Object.assign(options, {
                headers: {
                    Authorization: auth,
                    'X-Compressed-Blocks': '1'
                }
            });
        }

        const response = await this._fetch(this._loadBotUrl, options);

        if (response.status === 404) {
            throw new Error(this._botId
                ? `Bot load failed: Snapshot '${this._snapshot}' does not exist or not deployed on botId '${this._botId}'`
                : `Bot load failed: Url ${this._loadBotUrl} does not exist (returned status 404)`);
        }
        if (response.status === 401 && !auth) {
            throw new Error('Bot load failed: 401 - missing authorization token');
        }
        if (response.status === 403 || response.status === 401) {
            const reason = this._botId
                ? `The token probably does not match snapshot '${this._snapshot}' and botId '${this._botId}'`
                : `The call to '${this._loadBotUrl}' was unauthorized`;

            throw new Error(`Bot load failed: ${response.status} - ${reason}`);
        }
        if (response.status >= 400) {
            throw new Error(`Bot load failed: ${response.status} - ${response.statusText} (snapshot '${this._snapshot}', botId '${this._botId})`);
        }

        const snapshot = await response.json();

        if (snapshot && snapshot.compressedBlocks) {
            snapshot.blocks = decompress(snapshot.blocks);
        }

        this._validateBlocks(snapshot && snapshot.blocks, 'load');

        return snapshot;
    }

    _validateBlocks (blocks, action = 'build') {
        if (!Array.isArray(blocks)) {
            throw new Error(`Bot ${action} failed: expected array of "blocks" in the body`);
        }
        blocks.forEach((b) => this._validateBlock(b, action));
    }

    buildWithSnapshot (blocks, setConfigTimestamp = Number.MAX_SAFE_INTEGER, lastmod = '-') {
        this._validateBlocks(blocks);

        Object.assign(this._resolvedContext, { blocks });

        const rootBlock = blocks.find((block) => block.isRoot);

        if (!rootBlock) {
            throw new Error('Root block (block.isRoot = true) not found - probably invalid bot snapshot used');
        }

        this._buildBot(rootBlock, setConfigTimestamp, lastmod);
    }

    resetRouter () {
        if (this._prebuiltRoutesCount !== null) {
            this._routes = this._routes.slice(0, this._prebuiltRoutesCount - 1);
            this._configTs = 0;
        }
        if (this._prebuiltGlobalIntents !== null) {
            this.globalIntents.clear();
            this._prebuiltGlobalIntents.forEach(([k, v]) => this.globalIntents.set(k, v));
        }
    }

    /**
     *
     * @param {Block} block
     * @param {number} setConfigTimestamp
     * @param {string} lastmod
     */
    _buildBot (block, setConfigTimestamp = Number.MAX_SAFE_INTEGER, lastmod = '-') {
        try {
            if (setConfigTimestamp !== Number.MAX_SAFE_INTEGER) {
                // eslint-disable-next-line no-console
                console.log(`[wingbot.ai BuildRouter] reloaded snapshot from ${new Date(setConfigTimestamp).toUTCString()} (${lastmod})`);
            }
        } catch (e) {
            // noop
        }
        if (this._prebuiltGlobalIntents === null) {
            this._prebuiltGlobalIntents = Array.from(this.globalIntents.entries());
        } else {
            this.globalIntents.clear();
            this._prebuiltGlobalIntents.forEach(([k, v]) => this.globalIntents.set(k, v));
        }

        if (this._prebuiltRoutesCount === null) {
            this._prebuiltRoutesCount = this._routes.length;
        } else {
            this._routes = this._routes.slice(0, this._prebuiltRoutesCount);
        }

        const {
            blockName, blockType, isRoot, staticBlockId
        } = block;

        this._resolvedContext = {
            ...this._resolvedContext, blockName, blockType, isRoot, staticBlockId, BuildRouter
        };

        const [linksMap, nestedBlocksByStaticId] = this._createLinksMap(block);
        // @ts-ignore
        this._linksMap = linksMap;

        // @ts-ignore
        this._buildRoutes(block.routes, nestedBlocksByStaticId);

        this._configTs = setConfigTimestamp;

        // this event should not be propagated to the parent
        this.emit('rebuild');
    }

    /**
     *
     * returns {[LinksMap, BlockMap]}
     *
     * @param {Block} block
     */
    _createLinksMap (block) {
        const { linksMap: prevLinksMap, blocks = [] } = this._resolvedContext;

        /** @type {LinksMap} */
        const linksMap = new Map();

        if (prevLinksMap) {
            for (const [from, to] of prevLinksMap.entries()) {
                linksMap.set(from, `../${to}`); //  this._joinPaths('..', to)
            }
        }

        const expectedFromResponders = new Set();

        const blocksById = new Map();

        block.routes
            .forEach((route) => {
                if (!route.isResponder) {
                    linksMap.set(route.id, route.path);
                }
                blocksById.set(route.id, route);
            });

        let { nestedBlocksByStaticId } = this._resolvedContext;
        if (!nestedBlocksByStaticId) {
            nestedBlocksByStaticId = new Map();

            blocks.forEach((b) => {
                if (b.staticBlockId && !b.disabled) {
                    nestedBlocksByStaticId.set(b.staticBlockId, b);
                }
            });

            Object.assign(this._resolvedContext, { nestedBlocksByStaticId });
        }

        block.routes.forEach((route) => {
            const enabledNestedBlock = nestedBlocksByStaticId.get(this._getIncludedBlockId(route));
            if (enabledNestedBlock) {
                const routeConfig = this._getRouteConfig(route);
                if (this._enabledByRouteConfig(routeConfig)) {
                    this._findEntryPointsInResolver(linksMap, enabledNestedBlock, route);
                }
            }

            if (route.isResponder) {
                // create the pseudopath ant set to set to corresponding route
                const referredRoutePath = linksMap.get(route.respondsToRouteId);

                if (referredRoutePath) {
                    const expectedPath = `${referredRoutePath}_responder`
                        .replace(/^\//, '');

                    Object.assign(route, { path: expectedPath });

                    if (!expectedFromResponders.has(route.respondsToRouteId)) {
                        expectedFromResponders.add(route.respondsToRouteId);

                        const referredRoute = blocksById.get(route.respondsToRouteId);
                        Object.assign(referredRoute, { expectedPath });
                    }
                }
            }
        });

        return [linksMap, nestedBlocksByStaticId];
    }

    /**
     *
     * @param {RouteConfig} routeConfig
     */
    _enabledByRouteConfig (routeConfig) {
        return !routeConfig || routeConfig.enabled !== false;
    }

    _joinPaths (...args) {
        return (path.posix || path).join(...args);
    }

    _normalizeConfigPath (routePath, ctxPath = null) {
        const joined = ctxPath
            ? this._joinPaths(ctxPath, routePath)
            : routePath;

        return joined
            .replace(/^\/?|(_responder)?\/?$/g, '/')
            .replace(/\/\/+$/, '/');
    }

    /**
     *
     * @param {Route} route
     * @returns {string|null}
     */
    _getIncludedBlockId (route) {
        const includeResolver = route.resolvers.find((r) => r.type === 'botbuild.include');

        return includeResolver
            ? includeResolver.params.staticBlockId
            : null;
    }

    /**
     *
     * @param {TransformedRoute} route
     * @returns {RouteConfig}
     */
    _getRouteConfig (route) {
        const { path: ctxPath, routeConfigs } = this._resolvedContext;
        if (!routeConfigs || !route.path || route.isFallback) {
            return null;
        }

        let rPath;
        if (!route.isResponder) {
            rPath = route.path;
        } else if (route.expectedPath) {
            rPath = route.expectedPath;
        } else if (this._linksMap.has(route.respondsToRouteId)) {
            rPath = this._linksMap.get(route.respondsToRouteId);
        } else {
            throw new Error('Illegal state');
        }

        const routePath = this._normalizeConfigPath(rPath, ctxPath);

        return routeConfigs.find((config) => {
            const configPath = this._normalizeConfigPath(config.path);

            return configPath === routePath;
        });
    }

    /**
     *
     * @param {LinksMap} linksMap
     * @param {Block} includedBlock
     * @param {TransformedRoute} route
     * @returns {void}
     */
    _findEntryPointsInResolver (linksMap, includedBlock, route) {
        let basePath = `${route.path}/`;

        if (route.isFallback) {
            basePath = '';
        }

        includedBlock.routes.forEach((blockRoute) => {
            if (!blockRoute.isEntryPoint) {
                return;
            }

            linksMap.set(blockRoute.id, `${basePath}${blockRoute.path}`);
        });
    }

    /**
     *
     * @param {TransformedRoute} route
     * @param {boolean} nextRouteIsSameResponder
     * @param {string} includedBlockId
     * @returns {Middleware<S,C>[]}
     */
    _buildRouteHead (route, nextRouteIsSameResponder, includedBlockId) {
        const resolvers = [];

        if (!route.isFallback) {
            let aiResolver = null;

            if (route.aiTags && route.aiTags.length) {
                let aiTitle = null;

                if (route.aiTitle) {
                    aiTitle = cachedTranslatedCompilator(route.aiTitle);
                }

                if (route.aiGlobal) {
                    aiResolver = Ai.ai.global(route.path, route.aiTags, aiTitle);
                } else if (route.isResponder) {
                    aiResolver = Ai.ai.match(route.aiTags);
                } else {
                    aiResolver = Ai.ai.local(route.path, route.aiTags, aiTitle);
                }
            }

            if (aiResolver && route.isResponder) {
                resolvers.push(route.path, aiResolver);
            } else if (aiResolver) {
                resolvers.push(aiResolver);
            } else if (route.path) {
                resolvers.push(route.path);
            }

            if (route.isResponder) {
                const referredRoutePath = this._linksMap.get(route.respondsToRouteId);
                const bounceResolver = bounce(route, nextRouteIsSameResponder, referredRoutePath);
                if (bounceResolver) {
                    resolvers.push(bounceResolver);
                }
            } else if (!includedBlockId && route.skill) {
                resolvers.push((req, res) => {
                    res.trackAsSkill(route.skill);
                    return Router.CONTINUE;
                });
            }
        }

        return resolvers;
    }

    /**
     *
     * @param {TransformedRoute[]} routes
     * @param {BlockMap} nestedBlocksByStaticId
     */
    _buildRoutes (routes, nestedBlocksByStaticId) {
        routes.forEach((route, i) => {
            const routeConfig = this._getRouteConfig(route);

            if (routeConfig && !routeConfig.enabled) {
                return;
            }

            const includedBlockId = this._getIncludedBlockId(route);
            const nestedBlock = nestedBlocksByStaticId.get(includedBlockId);

            if (includedBlockId && (!nestedBlock || !this._enabledByRouteConfig(routeConfig))) {
                return;
            }

            const nextRoute = routes.length > (i + 1)
                ? routes[i + 1]
                : null;
            let nextRouteIsSameResponder = false;

            if (nextRoute && route.isResponder && nextRoute.isResponder) {
                nextRouteIsSameResponder = nextRoute.respondsToRouteId === route.respondsToRouteId;
            }

            const buildInfo = {
                expectedToAddResolver: !!route.expectedPath,
                attachedRouter: false
            };

            const resolvers = [
                ...this._buildRouteHead(route, nextRouteIsSameResponder, includedBlockId),
                ...this.buildResolvers(route.resolvers, route, buildInfo)
            ];

            if (route.expectedPath) {
                // attach expected before last message, if there is
                resolvers.push(expected({
                    path: route.expectedPath,
                    attachedRouter: buildInfo.attachedRouter
                }, {
                    isLastIndex: true
                }));
            }

            this.use(...resolvers);
        });
    }

    /**
     *
     * @param {Resolver[]} resolvers
     * @returns {number}
     */
    _lastMessageIndex (resolvers) {
        for (let i = resolvers.length - 1; i >= 0; i--) {
            const { type, params = {} } = resolvers[i];
            if (MESSAGE_RESOLVER_NAME === type
                || (type === PLUGIN_RESOLVER_NAME
                    && params && params.items && Object.keys(params.items).length)) {
                return i;
            }
        }
        return -1;
    }

    /**
     *
     * @param {Resolver[]} resolvers
     * @param {TransformedRoute} [route]
     * @param {BuildInfo} [buildInfo]
     * @param {BlockMap} [nestedBlocksByStaticId=null]
     * @returns {Middleware<S,C>[]}
     */
    buildResolvers (resolvers, route = DUMMY_ROUTE, buildInfo = {}, nestedBlocksByStaticId = null) {
        const {
            path: ctxPath, isFallback, isResponder, expectedPath, id
        } = route;

        const lastMessageIndex = this._lastMessageIndex(resolvers);
        const lastIndex = resolvers.length - 1;

        /** @type {C} */
        const configuration = this._configuration instanceof Promise
            ? null
            : this._configuration;

        return resolvers.map((resolver, i) => {

            const context = {
                ...this._resolvedContext,
                isLastIndex: lastIndex === i && !buildInfo.expectedToAddResolver,
                isLastMessage: lastMessageIndex === i && !buildInfo.notLastMessage,
                router: this,
                linksMap: this._linksMap,
                path: ctxPath,
                isFallback,
                isResponder,
                expectedPath,
                routeId: id,
                configuration,
                resolverId: resolver.id,
                nestedBlocksByStaticId
            };

            const resFn = this._resolverFactory(resolver, context, buildInfo);

            // @ts-ignore
            if (typeof resFn.configuration === 'undefined') {
                // @ts-ignore
                resFn.configuration = configuration;
            }
            return resFn;
        });
    }

    /**
     *
     * @param {Resolver} resolver
     * @param {BotContext<C>} context
     * @param {BuildInfo} buildInfo
     * @returns {Middleware<S,C>}
     */
    _resolverFactory (resolver, context, buildInfo) {
        const { type } = resolver;

        if (!this.resources.has(type)) {
            throw new Error(`Unknown Resolver: ${type} Ensure its registration.`);
        }

        const factoryFn = this.resources.get(type);

        const fn = factoryFn(resolver.params, context, this._plugins);

        if (fn.reduce) {
            Object.assign(buildInfo, { attachedRouter: true });
        }

        if ([
            'botbuild.include',
            'botbuild.path',
            'botbuild.customCode',
            'botbuild.inlineCode',
            'botbuild.plugin',
            'botbuild.postback'
        ].includes(type)) {
            return fn;
        }

        const retFn = (req, ...rest) => {
            if (!shouldExecuteResolver(req, resolver.tag, context.isFallback)) {
                return context.isLastIndex ? Router.END : Router.CONTINUE;
            }
            return typeof fn === 'function'
                ? fn(req, ...rest)
                : fn.reduce(req, ...rest);
        };

        if (typeof fn.globalIntentsMeta === 'object') {
            retFn.globalIntentsMeta = fn.globalIntentsMeta;
        }

        if (fn.globalIntents) {
            retFn.globalIntents = fn.globalIntents;
        }

        if (fn.path) {
            retFn.path = fn.path;
        }

        if (resolver.tag) {
            if (!retFn.globalIntentsMeta) {
                retFn.globalIntentsMeta = {};
            }
            Object.assign(retFn.globalIntentsMeta, { resolverTag: resolver.tag });
        }

        return retFn;
    }

}

/**
 * @template {BaseConfiguration} [C=object]
 * @param {Block[]} blocks - blocks list
 * @param {Plugins} [plugins]
 * @param {BotContext<C>} [context]
 */
BuildRouter.fromData = function fromData (blocks, plugins = new Plugins(), context = {}) {

    // @ts-ignore
    assert.ok(Array.isArray(blocks), 'Bot build failed: "blocks" should be an array');
    // @ts-ignore
    assert.ok(blocks.every((b) => b && typeof b === 'object'), 'Bot build failed: "blocks" should be an array of objects');

    const rootBlock = blocks.find((block) => block.isRoot);

    // @ts-ignore
    assert.ok(rootBlock, 'Bot build failed: there is no block with "block.isRoot=true" property');

    return new BuildRouter(rootBlock, plugins, ({ blocks, ...context }));
};

module.exports = BuildRouter;
