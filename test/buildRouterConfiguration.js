/**
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const { Plugins } = require('../index');
const BuildRouter = require('../src/BuildRouter');
const Tester = require('../src/Tester');
const configurationbot = require('./configurationbot.json');

describe('<buildRouterConfiguration>', () => {

    /** @type {Tester} */
    let t;

    beforeEach(() => {
        const plugins = new Plugins();

        plugins.register('exampleBlock', async (req, res) => {
            res.run('responseBlockName');
        });

        plugins.register('routerBlock', (req, res) => {
            res.text('routerBlock');
        });

        // @ts-ignore
        const bot = BuildRouter.fromData(configurationbot.data, plugins, {
            allowForbiddenSnippetWords: true,
            configuration: { foo: 'root value' },
            routeConfigs: [
                {
                    path: 'subblock-include',
                    enabled: true
                },
                {
                    path: 'disabled',
                    enabled: false
                }
            ]
        });

        t = new Tester(bot);
    });

    describe('#', () => {

        it('should work', async () => {
            await t.postBack('start');

            t.any()
                .contains('This is the first time, you\'re here root value');

            assert.throws(() => {
                t.any().quickReplyTextContains('Nesmi tu byt');
            });

            await t.quickReplyText('Go To Subblock');

            t.any()
                .contains('Want continue root value');

            assert.deepEqual(
                t.res(0).response.message.attachment.payload.buttons,
                [{
                    type: 'postback',
                    title: 'musi',
                    payload: '{"action":"/subblock-include/deep-entrypoint","data":{"_ca":"/subblock-include"}}'
                }]
            );

            await t.quickReply('back');

            t.any()
                .contains('Deeper  here');

            await t.intent('globalIntent');

            t.any()
                .contains('Yes, this is the fallback');
        });

    });

    describe('deployedConfiguration', () => {

        it('should merge deployedConfiguration into c variables', async () => {
            const blocks = [
                {
                    isRoot: true,
                    blockName: 'Root',
                    staticBlockId: 'root-block',
                    routes: [
                        {
                            id: 1,
                            path: 'start',
                            isEntryPoint: true,
                            isFallback: false,
                            resolvers: [
                                {
                                    type: 'botbuild.message',
                                    params: {
                                        text: [
                                            'Hello {{c.brandEmail}}'
                                        ],
                                        replies: []
                                    }
                                }
                            ]
                        }
                    ]
                }
            ];

            const rootBlock = blocks.find((b) => b.isRoot);
            // @ts-ignore
            const bot = new BuildRouter(rootBlock, new Plugins(), {
                blocks,
                configuration: {}
            });

            bot.buildWithSnapshot(blocks, undefined, undefined, {
                brandEmail: 'test@example.com'
            });

            const tester = new Tester(bot);

            await tester.postBack('start');

            tester.any().contains('Hello test@example.com');
        });

        it('should merge deployedConfiguration with existing configuration', async () => {
            const blocks = [
                {
                    isRoot: true,
                    blockName: 'Root',
                    staticBlockId: 'root-block',
                    routes: [
                        {
                            id: 1,
                            path: 'start',
                            isEntryPoint: true,
                            isFallback: false,
                            resolvers: [
                                {
                                    type: 'botbuild.message',
                                    params: {
                                        text: [
                                            '{{c.existing}} {{c.brandEmail}}'
                                        ],
                                        replies: []
                                    }
                                }
                            ]
                        }
                    ]
                }
            ];

            const rootBlock = blocks.find((b) => b.isRoot);
            // @ts-ignore
            const bot = new BuildRouter(rootBlock, new Plugins(), {
                blocks,
                configuration: { existing: 'keep' }
            });

            bot.buildWithSnapshot(blocks, undefined, undefined, {
                brandEmail: 'hello@brand.com'
            });

            const tester = new Tester(bot);

            await tester.postBack('start');

            tester.any().contains('keep hello@brand.com');
        });

        it('should work without deployedConfiguration', async () => {
            const blocks = [
                {
                    isRoot: true,
                    blockName: 'Root',
                    staticBlockId: 'root-block',
                    routes: [
                        {
                            id: 1,
                            path: 'start',
                            isEntryPoint: true,
                            isFallback: false,
                            resolvers: [
                                {
                                    type: 'botbuild.message',
                                    params: {
                                        text: [
                                            'Hello world'
                                        ],
                                        replies: []
                                    }
                                }
                            ]
                        }
                    ]
                }
            ];

            const rootBlock = blocks.find((b) => b.isRoot);
            // @ts-ignore
            const bot = new BuildRouter(rootBlock, new Plugins(), {
                blocks,
                configuration: { foo: 'bar' }
            });

            bot.buildWithSnapshot(blocks);

            const tester = new Tester(bot);

            await tester.postBack('start');

            tester.any().contains('Hello world');
            assert.equal(/** @type {any} */ (bot.configuration).foo, 'bar');
        });

    });

});
