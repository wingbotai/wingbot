/*
 * @author David Menger
 */
'use strict';

const sinon = require('sinon');
const assert = require('assert');
const { Tester, ai, Router } = require('../index');
const BuildRouter = require('../src/BuildRouter');
const Plugins = require('../src/Plugins');
const MemoryBotConfigStorage = require('../src/tools/MemoryBotConfigStorage');
// @ts-ignore
const testbot = require('./testbot.json');
// @ts-ignore
const snippetTestbot = require('./invalid-snippet-testbot.json');

function wait (ms) {
    return new Promise((r) => setTimeout(r, ms));
}

describe('<BuildRouter>', async () => {

    it('should behave as router', async () => {
        const plugins = new Plugins();

        plugins.registerFactory('exampleBlock', () => async (req, res) => {
            await res.run('responseBlockName');
        });

        plugins.register('routerBlock', new Router());

        const bot = BuildRouter.fromData(testbot.data, plugins);

        const t = new Tester(bot);

        await t.postBack('/start');

        t.passedAction('start');

        t.any()
            .genericTemplate(2)
            .contains('This is the first time, you\'re here')
            .attachmentType('image');

        await t.postBack('/start');

        t.passedAction('start');

        t.any()
            .contains('This is your 1 visit')
            .quickReplyAction('subblock-include')
            .contains('Welcome in the bot');

        await t.quickReply('subblock-include');

        t.passedAction('subblock-include');

        t.any()
            .buttonTemplate('text', 3)
            .contains('Want continue?')
            .quickReplyAction('back');

        await t.quickReply('back');

        t.passedAction('back');
        t.passedAction('continued-action');

        t.any()
            .contains('Lets try to go deeper')
            .quickReplyAction('deep-entrypoint');

        await t.quickReply('deep-entrypoint');

        const { state } = t.getState();

        assert.equal(state.testAbsoluteAction, '/subblock-include/foo');
        assert.equal(state.testCurrentAction, '/subblock-include/deep-entrypoint');
        assert.equal(state.testRoutePath, '/deep-entrypoint');

        t.passedAction('deep-entrypoint');

        t.any()
            .contains('Can go outside')
            .quickReplyAction('back');

        await t.quickReply('back');

        t.passedAction('back');
        t.passedAction('continued-action');

        await t.postBack('subblock-include');

        t.passedAction('subblock-include');

        ai.mockIntent('localIntent');

        await t.text('anytext');

        t.any().contains('This is local AI reaction');
        t.any().contains('got anytext');

        ai.mockIntent();
    });

    it('should work with Router plugins', async () => {
        const plugins = new Plugins();

        plugins.code('exampleBlock', async (req, res) => {
            await res.run('responseBlockName');
        });

        const routerBlock = new Router();

        routerBlock.use('/', async (req, res, postBack) => {
            await res.run('responseBlockName');

            postBack('nextRoute');
        });

        routerBlock.use('/nextRoute', async (req, res) => {
            await res.run('anotherBlockName');
        });

        plugins.register('routerBlock', routerBlock);

        const bot = BuildRouter.fromData(testbot.data, plugins);

        const collect = [];

        bot.on('action', (...args) => {
            collect.push(args);
        });

        const t = new Tester(bot);

        await t.postBack('router-plugin');

        await wait(10);

        t.any()
            .contains('Yessss')
            .contains('Another works');
    });

    it('should return translated messages', async () => {
        const plugins = new Plugins();

        plugins.register('routerBlock', new Router());
        plugins.code('exampleBlock', async (req, res) => {
            await res.run('responseBlockName');
        });

        const bot = BuildRouter.fromData(testbot.data, plugins);

        const t = new Tester(bot);

        t.setState({ lang: 'cz' });

        await t.postBack('/start');

        t.passedAction('start');

        t.any()
            .contains('To je poprvé')
            .contains('This is fallback response')
            .contains('Správná odpověď');

    });

    it('should make the responders at fallback working', async () => {
        const plugins = new Plugins();

        plugins.register('routerBlock', new Router());
        plugins.code('exampleBlock', async (req, res) => {
            await res.run('responseBlockName');
        });

        const bot = BuildRouter.fromData(testbot.data, plugins);

        const t = new Tester(bot);

        const actions = [];
        t.processor.on('event', (s, action, txt, r, prevAction) => {
            actions.push({ action, prevAction });
        });

        await t.text('random-text');

        t.any()
            .contains('Yes, this is the fallback');

        await t.intent('localIntent');

        await new Promise((r) => setTimeout(r, 10));

        t.any()
            .contains('Matched fallback responder');

        assert.deepEqual(actions, [
            { action: '/*', prevAction: null },
            { action: '/just-a-fallback_responder', prevAction: '/*' }
        ]);
    });

    function makeBot (text) {
        return {
            blocks: [{
                isRoot: true,
                routes: [{
                    path: '/start',
                    resolvers: [
                        {
                            type: 'botbuild.inlineCode',
                            params: {
                                description: 'show the reaction',
                                code: '(req, res) => { return new Promise(r => setTimeout(() => r(true), 100)); }'
                            },
                            id: 1507627874450
                        },
                        {
                            type: 'botbuild.message',
                            params: {
                                replies: [],
                                text
                            }
                        }
                    ]
                }]
            }]
        };
    }

    describe('#reduce()', () => {

        let bot;
        let mockRequest;

        beforeEach(() => {
            const plugins = new Plugins();

            // lets mock the storage
            const configStorage = new MemoryBotConfigStorage();

            const config = { configStorage };

            let cnt = 0;

            mockRequest = sinon.spy(async () => {
                switch (cnt++) {
                    case 0:
                        return makeBot('first');
                    case 1:
                        return makeBot('second');
                    default:
                        throw new Error('Can be trigged only twice');
                }
            });

            bot = new BuildRouter({ botId: 'fake-bot-id' }, plugins, config, mockRequest);

            bot.use('xyz', (req, res) => {
                res.text('hello');
            });

            bot.keepConfigFor = -5000;
        });

        it('should load new configuration from the internet, other requests are waiting', async () => {
            // for two different users to be able to make simultaneous requests
            const testers = [new Tester(bot), new Tester(bot), new Tester(bot)];

            await Promise.all(testers.map((t) => t.postBack('/start')));

            testers.forEach((t) => t.res(0).contains('first'));

            assert.strictEqual(mockRequest.callCount, 1);

            await Promise.all(testers.map((t) => t.postBack('/start')));

            testers.forEach((t) => t.res(0).contains('first'));

            assert.strictEqual(mockRequest.callCount, 1);
        });

        it('should not update configuration, when requests are pending', async () => {
            const first = new Tester(bot);
            const second = new Tester(bot);
            const third = new Tester(bot);

            await third.postBack('xyz');
            third.res(0).contains('hello');

            const firstPromise = first.postBack('/start');

            await wait(10);

            assert.strictEqual(bot._runningReqs.length, 1, 'the request has to be running');
            assert.strictEqual(mockRequest.callCount, 1, 'the config should be already downloaded');

            // lets invalidate the storage and run second request

            await bot._configStorage.invalidateConfig();

            await Promise.all([
                firstPromise,
                second.postBack('/start'),
                third.postBack('start')
            ]);

            assert.strictEqual(mockRequest.callCount, 2, 'the config should be downloaded again');

            first.res(0).contains('first');
            second.res(0).contains('second');
            third.res(0).contains('second');

            await third.postBack('xyz');
            third.res(0).contains('hello');

        });

        it('should load first configuration from storage, when possible', async () => {
            const t = new Tester(bot);

            await bot._configStorage.updateConfig(makeBot('foo'));

            await t.postBack('/start');

            assert.strictEqual(bot._runningReqs.length, 0, 'the request has to be running');
            t.res(0).contains('foo');
        });
    });

    it('forbids selected keywords in snippets', async () => {
        const plugins = new Plugins();

        plugins.register('exampleBlock', async (req, res) => {
            await res.run('responseBlockName');
        });

        plugins.register('routerBlock', new Router());

        assert.throws(() => {
            BuildRouter.fromData(snippetTestbot.blocks, plugins);
        }, /forbidden\sword/);

        assert.doesNotThrow(() => {
            BuildRouter.fromData(snippetTestbot.blocks, plugins, {
                allowForbiddenSnippetWords: true
            });
        });

    });

    it('expands randob texts', async () => {
        const plugins = new Plugins();

        plugins.register('exampleBlock', async (req, res) => {
            await res.run('responseBlockName');
        });

        plugins.register('routerBlock', new Router());

        const bot = BuildRouter.fromData(testbot.data, plugins);

        const t = new Tester(bot);

        t.setExpandRandomTexts();

        await t.postBack('/start');

        t.any()
            .contains('first second third');
    });

});
