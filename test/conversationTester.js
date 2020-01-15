/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Router = require('../src/Router');
const Ai = require('../src/Ai');
const ConversationTester = require('../src/ConversationTester');

describe('<ConversationTester>', () => {

    let storage;
    let botFactory;

    beforeEach(() => {
        /** @type {import('../src/ConversationTester').TestCase[]} */
        storage = {
            async getTestCases () {
                return [
                    {
                        list: 'Good',
                        name: 'foo',
                        steps: [
                            {
                                step: 1,
                                rowNum: 1,
                                action: '#start',
                                passedAction: 'start',
                                textContains: 'Hello',
                                quickRepliesContains: 'Next'
                            },
                            {
                                step: 2,
                                rowNum: 2,
                                action: '>Next',
                                passedAction: 'next',
                                textContains: 'Quick reply',
                                quickRepliesContains: ''
                            },
                            {
                                step: 3,
                                rowNum: 3,
                                action: 'random text',
                                passedAction: '/*',
                                textContains: 'Fallback',
                                quickRepliesContains: ''
                            }
                        ]
                    },
                    {
                        list: 'Cat',
                        name: 'foo2',
                        steps: [
                            {
                                step: 1,
                                rowNum: 1,
                                action: '#nonexisting-action',
                                passedAction: 'nonexisting-action',
                                textContains: '',
                                quickRepliesContains: ''
                            }
                        ]
                    },
                    {
                        list: 'Cat',
                        name: 'required quick reply not found',
                        steps: [
                            {
                                step: 1,
                                rowNum: 1,
                                action: '#start',
                                passedAction: 'start',
                                textContains: 'Hello',
                                quickRepliesContains: 'Next'
                            },
                            {
                                step: 2,
                                rowNum: 2,
                                action: '>Required',
                                passedAction: 'next',
                                textContains: 'Quick reply',
                                quickRepliesContains: ''
                            }
                        ]
                    },
                    {
                        list: 'Good',
                        name: 'nonexisting quick reply in fallback',
                        steps: [
                            {
                                step: 1,
                                rowNum: 1,
                                action: '#start',
                                passedAction: 'start',
                                textContains: 'Hello',
                                quickRepliesContains: 'Next'
                            },
                            {
                                step: 2,
                                rowNum: 2,
                                action: 'Haha',
                                passedAction: '/*',
                                textContains: 'Fallback',
                                quickRepliesContains: ''
                            }
                        ]
                    },
                    {
                        list: 'Cat',
                        name: 'normal quick reply not found',
                        steps: [
                            {
                                step: 1,
                                rowNum: 1,
                                action: '#start',
                                passedAction: 'start',
                                textContains: 'Hello',
                                quickRepliesContains: 'Another'
                            }
                        ]
                    },
                    {
                        list: 'Cat',
                        name: 'missing text',
                        steps: [
                            {
                                step: 1,
                                rowNum: 1,
                                action: '#start',
                                passedAction: 'start',
                                textContains: 'Hello nonexisting',
                                quickRepliesContains: 'Next'
                            }
                        ]
                    }
                ];
            }
        };

        botFactory = () => {
            const bot = new Router();

            bot.use('start', (req, res) => {
                res.text('Hello', {
                    next: 'Next'
                });
            });

            bot.use('next', (req, res) => {
                res.text(req.isQuickReply() ? 'Quick reply' : 'Other');
            });

            bot.use(Ai.ai.global('path', 'foo', null, { targetAppId: '1', targetAction: 'a' }), (req, res) => {
                res.text('Action')
                    .passThread('1');
            });

            bot.use((req, res) => {
                res.text('Fallback')
                    .passThread('1');
            });

            return bot;
        };
    });

    describe('#test()', () => {

        it('should work with text replies', async () => {
            const s = {
                async getTestCases () {
                    return [
                        {
                            list: 'Texts',
                            name: 'Texts',
                            texts: [
                                {
                                    text: 'ok',
                                    intent: 'foo'
                                },
                                {
                                    text: 'empty'
                                },
                                {
                                    text: 'to fallback',
                                    action: '/*'
                                },
                                {
                                    text: 'ok',
                                    action: '/path'
                                },
                                {
                                    text: 'to another',
                                    action: 'another'
                                },
                                {
                                    text: 'ok',
                                    appId: '1'
                                },
                                {
                                    text: 'ok',
                                    appId: '1',
                                    action: 'a'
                                },
                                {
                                    text: 'with bad path',
                                    appId: '1',
                                    action: 'path'
                                },
                                {
                                    text: 'with bad app id',
                                    appId: '2'
                                }
                            ]
                        }
                    ];
                }
            };

            let t = new ConversationTester(s, botFactory);

            Ai.ai.mockIntent('foo', 0.9);

            let out = await t.test();

            assert.strictEqual(out.total, 1);
            assert.strictEqual(out.passed, 0);
            assert.strictEqual(out.failed, 1);
            assert.ok(out.output.indexOf('5/9') !== -1);

            // console.log(out.output);

            t = new ConversationTester(s, botFactory, { useConversationForTextTestCases: true });

            out = await t.test();

            Ai.ai.mockIntent();

            assert.strictEqual(out.total, 1);
            assert.strictEqual(out.passed, 0);
            assert.strictEqual(out.failed, 1);
            assert.ok(out.output.indexOf('5/9') !== -1);

            // console.log(out.output);
        });

        it('should work', async () => {
            const t = new ConversationTester(storage, botFactory);

            const out = await t.test();

            assert.strictEqual(out.total, 6);
            assert.strictEqual(out.passed, 2);
            assert.strictEqual(out.failed, 4);
        });

        it('disableAssertActions', async () => {
            const t = new ConversationTester(storage, botFactory, {
                disableAssertActions: true
            });

            const out = await t.test();

            assert.strictEqual(out.total, 6);
            assert.strictEqual(out.passed, 3);
            assert.strictEqual(out.failed, 3);
        });

        it('disableAssertQuickReplies', async () => {
            const t = new ConversationTester(storage, botFactory, {
                disableAssertQuickReplies: true
            });

            const out = await t.test();

            assert.strictEqual(out.total, 6);
            assert.strictEqual(out.passed, 3);
            assert.strictEqual(out.failed, 3);
        });

        it('disableAssertTexts', async () => {
            const t = new ConversationTester(storage, botFactory, {
                disableAssertTexts: true
            });

            const out = await t.test();

            assert.strictEqual(out.total, 6);
            assert.strictEqual(out.passed, 3);
            assert.strictEqual(out.failed, 3);
        });

    });

});
