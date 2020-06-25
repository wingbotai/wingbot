/*
 * @author David Menger
 */
'use strict';

const requestNative = require('request-promise-native');
const path = require('path');
const Router = require('./Router');
const Ai = require('./Ai');
const expected = require('./resolvers/expected');
const { cachedTranslatedCompilator, stateData } = require('./resolvers/utils');
const defaultResourceMap = require('./defaultResourceMap');

const MESSAGE_RESOLVER_NAME = 'botbuild.message';

/**
 * @typedef {object} ConfigStorage
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
     * @param {object} block
     * @param {string} [block.botId] - the ID of bot
     * @param {string} [block.snapshot] - snapshot stage of bot
     * @param {string|Promise<string>} [block.token] - authorization token for bot
     * @param {string} [block.url] - specify alternative configuration resource
     * @param {Plugins} plugins - custom code blocks resource
     * @param {object} context - the building context
     * @param {object} [context.linksTranslator] - function, that translates links globally
     * @param {ConfigStorage} [context.configStorage] - function, that translates links globally
     * @param {boolean} [context.allowForbiddenSnippetWords] - disable security rule
     * @param {Function} [request] - the building context
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

        this._prebuiltGlobalIntents = null;

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
        this.keepConfigFor = 60000;

        if (typeof block.routes === 'object') {
            this._buildBot(block);
        } else if (typeof block.url === 'string') {
            this._loadBotUrl = block.url;
        } else if (typeof block.botId === 'string') {
            const snapshot = block.snapshot || 'production';
            this._loadBotUrl = `https://api.wingbot.ai/bots/${block.botId}/snapshots/${snapshot}/blocks`;
        } else {
            throw new Error('Not implemented yet');
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

        if (!this._configStorage) {
            // not need to wait for existing requests, there are no existing ones

            let botLoaded = false;
            try {
                const snapshot = await this.loadBot();
                botLoaded = true;
                this.buildWithSnapshot(snapshot.blocks);
            } catch (e) {
                if (this._configTs > 0 && !botLoaded) {
                    // mute
                    // eslint-disable-next-line no-console
                    console.info('loading new state failed - nothing has ben broken', e);
                } else {
                    throw e;
                }
            }

            return;
        }
        try {
            // check for current TS
            const ts = await this._configStorage.getConfigTimestamp();

            if (ts <= this._configTs && this._configTs !== 0 && ts !== 0) {
                // do not update, when there is no better configuration
                return;
            }

            let snapshot;

            if (ts !== 0) {
                // probably someone has updated the configuration
                snapshot = await this._configStorage.getConfig();
            }

            if (!snapshot || typeof snapshot !== 'object' || !Array.isArray(snapshot.blocks)) {
                // there is no configuration, load it from server
                snapshot = await this.loadBot();
                snapshot = await this._configStorage.updateConfig(snapshot);
            }

            // wait for running request
            await Promise.all(this._runningReqs);

            this.buildWithSnapshot(snapshot.blocks, snapshot.timestamp);
        } catch (e) {
            await this._configStorage.invalidateConfig();
            throw e;
        }
    }

    /**
     * Loads conversation configuration
     *
     * @returns {Promise<object>}
     */
    async loadBot () {
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

        const rootBlock = blocks.find((block) => block.isRoot);

        this._buildBot(rootBlock, setConfigTimestamp);
    }

    resetRouter () {
        if (this._prebuiltRoutesCount !== null) {
            this._routes = this._routes.slice(0, this._prebuiltRoutesCount - 1);
            this._configTs = 0;
        }
        if (this._prebuiltGlobalIntents !== null) {
            this.globalIntents = new Map(this._prebuiltGlobalIntents);
        }
    }

    _buildBot (block, setConfigTimestamp = Number.MAX_SAFE_INTEGER) {
        if (this._prebuiltGlobalIntents === null) {
            this._prebuiltGlobalIntents = Array.from(this.globalIntents.entries());
        } else {
            this.globalIntents = new Map(this._prebuiltGlobalIntents);
        }

        if (this._prebuiltRoutesCount === null) {
            this._prebuiltRoutesCount = this._routes.length;
        } else {
            this._routes = this._routes.slice(0, this._prebuiltRoutesCount);
        }

        const {
            blockName, blockType, isRoot, staticBlockId
        } = block;

        this._context = {
            ...this._context, blockName, blockType, isRoot, staticBlockId, BuildRouter
        };

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

            const expectedPath = `${referredRoutePath}_responder`
                .replace(/^\//, '');

            Object.assign(route, { path: expectedPath });

            // set expectedPath to referredRoute

            if (set.has(route.respondsToRouteId)) {
                return;
            }
            set.add(route.respondsToRouteId);

            const referredRoute = routes.find((r) => r.id === route.respondsToRouteId);

            Object.assign(referredRoute, { expectedPath });
        });
    }

    _createLinksMap (block) {
        const linksMap = new Map();

        block.routes
            .filter((route) => !route.isResponder)
            .forEach((route) => linksMap.set(route.id, route.path));

        const { linksMap: prevLinksMap } = this._context;

        if (prevLinksMap) {
            for (const [from, to] of prevLinksMap.entries()) {
                if (!linksMap.has(from)) {

                    (path.posix || path).join('..', to);

                    linksMap.set(from, (path.posix || path).join('..', to));
                }
            }
        }

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

    _findEntryPointsInResolver (linksMap, resolver, route, context) {
        const includedBlock = context.blocks
            .find((b) => b.staticBlockId === resolver.params.staticBlockId);

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

            linksMap.set(`${blockRoute.id}`, `${basePath}${blockRoute.path}`);
        });
    }

    _buildRouteHead (route) {
        const resolvers = [];

        if (!route.isFallback) {
            let aiResolver = null;

            if (route.aiTags && route.aiTags.length) {
                let { aiTitle = null } = route;

                if (aiTitle) {
                    const aiTitleRenderer = cachedTranslatedCompilator(aiTitle);
                    aiTitle = (req) => {
                        const state = stateData(req);
                        return aiTitleRenderer(state);
                    };
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
        }

        if (route.expectedPath) {
            resolvers.push(expected({ path: route.expectedPath }, { isLastIndex: false }));
        }

        return resolvers;
    }

    _buildRoutes (routes) {
        routes.forEach((route) => {
            this.use(...[
                ...this._buildRouteHead(route),
                ...this.buildResolvers(route.resolvers, route)
            ]);
        });
    }

    _lastMessageIndex (resolvers) {
        for (let i = resolvers.length - 1; i >= 0; i--) {
            if (resolvers[i].type === MESSAGE_RESOLVER_NAME) {
                return i;
            }
        }
        return -1;
    }

    buildResolvers (resolvers, route = {}) {
        const {
            path: ctxPath, isFallback, isResponder, expectedPath, id
        } = route;

        const lastMessageIndex = this._lastMessageIndex(resolvers);
        const lastIndex = resolvers.length - 1;

        return resolvers.map((resolver, i) => {
            const context = {
                ...this._context,
                isLastIndex: lastIndex === i,
                isLastMessage: lastMessageIndex === i,
                router: this,
                linksMap: this._linksMap,
                path: ctxPath,
                isFallback,
                isResponder,
                expectedPath,
                routeId: id
            };

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
 * @param {object[]} blocks - blocks list
 * @param {Plugins} plugins
 * @param {object} [context]
 */
BuildRouter.fromData = function fromData (blocks, plugins, context = {}) {

    const rootBlock = blocks.find((block) => block.isRoot);

    return new BuildRouter(rootBlock, plugins, ({ blocks, ...context }));
};

module.exports = BuildRouter;
