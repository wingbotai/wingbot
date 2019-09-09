/*
 * @author David Menger
 */
'use strict';

const requestNative = require('request-promise-native');
const Router = require('./Router');
const Ai = require('./Ai');
const expected = require('./resolvers/expected');
const defaultResourceMap = require('./defaultResourceMap');

/**
 * @typedef {Object} ConfigStorage
 * @prop {{():Promise}} invalidateConfig
 * @prop {{():Promise<number>}} getConfigTimestamp
 * @prop {{(config:Object):Promise<Object>}} updateConfig
 * @prop {{():Promise<Object>}} getConfig
 */

/**
 * Build bot from Wingbot configuration file or snapshot url
 *
 * @class BuildRouter
 */
class BuildRouter extends Router {

    /**
     * Create new router from configuration
     *
     * @constructor
     * @param {Object} block
     * @param {string} [block.botId] - the ID of bot
     * @param {string} [block.snapshot] - snapshot stage of bot
     * @param {string|Promise<string>} [block.token] - authorization token for bot
     * @param {Object} [block.routes] - list of routes for direct bot build
     * @param {string} [block.url] - specify alternative configuration resource
     * @param {Plugins} plugins - custom code blocks resource
     * @param {Object} context - the building context
     * @param {Object} [context.linksTranslator] - function, that translates links globally
     * @param {ConfigStorage} [context.configStorage] - function, that translates links globally
     * @param {boolean} [context.allowForbiddenSnippetWords] - disable security rule
     * @param {Function} [request] - the building context
     * @example
     *
     * // usage under serverless environment
     *
     * const { Settings, BuildRouter, Blocks } = require('wingbot');
     * const { createHandler, createProcessor } = require(''wingbot/serverlessAWS');
     * const dynamoDb = require('./lib/dynamodb');
     * const config = require('./config');
     *
     * const blocks = new Blocks();
     *
     * blocks.code('exampleBlock', async (req, res, postBack, context, params) => {
     *     await res.run('responseBlockName');
     * });
     *
     * const bot = new BuildRouter({
     *     botId: 'b7a71c27-c295-4ab0-b64e-6835b50a0db0',
     *     snapshot: 'master',
     *     token: 'adjsadlkadjj92n9u9'
     * }, blocks);
     *
     * const processor = createProcessor(bot, {
     *     appUrl: config.pageUrl,
     *     pageToken: config.facebook.pageToken,
     *     appSecret: config.facebook.appSecret,
     *     autoTyping: true,
     *     dynamo: {
     *         db: dynamoDb,
     *         tablePrefix: `${config.prefix}-`
     *     }
     * });
     *
     * const settings = new Settings(config.facebook.pageToken, log);
     *
     * if (config.isProduction) {
     *     settings.getStartedButton('/start');
     *     settings.whitelistDomain(config.pageUrl);
     * }
     *
     * module.exports.handleRequest = createHandler(processor, config.facebook.botToken);
     */
    constructor (block, plugins, context = {}, request = requestNative) {
        super();

        if (!block || typeof block !== 'object') {
            throw new Error('Params should be an object');
        }

        this._plugins = plugins;

        this._context = context;

        this._linksMap = new Map();

        this._loadBotUrl = null;

        this._loadBotAuthorization = null;

        this._botLoaded = null;

        this._request = request;

        this._prebuiltRoutesCount = null;

        this.resources = defaultResourceMap();

        this._loadBotAuthorization = block.token || null;

        this._configStorage = context.configStorage;

        this._runningReqs = [];

        this._configTs = 0;

        /**
         * Timeout, when the router is not checking for new configuration
         *
         * @prop {number}
         */
        this.keepConfigFor = 10000;

        if (typeof block.routes === 'object') {
            this._buildBot(block);
        } else if (typeof block.url === 'string') {
            this._loadBotUrl = block.url;
        } else if (typeof block.botId === 'string') {
            const snapshot = block.snapshot || 'production';
            this._loadBotUrl = `https://api.wingbot.ai/bots/${block.botId}/snapshots/${snapshot}`;
        } else {
            throw new Error('Not implemented yet');
        }
    }

