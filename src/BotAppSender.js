/**
 * @author David Menger
 */
'use strict';

const jwt = require('jsonwebtoken');
const { default: fetch, Headers } = require('node-fetch');
const crypto = require('crypto');
const { Agent } = require('https');
const { promisify } = require('util');
const ReturnSender = require('./ReturnSender');

/** @typedef {import('./ReturnSender').ReturnSenderOptions} ReturnSenderOptions */
/** @typedef {import('./ReturnSender').ChatLogStorage} ChatLogStorage */

/**
 * @typedef {object} TlsOptions
 * @prop {string|Promise<string>} key
 * @prop {string|Promise<string>} cert
 */

/**
 * @typedef {object} BotAppSenderOptions
 * @prop {string} apiUrl
 * @prop {string} pageId
 * @prop {string} appId
 * @prop {TlsOptions} [tls]
 * @prop {string} [mid]
 * @prop {Function} [fetch]
 * @prop {string|Promise<string>} secret
 *
 * @typedef {BotAppSenderOptions & ReturnSenderOptions} SenderOptions
 */

const sign = promisify(jwt.sign);

class BotAppSender extends ReturnSender {

    /**
     *
     * @param {SenderOptions} options
     * @param {string} userId
     * @param {object} incommingMessage
     * @param {ChatLogStorage} logger - console like logger
     */
    constructor (options, userId, incommingMessage, logger = null) {
        super(options, userId, incommingMessage, logger);

        this.waits = true;

        this._apiUrl = options.apiUrl;
        this._pageId = options.pageId;
        this._appId = options.appId;
        this._mid = options.mid;

        this._secret = Promise.resolve(options.secret);

        this._tls = options.tls;
        this._agent = null;

        this._fetch = options.fetch || fetch;
    }

    static async signBody (body, secret, appId) {
        const goodSecret = await Promise.resolve(secret);

        const sha1 = crypto.createHash('sha1')
            .update(body)
            .digest('hex');

        return sign({
            appId,
            sha1,
            iss: 'apiapp',
            t: 'at'
        }, goodSecret);
    }

    async _getAgent () {
        if (!this._tls) {
            return null;
        }
        if (!this._agent) {
            const [key, cert] = await Promise.all([
                Promise.resolve(this._tls.key), Promise.resolve(this._tls.cert)
            ]);

            this._agent = new Agent({ cert, key });
        }

        return this._agent;
    }

    async _send (payload) {
        // attach sender
        if (typeof payload.sender === 'undefined') {
            Object.assign(payload, { sender: { id: this._pageId } });
        }

        // attach response_to_mid
        if (typeof payload.response_to_mid === 'undefined' && this._mid) {
            Object.assign(payload, { response_to_mid: this._mid });
        }

        const body = JSON.stringify(payload);

        const [token, agent] = await Promise.all([
            BotAppSender.signBody(body, this._secret, this._appId),
            this._getAgent()
        ]);

        const headers = new Headers();

        headers.set('Authorization', token);
        headers.set('Content-Type', 'application/json');

        const response = await this._fetch(this._apiUrl, {
            headers, body, agent, method: 'POST'
        })
            .then((r) => r.json());

        const { request, errors = null } = response;

        if (errors) {
            const [{ error, description = '', code = 500 }] = errors;

            throw new Error(`[${code}] ${error} ${description}`);
        }

        return {
            message_id: request.mid
        };

    }

}

module.exports = BotAppSender;
