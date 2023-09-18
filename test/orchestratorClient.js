/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { graphql, buildSchema } = require('graphql');
const Router = require('../src/Router');
const Tester = require('../src/Tester');
const OrchestratorClient = require('../src/OrchestratorClient');

const SECRET = 'xxx';

describe('OrchestratorClient', () => {

    let bot;
    let fetch;
    const expirationInSeconds = 666;

    beforeEach(() => {
        bot = new Router();

        bot.use('token', async (req, res) => {
            const client = req.orchestratorClient;
            const {
                conversationToken: token
            } = await client.getConversationToken(expirationInSeconds);
            res.text(token);
        });

        // Mock orchestartor graphql
        const schema = `
            type ChatQuery {
                conversationToken(senderId: String!, pageId: String!, expirationInSeconds: Int!):String
            }
            type RootQuery {
                chat: ChatQuery
            }
            schema {
                query: RootQuery
            }
        `;

        const builtSchema = buildSchema(schema);

        const root = {
            chat: {
                conversationToken: 'my-conversation-token'
            }
        };

        // Mock fetch method to be able catch call to orchestrator
        fetch = sinon.spy(async (url, { body }) => {
            const req = JSON.parse(body);
            // Pass request to mock graphql server
            const res = await graphql({
                schema: builtSchema,
                source: req.query,
                rootValue: root,
                variableValues: req.variables
            });
            // Return result in format like from orchestrator
            return { json: () => ({ data: res.data, request: {} }) };
        });
    });

    it('should get orchestratorClient and load conversation token from orchestrator API', async () => {

        const senderId = 'my-senderId';
        const pageId = 'my-pageId';
        const appId = 'my-appId';

        const t = new Tester(bot, null, null, { secret: SECRET, fetch, apiUrl: 'b' });
        t.senderId = senderId;
        t.pageId = pageId;
        Object.assign(t.testData, { appId });
        await t.postBack('/token');
        t.any()
            .contains('my-conversation-token'); // -${senderId}-${pageId}-${expirationInSeconds}`);
    });

    it('should throw error due to missing properties for connection to orchestrator', async () => {

        const senderId = 'my-senderId';
        const pageId = 'my-pageId';
        const appId = 'my-appId';

        const t = new Tester(bot, null, null, {});
        t.senderId = senderId;
        t.pageId = pageId;
        Object.assign(t.testData, { appId });
        try {
            await t.postBack('/token');
            throw new Error('Should raised exception!');
        } catch (e) {
            assert.ok(e.message.startsWith('Missing mandatory properties'));
        }
    });

    it('should throw error due to missing pageId for send message to orchestrator', async () => {
        const appId = 'my-appId';

        const t = new Tester(bot, null, null, { secret: SECRET, fetch, apiUrl: 'b' });
        t.senderId = 'a';
        t.pageId = null;
        Object.assign(t.testData, { appId });
        try {
            await t.postBack('/token');
            throw new Error('Should raised exception!');
        } catch (e) {
            assert.strictEqual(e.message, 'Request doesn\'t receive \'pageId\' from Processor!');
        }
    });

    it('should return token', async () => {

        const client = new OrchestratorClient({
            secret: Promise.resolve(SECRET),
            apiUrl: 'api.url',
            fetch,
            appId: 'my-appId',
            pageId: 'my-pageId',
            senderId: 'my-senderId'
        });

        assert.deepStrictEqual(
            await client.getConversationToken(10),
            {
                conversationToken: 'my-conversation-token', // -my-senderId-my-pageId-10',
                expirationInSeconds: 10
            }
        );
    });

    it('should create and add conversation token to url', async () => {

        const client = new OrchestratorClient({
            secret: Promise.resolve(SECRET),
            apiUrl: 'api.url',
            fetch,
            appId: 'my-appId',
            pageId: 'my-pageId',
            senderId: 'my-senderId'
        });

        assert.strictEqual(
            await client.addConversationTokenToUrl('http://www.site.com', 10),
            'http://www.site.com/?wbchtoken=my-conversation-token' // -my-senderId-my-pageId-10'
        );
        assert.strictEqual(
            await client.addConversationTokenToUrl('http://www.site.com/bla', 10),
            'http://www.site.com/bla?wbchtoken=my-conversation-token' // -my-senderId-my-pageId-10'
        );
        assert.strictEqual(
            await client.addConversationTokenToUrl('http://www.site.com/bla?param=foo', 10),
            'http://www.site.com/bla?param=foo&wbchtoken=my-conversation-token' // -my-senderId-my-pageId-10'
        );
        assert.strictEqual(
            await client.addConversationTokenToUrl('http://www.site.com/bla?param1=foo&param2=bar', 10),
            'http://www.site.com/bla?param1=foo&param2=bar&wbchtoken=my-conversation-token' // -my-senderId-my-pageId-10'
        );
        assert.strictEqual(
            await client.addConversationTokenToUrl('http://www.site.com/bla?param1=foo&param2=bar#x=123&y=789', 10),
            'http://www.site.com/bla?param1=foo&param2=bar&wbchtoken=my-conversation-token#x=123&y=789' // -my-senderId-my-pageId-10#x=123&y=789'
        );
    });

    // Test for running orchestrator
    it.skip('call orchestrator tester', async () => {
        const client = new OrchestratorClient({
            secret: Promise.resolve(SECRET),
            apiUrl: 'http://localhost:3000/api/api',
            appId: 'ced24e1e-8383-4ab0-95d8-e566fb7354e6',
            pageId: 'cfe27018-f5e3-4919-93cf-75bfb20ea449',
            senderId: 'FfNVjz2zABy71Y'
        });

        const url = await client.addConversationTokenToUrl('http://localhost:3000/test', 3600, 'wbchtoken');
        assert.strictEqual(url, '');
    });

});
