/**
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const sinon = require('sinon');
const BotAppSender = require('../src/BotAppSender');
const BotApp = require('../src/BotApp');
const Router = require('../src/Router');

const SECRET = 'a';
const APP_ID = 'b';
const PAGE_ID = 'p';

describe('BotApp', () => {

    /** @type {BotApp} */
    let app;

    let fetch;

    beforeEach(() => {
        const bot = new Router();

        bot.use((req) => {
            if (req.isStandby()) {
                return Router.END;
            }
            return Router.CONTINUE;
        });

        bot.use((req, res) => {
            if (req.isSetContext()) {
                res.text('state set');
                res.setState({ '§foo': 'bar' });
                return Router.END;
            }
            return Router.CONTINUE;
        });

        bot.use('from-handover', (req, res) => {
            res.text('state set');
            res.setState({ '§foo': 'bar' });
        });

        bot.use(/hello/, (req, res) => {
            res.text('hi');
        });

        bot.use((req, res) => {
            res.text(`response to ${req.text()}`);
        });

        fetch = sinon.spy(async (url, { body }) => {
            const req = JSON.parse(body);

            return { json: () => Promise.resolve({ request: { ...req, mid: 'X' } }) };
        });

        app = new BotApp(bot, {
            autoTyping: true, secret: SECRET, apiUrl: 'b', fetch
        });
    });

    it('should not pass through authorization without the token', async () => {
        const response = await app.request(JSON.stringify({ entry: [] }), { authorization: '' });

        // @ts-ignore
        assert.deepStrictEqual(response, {
            body: '{"errors:":[{"error":"Missing authentication header","code":401,"status":401}]}',
            headers: {
                'Content-Type': 'application/json'
            },
            statusCode: 401
        });
    });

    it('should not pass through authorization without the token', async () => {
        const response = await app.request(JSON.stringify({ entry: [] }), { authorization: 'xyz' });

        // @ts-ignore
        assert.deepStrictEqual(response, {
            body: '{"errors:":[{"error":"Failed to verify token: jwt malformed","code":403,"status":403}]}',
            headers: {
                'Content-Type': 'application/json'
            },
            statusCode: 403
        });
    });

    it('should not pass through authorization without the token', async () => {
        const authorization = await BotAppSender.signBody('x', SECRET, APP_ID);
        const response = await app.request(JSON.stringify({ entry: [] }), { authorization });

        // @ts-ignore
        assert.deepStrictEqual(response, {
            body: '{"errors:":[{"error":"SHA1 does not match. Got in token: \'11f6ad8ec52a2984abaafd7c3b516503785c2072\'","code":403,"status":403}]}',
            headers: {
                'Content-Type': 'application/json'
            },
            statusCode: 403
        });
    });

    it('should provide a symc API interface to bot', async () => {

        const body = JSON.stringify({
            entry: [
                {
                    id: PAGE_ID,
                    requires_response: true,
                    standby: [
                        {
                            sender: { id: 's' }, recipient: { id: PAGE_ID }, mid: '1', message: { text: 'lala' }
                        }
                    ],
                    messaging: [
                        {
                            sender: { id: 's' }, recipient: { id: PAGE_ID }, mid: '2', message: { text: 'foo' }
                        }
                    ]
                }
            ]
        });
        const authorization = await BotAppSender.signBody(body, SECRET, APP_ID);

        const response = await app.request(body, { authorization });

        // @ts-ignore
        assert.deepStrictEqual(JSON.parse(response.body), {
            entry: [
                {
                    id: PAGE_ID,
                    responses: [
                        {
                            status: 200,
                            response_to_mid: '2',
                            messaging: [
                                {
                                    sender_action: 'typing_on',
                                    recipient: {
                                        id: 's'
                                    },
                                    messaging_type: 'RESPONSE',
                                    sender: {
                                        id: PAGE_ID
                                    },
                                    response_to_mid: '2',
                                    wait: 550
                                },
                                {
                                    message: {
                                        text: 'response to foo'
                                    },
                                    recipient: {
                                        id: 's'
                                    },
                                    messaging_type: 'RESPONSE',
                                    sender: {
                                        id: PAGE_ID
                                    },
                                    response_to_mid: '2'
                                }
                            ]
                        },
                        {
                            status: 204,
                            response_to_mid: '1',
                            messaging: []
                        }
                    ]
                }
            ]
        });

    });

    ['set_context', 'context']
        .forEach((key) => {

            it(`should retain thread context sent in ${key}`, async () => {

                const body = JSON.stringify({
                    entry: [
                        {
                            id: PAGE_ID,
                            requires_response: true,
                            messaging: [
                                key === 'context'
                                    ? {
                                        sender: { id: 's' },
                                        recipient: { id: PAGE_ID },
                                        mid: '2',
                                        context: { sasa: 'lele', obj: { a: 1, b: 2 } },
                                        pass_thread_control: {
                                            new_owner_app_id: 'abc'
                                        },
                                        postback: { payload: 'from-handover' }
                                    }
                                    : {
                                        sender: { id: 's' },
                                        recipient: { id: PAGE_ID },
                                        mid: '2',
                                        set_context: { sasa: 'lele', obj: { a: 1, b: 2 } }
                                    }
                            ]
                        }
                    ]
                });
                const authorization = await BotAppSender.signBody(body, SECRET, APP_ID);

                const response = await app.request(body, { authorization });

                const state = await app._processor.stateStorage.getState('s', PAGE_ID);

                assert.deepStrictEqual(state.state, {
                    ...state.state,
                    '§obj': { a: 1, b: 2 }
                });

                // @ts-ignore
                assert.deepStrictEqual(JSON.parse(response.body), {
                    entry: [
                        {
                            id: PAGE_ID,
                            responses: [
                                {
                                    status: 200,
                                    response_to_mid: '2',
                                    messaging: [
                                        {
                                            sender_action: 'typing_on',
                                            recipient: {
                                                id: 's'
                                            },
                                            messaging_type: 'RESPONSE',
                                            sender: {
                                                id: PAGE_ID
                                            },
                                            response_to_mid: '2',
                                            wait: 550
                                        },
                                        {
                                            message: {
                                                text: 'state set'
                                            },
                                            recipient: {
                                                id: 's'
                                            },
                                            messaging_type: 'RESPONSE',
                                            sender: {
                                                id: PAGE_ID
                                            },
                                            response_to_mid: '2'
                                        },
                                        {
                                            recipient: {
                                                id: 's'
                                            },
                                            messaging_type: 'RESPONSE',
                                            response_to_mid: '2',
                                            sender: {
                                                id: PAGE_ID
                                            },
                                            set_context: { foo: 'bar' }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                });

            });

        });

    it('should provide a symc API interface to bot', async () => {

        const body = JSON.stringify({
            entry: [
                {
                    id: PAGE_ID,
                    messaging: [
                        {
                            sender: { id: 's' }, recipient: { id: PAGE_ID }, mid: '3', message: { text: 'hello' }
                        }
                    ]
                }
            ]
        });
        const authorization = await BotAppSender.signBody(body, SECRET, APP_ID);

        const response = await app.request(body, { authorization });

        // @ts-ignore
        assert.deepStrictEqual(JSON.parse(response.body), {
            entry: [
                {
                    id: PAGE_ID,
                    responses: [
                        {
                            status: 200,
                            response_to_mid: '3',
                            messaging: []
                        }
                    ]
                }
            ]
        });

        // @ts-ignore
        assert.strictEqual(fetch.callCount, 2);

    });

});
