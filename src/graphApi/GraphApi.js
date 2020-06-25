/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const { graphql, buildSchema } = require('graphql');
const WingbotApiConnector = require('./WingbotApiConnector');
// @ts-ignore
const packageJson = require('../../package.json');

const DEFAULT_GROUPS = ['botEditor', 'botAdmin', 'appToken'];
const KEYS_URL = 'https://api.wingbot.ai/keys';
const DEFAULT_CACHE = 5 * 86400000;

/**
 * @typedef {object} GraphQlResponse
 * @param {*} [data]
 * @param {object[]} [errors]
 */

/**
 * Experimental chatbot API
 */
class GraphApi {

    /**
     *
     * @param {object[]} apis - list of connected APIs
     * @param {object} options - API options
     * @param {string|Promise<string>} options.token - wingbot token
     * @param {string} [options.appToken] - public token
     * @param {string[]} [options.groups] - list of allowed bot groups
     */
    constructor (apis, options) {
        this._root = {
            version () {
                return packageJson.version;
            }
        };

        const opts = {
            token: null,
            groups: DEFAULT_GROUPS,
            keysUrl: KEYS_URL,
            cacheKeys: DEFAULT_CACHE
        };

        Object.assign(opts, options);

        apis.forEach((api) => Object.assign(this._root, api));

        this._cachedSchema = null;

        this._defaultGroups = opts.groups;

        this._apiConnector = new WingbotApiConnector({
            token: opts.token,
            appToken: opts.appToken,
            keysUrl: opts.keysUrl,
            cacheKeys: opts.cacheKeys
        });
    }

    /**
     *
     * @param {object} body
     * @param {object} body.query
     * @param {object} [body.variables]
     * @param {string} [body.operationName]
     * @param {object} headers
     * @param {string} [headers.Authorization]
     * @param {string} [headers.authorization]
     * @param {string} [wingbotToken]
     * @returns {Promise<GraphQlResponse>}
     */
    async request (body, headers, wingbotToken = undefined) {
        assert.ok(body && typeof body === 'object', 'GraphQL request should be an object with a request property');
        assert.equal(typeof body.query, 'string', 'GraphQL request should contain a query property');

        const authHeader = headers.Authorization || headers.authorization;
        const token = await this._apiConnector.verifyToken(authHeader, wingbotToken);

        const schema = await this._schema();

        const ctx = {
            token,
            groups: this._defaultGroups
        };

        // @ts-ignore
        return graphql(schema, body.query, this._root, ctx, body.variables, body.operationName);
    }

    async _schema () {
        if (this._cachedSchema === null) {
            const schema = await this._apiConnector.getSchema();
            this._cachedSchema = buildSchema(schema);
        }
        return this._cachedSchema;
    }

}

module.exports = GraphApi;
