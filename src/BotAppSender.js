/**
 * @author David Menger
 */
'use strict';

const jwt = require('jsonwebtoken');
const { default: fetch, Headers } = require('node-fetch');
const FormData = require('form-data');
const crypto = require('crypto');
const { Agent } = require('https');
const { promisify } = require('util');
const ReturnSender = require('./ReturnSender');

/** @typedef {import('./ReturnSender').ReturnSenderOptions} ReturnSenderOptions */
/** @typedef {import('./ReturnSender').ChatLogStorage} ChatLogStorage */
/** @typedef {import('./ReturnSender').UploadResult} UploadResult */

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
     * @param {string} senderId
     * @param {object} incommingMessage
     * @param {ChatLogStorage} logger - console like logger
     */
    constructor (options, senderId, incommingMessage, logger = null) {
        super(options, senderId, incommingMessage, logger);

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

    /**
     *
     * @param {Buffer} data
     * @param {string} contentType
     * @param {string} fileName
     * @param {string} [senderId]
     * @returns {Promise<UploadResult>}
     */
    async upload (data, contentType, fileName, senderId = this._senderId) {
        const formData = new FormData();

        const nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36).padEnd(11, '0');

        formData.append('nonce', nonce);
        formData.append('senderId', senderId || '');
        formData.append('f0', data, { filename: fileName, contentType });

        const [token, agent] = await Promise.all([
            BotAppSender.signBody(nonce, this._secret, this._appId),
            this._getAgent()
        ]);

        const headers = new Headers();

        headers.set('Authorization', token);

        const response = await this._fetch(`${this._apiUrl}/${this._pageId}`, {
            headers, body: formData, agent, method: 'POST'
        })
            .then((r) => r.json());

        return response;
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
