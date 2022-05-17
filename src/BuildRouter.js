/*
 * @author David Menger
 */
'use strict';

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
        super();

        this._validateBlock(block);

        this._plugins = plugins;

        this._context = context;

        this._linksMap = new Map();

        this._loadBotUrl = null;

        this._loadBotAuthorization = null;

        this._botLoaded = null;

        this._fetch = fetchFn;

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

        this._snapshot = null;
        this._botId = null;

        if (typeof block.routes === 'object') {
            this._buildBot(block);
        } else if (typeof block.url === 'string') {
            this._loadBotUrl = block.url;
        } else if (typeof block.botId === 'string') {
            this._snapshot = block.snapshot || 'production';
            this._botId = block.botId;
            this._loadBotUrl = `https://api.wingbot.ai/bots/${this._botId}/snapshots/${this._snapshot}/blocks`;
        }
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
                    console.info('Loading new state failed - recovering', e);
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

            this.buildWithSnapshot(snapshot.blocks, snapshot.timestamp, snapshot.lastmod);
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
        const options = {};

        let auth;
        if (this._loadBotAuthorization) {
            auth = await Promise.resolve(this._loadBotAuthorization);
            Object.assign(options, {
                headers: {
                    Authorization: auth
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

        Object.assign(this._context, { blocks });

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
            this.globalIntents = new Map(this._prebuiltGlobalIntents);
        }
    }

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
        const includedBlock = (context.blocks || [])
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

    _buildRouteHead (route, nextRouteIsSameResponder) {
        const resolvers = [];

        if (!route.isFallback) {
            let aiResolver = null;

            if (route.aiTags && route.aiTags.length) {
                let { aiTitle = null } = route;

                if (aiTitle) {
                    aiTitle = cachedTranslatedCompilator(aiTitle);
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
            }
        }

        return resolvers;
    }

    _buildRoutes (routes) {
        routes.forEach((route, i) => {
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
                ...this._buildRouteHead(route, nextRouteIsSameResponder),
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

    _lastMessageIndex (resolvers) {
        for (let i = resolvers.length - 1; i >= 0; i--) {
            if (resolvers[i].type === MESSAGE_RESOLVER_NAME) {
                return i;
            }
        }
        return -1;
    }

    buildResolvers (resolvers, route = {}, buildInfo = {}) {
        const {
            path: ctxPath, isFallback, isResponder, expectedPath, id
        } = route;

        const lastMessageIndex = this._lastMessageIndex(resolvers);
        const lastIndex = resolvers.length - 1;

        return resolvers.map((resolver, i) => {
            const context = {
                ...this._context,
                isLastIndex: lastIndex === i && !buildInfo.expectedToAddResolver,
                isLastMessage: lastMessageIndex === i,
                router: this,
                linksMap: this._linksMap,
                path: ctxPath,
                isFallback,
                isResponder,
                expectedPath,
                routeId: id
            };

            return this._resolverFactory(resolver, context, buildInfo);
        });
    }

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
 * @param {object[]} blocks - blocks list
 * @param {Plugins} [plugins]
 * @param {object} [context]
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
