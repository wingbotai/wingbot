/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { mockServer } = require('graphql-tools');
const Router = require('../src/Router');
const Tester = require('../src/Tester');
const OrchestratorClient = require('../src/OrchestratorClient');

const SECRET = 'a';

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

        const server = mockServer(schema, {
            ChatQuery: () => ({
                conversationToken: ({ senderId, pageId, expirationInSeconds: expirationInSecondsInput }) => `my-conversation-token-${senderId}-${pageId}-${expirationInSecondsInput}`
            })
        });

        // Mock fetch method to be able catch call to orchestrator
        fetch = sinon.spy(async (url, { body }) => {
            const req = JSON.parse(body);
            // Pass request to mock graphql server
            const res = await server.query(req.query, req.variables);
            // Return result in format like from orchestrator
            return { json: () => ({ body: res, request: {} }) };
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
            .contains(`my-conversation-token-${senderId}-${pageId}-${expirationInSeconds}`);
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
            assert.strictEqual(e.message, `Missing mandatory properties: apiUrl,secret,fetch which are need to connect to orchestrator! 
It looks like the bot isn't connected to class BotApp`);
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

        assert.strictEqual(
            await client.getConversationToken(10),
            {
                conversationToken: 'my-conversation-token-my-senderId-my-pageId-10',
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
            'http://www.site.com/?token=my-conversation-token-my-senderId-my-pageId-10'
        );
        assert.strictEqual(
            await client.addConversationTokenToUrl('http://www.site.com/bla', 10),
            'http://www.site.com/bla?token=my-conversation-token-my-senderId-my-pageId-10'
        );
        assert.strictEqual(
            await client.addConversationTokenToUrl('http://www.site.com/bla?param=foo', 10),
            'http://www.site.com/bla?param=foo&token=my-conversation-token-my-senderId-my-pageId-10'
        );
        assert.strictEqual(
            await client.addConversationTokenToUrl('http://www.site.com/bla?param1=foo&param2=bar', 10),
            'http://www.site.com/bla?param1=foo&param2=bar&token=my-conversation-token-my-senderId-my-pageId-10'
        );
        assert.strictEqual(
            await client.addConversationTokenToUrl('http://www.site.com/bla?param1=foo&param2=bar#x=123&y=789', 10),
            'http://www.site.com/bla?param1=foo&param2=bar&token=my-conversation-token-my-senderId-my-pageId-10#x=123&y=789'
        );
    });

});