    async reduce (...args) {
        if (this._botLoaded === null) {
            this._botLoaded = this._checkForBotUpdate()
                .then(() => {
                    this._botLoaded = null;
                });
        }

        await this._botLoaded;

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
                    .filter(rr => rr !== runningRequest);
            }
        }
    }

    async _checkForBotUpdate () {
        if (this._configTs > Date.now() - this.keepConfigFor) {
            // do not update recently updated of fixed configurations
            return;
        }

        if (!this._configStorage) {
            // not need to wait for existing requests, there are no existing ones
            const snapshot = await this._loadBot();
            this.buildWithSnapshot(snapshot.blocks);
            return;
        }

        // check for current TS
        const ts = await this._configStorage.getConfigTimestamp();

        if (ts <= this._configTs && this._configTs !== 0 && ts !== 0) {
            // do not update, when there is no better configuration
            return;
        }

        let snapshot;

        if (ts === 0) {
            // there is no configuration, load it from server
            snapshot = await this._loadBot();
            snapshot = await this._configStorage.updateConfig(snapshot);
        } else {
            // probably someone has updated the configuration
            snapshot = await this._configStorage.getConfig();
        }

        // wait for running request
        await Promise.all(this._runningReqs);

        this.buildWithSnapshot(snapshot.blocks, snapshot.timestamp);
    }

    async _loadBot () {
        const req = {
            url: this._loadBotUrl,
            json: true
        };

        if (this._loadBotAuthorization) {
            const auth = await Promise.resolve(this._loadBotAuthorization);
            req.headers = {
                Authorization: auth
            };
        }

        const snapshot = await this._request(req);

        if (!snapshot || !Array.isArray(snapshot.blocks)) {
            throw new Error('Bad BOT definition API response');
        }

        return snapshot;
    }

    buildWithSnapshot (blocks, setConfigTimestamp = Number.MAX_SAFE_INTEGER) {
        Object.assign(this._context, { blocks });

        const rootBlock = blocks.find(block => block.isRoot);

        this._buildBot(rootBlock, setConfigTimestamp);
    }

    resetRouter () {
        if (this._prebuiltRoutesCount !== null) {
            this._routes = this._routes.slice(0, this._prebuiltRoutesCount - 1);
            this._configTs = 0;
        }
    }

    _buildBot (block, setConfigTimestamp = Number.MAX_SAFE_INTEGER) {
        if (this._prebuiltRoutesCount === null) {
            this._prebuiltRoutesCount = this._routes.length;
        } else {
            this._routes = this._routes.slice(0, this._prebuiltRoutesCount);
        }

        const {
            blockName, blockType, isRoot, staticBlockId
        } = block;

        this._context = Object.assign({}, this._context, {
            blockName, blockType, isRoot, staticBlockId, BuildRouter
        });

        this._linksMap = this._createLinksMap(block);

        this._setExpectedFromResponderRoutes(block.routes);

        this._buildRoutes(block.routes);

        this._configTs = setConfigTimestamp;

        // this event should not be propagated to the parent
        this.emit('rebuild');
    }

    _setExpectedFromResponderRoutes (routes) {
        const set = new Set();

        routes.forEach((route) => {
            if (!route.isResponder) {
                return;
            }

            // create the pseudopath ant set to set to corresponding route
            const referredRoutePath = this._linksMap.get(route.respondsToRouteId);

            if (!referredRoutePath) {
                return;
            }

            const path = `${referredRoutePath}_responder`
                .replace(/^\//, '');

            Object.assign(route, { path });

            // set expectedPath to referredRoute

            if (set.has(route.respondsToRouteId)) {
                return;
            }
            set.add(route.respondsToRouteId);

            const referredRoute = routes.find(r => r.id === route.respondsToRouteId);

            Object.assign(referredRoute, { expectedPath: path });
        });
    }

    _findEntryPointsInResolver (linksMap, resolver, route, context) {
        const includedBlock = context.blocks
            .find(b => b.staticBlockId === resolver.params.staticBlockId);

        if (!includedBlock) {
            return;
        }

        let basePath = `${route.path}/`;

        if (route.isFallback) {
            basePath = '';
        }

        includedBlock.routes.forEach((blockRoute) => {
            if (!blockRoute.isEntryPoint || blockRoute.isRoot) {
                return;
            }

            linksMap.set(`${route.id}/${blockRoute.id}`, `${basePath}${blockRoute.path}`);
        });
    }

    _createLinksMap (block) {
        const linksMap = new Map();

        block.routes
            .filter(route => !route.isResponder)
            .forEach(route => linksMap.set(route.id, route.path));

        block.routes.forEach((route) => {
            let resolver;
            for (resolver of route.resolvers) {
                if (resolver.type !== 'botbuild.include') {
                    continue;
                }
                this._findEntryPointsInResolver(linksMap, resolver, route, this._context);
            }
        });

        return linksMap;
    }

    _buildRouteHead (route) {
        const resolvers = [];

        if (!route.isFallback) {
            let aiResolver = null;

            if (route.aiTags && route.aiTags.length) {
                if (route.aiGlobal) {
                    aiResolver = Ai.ai.globalMatch(route.aiTags);
                } else if (route.isResponder) {
                    aiResolver = Ai.ai.match(route.aiTags);
                } else {
                    aiResolver = Ai.ai.localMatch(route.aiTags);
                }
            }

            if (aiResolver && route.isResponder) {
                resolvers.push(route.path, aiResolver);
            } else if (aiResolver) {
                resolvers.push([route.path, aiResolver]);
            } else if (route.path) {
                resolvers.push(route.path);
            }
        }

        if (route.expectedPath) {
            resolvers.push(expected({ path: route.expectedPath }, { isLastIndex: false }));
        }

        return resolvers;
    }

    _buildRoutes (routes) {
        routes.forEach((route) => {
            const register = this.use(...[
                ...this._buildRouteHead(route),
                ...this.buildResolvers(route.resolvers, route)
            ]);
            this._attachExitPoints(register, route.resolvers);
        });
    }

    _attachExitPoints (register, routeResolvers) {
        routeResolvers.forEach((resolver) => {
            if (resolver.type !== 'botbuild.include') {
                return;
            }

            Object.keys(resolver.params.items)
                .forEach((exitName) => {
                    const { resolvers } = resolver.params.items[exitName];
                    register.onExit(exitName, this._buildExitPointResolver(resolvers));
                });
        });
    }

    _buildExitPointResolver (resolvers) {
        const builtResolvers = this.buildResolvers(resolvers);
        const reducers = this.createReducersArray(builtResolvers);
        return (data, req, res, postBack) => {
            const { path } = res;
            const action = req.action();
            return this.processReducers(reducers, req, res, postBack, path, action, true);
        };
    }

    buildResolvers (resolvers, route = {}) {
        const lastIndex = resolvers.length - 1;

        const {
            path, isFallback, isResponder, expectedPath
        } = route;

        return resolvers.map((resolver, i) => {
            const context = Object.assign({}, this._context, {
                isLastIndex: lastIndex === i,
                router: this,
                linksMap: this._linksMap,
                path,
                isFallback,
                isResponder,
                expectedPath
            });

            return this._resolverFactory(resolver, context);
        });
    }

    _resolverFactory (resolver, context) {
        const { type } = resolver;

        if (!this.resources.has(type)) {
            throw new Error(`Unknown Resolver: ${type} Ensure its registration.`);
        }

        const factoryFn = this.resources.get(type);

        return factoryFn(resolver.params, context, this._plugins);
    }

}

/**
 * @param {Object[]} blocks - blocks list
 * @param {Plugins} plugins
 * @param {Object} [context]
 */
BuildRouter.fromData = function fromData (blocks, plugins, context = {}) {

    const rootBlock = blocks.find(block => block.isRoot);

    return new BuildRouter(rootBlock, plugins, Object.assign({ blocks }, context));
};

module.exports = BuildRouter;
