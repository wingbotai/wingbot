/**
 * @author Ales Kalfas
 */
'use strict';

const { withParams } = require('webalize');
const { default: fetch, Headers } = require('node-fetch');
const BotAppSender = require('./BotAppSender');
const extractText = require('./transcript/extractText');

/** @typedef {import('./transcript/transcriptFromHistory').Transcript} Transcript */

/**
 * @typedef OrchestratorClientOptions
 * @property {string} [apiUrl]
 * @property {Promise<string>|string} [secret]
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
     *  Returns conversation token used to authorize and continue in a conversation
     *
     * @param {number} expirationInSeconds
     * @returns {Promise<{conversationToken: string, expirationInSeconds: number}>}
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

        const conversationToken = res.data
            && res.data
            && res.data.chat
            && res.data.chat.conversationToken;

        return {
            expirationInSeconds,
            conversationToken
        };
    }

    /**
     * @returns {Promise<Transcript[]>}
     */
    async getTranscript () {
        const events = await this.getChatHistory();

        return events
            .map((e) => {
                const text = extractText(e);

                return {
                    fromBot: e.sender
                        ? e.sender.id !== this._senderId
                        : e.recipient.id === this._senderId,
                    text,
                    timestamp: e.timestamp
                };
            })
            .filter((ret) => !!ret.text);
    }

    /**
     *
     * @returns {Promise<object[]>}
     */
    async getChatHistory () {
        const res = await this._send({
            query: `query FetchHistory (
                $pageId: String!
                $senderId: String!
            ) {
                chat {
                    history (
                        pageId: $pageId,
                        senderId: $senderId
                    ) {
                        events {
                            sender {
                                id
                            }
                            recipient {
                                id
                            }
                            mid
                            timestamp
                            sender_action
                            set_context
                            postback {
                                payload
                                title
                            }
                            expected {
                                input {
                                    type
                                }
                            }
                            persona {
                                name
                                profile_pic_url
                            }
                            message {
                                text
                                is_confident
                                attachments {
                                    type
                                    payload {
                                        url
                                        template_type
                                        image_aspect_ratio
                                        text
                                        buttons {
                                            type
                                            title
                                            payload
                                            url
                                        }
                                        elements {
                                            default_action {
                                                type
                                                title
                                                payload
                                                url
                                            }
                                            title
                                            subtitle
                                            image_url
                                            buttons {
                                                type
                                                title
                                                payload
                                                url
                                            }
                                        }
                                    }
                                }
                                quick_replies {
                                    content_type
                                    title
                                    payload
                                }
                            }
                        }
                        nextStartAt
                        nextEndAt
                    }
                }
            }`,
            variables: {
                senderId: this._senderId,
                pageId: this._pageId
            }
        });

        if (res.errors && res.errors[0]) {
            throw new Error(res.errors[0].message);
        }

        const events = (res.data
            && res.data
            && res.data.chat
            && res.data.chat.history
            && res.data.chat.history.events) || [];

        return events;
    }

    /**
     * Create and add conversation token to url as a query param.
     *
     * E.g.:
     * http://www.xxx.cz/aaa?param1=lambada
     * =>
     * http://www.xxx.cz/aaa?param1=lambada&token=aSDasjdasjdas
     *
     * @param {string} url
     * @param {number} expirationInSeconds
     * @param {string} tokenName - Query parameter name to store token
     */
    async addConversationTokenToUrl (url, expirationInSeconds, tokenName = 'wbchtoken') {
        const { conversationToken } = await this.getConversationToken(expirationInSeconds);
        return withParams(url, {
            query: { [tokenName]: conversationToken }
        });
    }

    /**
     * @param {object} payload
     */
    async _send (payload) {
        const body = JSON.stringify(payload);

        const token = await BotAppSender.signBody(
            body,
            this._secret,
            this._appId
        );

        const headers = new Headers();

        headers.set('Authorization', token);
        headers.set('Content-Type', 'application/json');

        const response = await this._fetch(this._apiUrl, { headers, body, method: 'POST' });

        const responseJson = response.json();
        const { errors = null } = responseJson;

        if (errors) {
            const [{ error, description = '', code = 500 }] = errors;

            throw new Error(`[${code}] ${error} ${description}`);
        }

        return responseJson;
    }

}

module.exports = OrchestratorClient;
