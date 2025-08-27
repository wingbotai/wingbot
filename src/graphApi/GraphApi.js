/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const WingbotApiConnector = require('./WingbotApiConnector');
// @ts-ignore
const packageJson = require('../../package.json');
const headersToAuditMeta = require('../utils/headersToAuditMeta');

const DEFAULT_GROUPS = ['botEditor', 'botAdmin', 'appToken'];
const KEYS_URL = 'https://api.wingbot.ai/keys';
const DEFAULT_CACHE = 86400000; // 24 hours

/**
 * @typedef {object} GraphQlResponse
 * @param {*} [data]
 * @param {object[]} [errors]
 */

/**
 * @typedef {object} RequestParams
 * @param {string} [snapshot]
 */

/** @typedef {import('../CallbackAuditLog')} AuditLog */
/** @typedef {import('graphql')} GqlLib */

class GraphApi {

    /**
     *
     * @param {object[]} apis - list of connected APIs
     * @param {object} options - API options
     * @param {string|Promise<string>} options.token - wingbot token
     * @param {string} [options.appToken] - public token
     * @param {string[]} [options.groups] - list of allowed bot groups
     * @param {boolean} [options.useBundledGql] - uses library bundled graphql definition
     * @param {AuditLog} [options.auditLog]
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
            cacheKeys: DEFAULT_CACHE,
            auditLog: {
                async callback () {
                    // noop
                },
                defaultWid: '0',
                async log () {
                    // noop
                }
            }
        };

        Object.assign(opts, options);

        apis.forEach((api) => Object.assign(this._root, api));

        this._cachedSchema = null;

        this._originalSchema = null;

        this._defaultGroups = opts.groups;

        /** @type {AuditLog} */
        // @ts-ignore
        this.auditLog = opts.auditLog;

        this._apiConnector = new WingbotApiConnector({
            token: opts.token,
            appToken: opts.appToken,
            keysUrl: opts.keysUrl,
            cacheKeys: opts.cacheKeys,
            useBundledGql: opts.useBundledGql
        });

        this._lib = null;
    }

    /**
     * @returns {GqlLib}
     */
    get _gql () {
        if (this._lib === null) {
            // eslint-disable-next-line global-require
            this._lib = require('graphql');
        }
        return this._lib;
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
     * @param {string} [headers.Origin]
     * @param {string} [headers.origin]
     * @param {string} [headers.Referer]
     * @param {string} [headers.referer]
     * @param {string} [wingbotToken]
     * @param {RequestParams} [params]
     * @returns {Promise<GraphQlResponse>}
     */
    async request (body, headers, wingbotToken = undefined, params = {}) {
        assert.ok(body && typeof body === 'object', 'GraphQL request should be an object with a request property');
        assert.equal(typeof body.query, 'string', 'GraphQL request should contain a query property');

        const authHeader = headers.Authorization || headers.authorization;
        let token = {};

        const audit = async (action, payload = {}, important = false, warn = false) => {
            await this.auditLog.log(
                {
                    category: 'API',
                    action,
                    payload
                },
                {
                    id: token.id,
                    jwt: token.id && authHeader.replace(/^bearer\s/i, '')
                },
                headersToAuditMeta(headers),
                this.auditLog.defaultWid,
                warn ? 'Warn' : 'Info',
                important ? 'Important' : 'Debug'
            );
        };

        try {
            token = await this._apiConnector.verifyToken(authHeader, wingbotToken);
        } catch (e) {
            await audit('authorization failed', { message: e.message, authHeader }, true, true);
            throw e;
        }

        const schema = await this._schema();

        const ctx = {
            token,
            groups: this._defaultGroups,
            audit,
            params
        };

        const response = await this._gql.graphql({
            schema,
            source: body.query,
            rootValue: this._root,
            contextValue: ctx,
            variableValues: body.variables,
            operationName: body.operationName
        });

        return response;
    }

    async _schema () {
        const loadedSchema = await this._apiConnector.getSchema();

        const schemaIsSame = this._originalSchema
            && this._originalSchema.length === loadedSchema.length;

        if (!schemaIsSame) {
            this._originalSchema = loadedSchema;
            this._cachedSchema = this._gql.buildSchema(loadedSchema);
        }
        return this._cachedSchema;
    }

}

module.exports = GraphApi;
