/**
 * @author Ales Kalfas
 */
'use strict';

const { default: fetch, Headers } = require('node-fetch');
const BotAppSender = require('./BotAppSender');

/**
 * @typedef OrchestratorClientOptions
 * @property {string} [apiUrl]
 * @property {Promise<string>} [secret]
 * @property {string} [senderId]
 * @property {string} [pageId]
 * @property {string} [appId]
 * @property {Function} [fetch]
 */

class OrchestratorClient {

    /**
     * @param {OrchestratorClientOptions} options
     */
    constructor (options) {
        this._apiUrl = options.apiUrl;
        this._secret = Promise.resolve(options.secret);
        this._appId = options.appId;
        this._senderId = options.senderId;
        this._pageId = options.pageId;
        this._fetch = options.fetch || fetch;
    }

    /**
     *
     * @param {number} expirationInSeconds
     * @returns {Promise<{conversationToken: string}>}
     */
    async getConversationToken (expirationInSeconds) {
        const res = await this._send({
            query: `query GetConversationToken($senderId: String!, $pageId: String!, $expirationInSeconds: Int!) {
                        chat {
                            conversationToken(senderId: $senderId, pageId: $pageId, expirationInSeconds: $expirationInSeconds)
                        }
                    }`,
            variables: {
                senderId: this._senderId,
                pageId: this._pageId,
                expirationInSeconds
            }
        });

        const conversationToken = res.body
        && res.body.data
        && res.body.data.chat
        && res.body.data.chat.conversationToken;

        return {
            conversationToken
        };

    }

    // TODO udelat metodu co vraci celou url. Tzn. ze do url prida wingbot token
    // getUrlWithConversationToken(url:string)
    // Poznamka k pouzit z bota. Url vezmu z konfigu. Mela by to byt pageUrl.

    /**
     * @param {object} payload
     */
    async _send (payload) {
        const body = JSON.stringify(payload);

        const token = await BotAppSender.signBody(body, this._secret, this._appId);

        const headers = new Headers();

        headers.set('Authorization', token);
        headers.set('Content-Type', 'application/json');

        const response = await this._fetch(this._apiUrl, { headers, body, method: 'POST' })
            .then((r) => r.json());

        const { errors = null } = response;

        if (errors) {
            const [{ error, description = '', code = 500 }] = errors;

            throw new Error(`[${code}] ${error} ${description}`);
        }

        return response;
    }
}

module.exports = OrchestratorClient;
