/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Router = require('../src/Router');
const Ai = require('../src/Ai');
const ConversationTester = require('../src/ConversationTester');
const { BuildRouter } = require('..');
const MockAiModel = require('../src/MockAiModel');

describe('<ConversationTester>', () => {

    let storage;
    let textStorage;
    let enStorage;
    let csStorage;
    let botFactory;
    let xStorage;

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

        /** @type {import('../src/ConversationTester').TextCase[]} */
        enStorage = {
            async getTestCases () {
                return [
                    {
                        list: 'Texts',
                        name: 'Texts',
                        texts: [
                            {
                                text: 'english',
                                intent: 'start-intent'
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
                                action: '#start',
                                passedAction: 'start',
                                textContains: 'english',
                                quickRepliesContains: ''
                            }
                        ]
                    }
                ];
            }
        };

        /** @type {import('../src/ConversationTester').TextCase[]} */
        csStorage = {
            async getTestCases () {
                return [
                    {
                        list: 'Texts',
                        name: 'Texts',
                        texts: [
                            {
                                text: 'cesky',
                                intent: 'start-intent'
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
                                action: '#start',
                                passedAction: 'start',
                                textContains: 'cesky',
                                quickRepliesContains: ''
                            }
                        ]
                    }
                ];
            }
        };

        /** @type {import('../src/ConversationTester').TextCase[]} */
        xStorage = {
            async getTestCases () {
                return [
                    {
                        list: 'Cat',
                        name: 'foo',
                        steps: [
                            {
                                step: 1,
                                rowNum: 1,
                                action: 'valid text',
                                passedAction: 'valid-text',
                                textContains: 'bar\nFallback',
                                quickRepliesContains: ''
                            }
                        ]
                    }
                ];
            }
        };

        /** @type {import('../src/ConversationTester').TextCase[]} */
        textStorage = {
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

            bot.use(Ai.ai.global('valid-text', ['#valid-text']), (req, res) => {
                res.setState({ foo: 'bar' });
                return false;
            });

            bot.use((req, res) => {
                if (res.newState.foo) {
                    res.text(res.newState.foo);
                }
                res.text('Fallback')
                    .passThread('1');
            });

            return bot;
        };
    });

    describe('#test()', () => {

        afterEach(() => {
            Ai.ai.deregister('cs');
            Ai.ai.deregister('en');
            Ai.ai.deregister('xx');
            Ai.ai.deregister('default');
        });

        it('should work with text replies', async () => {
            let t = new ConversationTester(textStorage, botFactory);

            Ai.ai.mockIntent('foo', 0.9);

            let out = await t.test();

            assert.strictEqual(out.total, 9);
            assert.strictEqual(out.passed, 0);
            assert.strictEqual(out.failed, 1);
            assert.ok(out.output.indexOf('5/9') !== -1);

            t = new ConversationTester(textStorage, botFactory, {
                useConversationForTextTestCases: true
            });

            out = await t.test();

            Ai.ai.mockIntent();

            assert.strictEqual(out.total, 9);
            assert.strictEqual(out.passed, 0);
            assert.strictEqual(out.failed, 1);
            assert.ok(out.output.indexOf('5/9') !== -1);
        });

        it('should work', async () => {
            const t = new ConversationTester(storage, botFactory);

            const out = await t.test();

            assert.strictEqual(out.total, 6);
            assert.strictEqual(out.passed, 2);
            assert.strictEqual(out.failed, 4);
        });

        it('should work', async () => {
            const t = new ConversationTester(xStorage, botFactory);

            const out = await t.test();

            assert.strictEqual(out.total, 1);
            assert.strictEqual(out.passed, 1);
            assert.strictEqual(out.failed, 0);
        });

        it('should work with language', async () => {
            const enMock = [['english', { intent: 'start-intent' }]];
            const csMock = [['cesky', [{ intent: 'start-intent' }]]];
            const xxMock = [['cesky', { intents: [{ intent: 'none' }] }]];
            const defaultMock = [['cesky', null]];

            Ai.ai.register(new MockAiModel({}, console, new Map(enMock)), 'en');
            Ai.ai.register(new MockAiModel({}, console, new Map(csMock)), 'cs');
            Ai.ai.register(new MockAiModel({}, console, new Map(xxMock)), 'xx');
            Ai.ai.register(new MockAiModel({}, console, new Map(defaultMock)));

            const t = new ConversationTester({
                cs: csStorage,
                en: enStorage
            }, () => BuildRouter.fromData([{
                isRoot: true,
                routes: [
                    {
                        id: '71f23dd0-e147-11ea-b4f2-ef90cb7950de',
                        path: 'start',
                        isEntryPoint: true,
                        isFallback: false,
                        replies: [],
                        aiTags: [
                            'start-intent'
                        ],
                        aiGlobal: true,
                        resolvers: [
                            {
                                type: 'botbuild.message',
                                params: {
                                    text: [
                                        { t: 'cesky', l: 'cs' },
                                        { t: 'english', l: 'en' }
                                    ],
                                    replies: []
                                }
                            }
                        ]
                    }
                ]
            }]));

            let out = await t.test(null, null, 'cs');

            assert.strictEqual(out.total, 2);
            assert.strictEqual(out.passed, 2);
            assert.strictEqual(out.failed, 0);

            out = await t.test(null, null, 'en');

            assert.strictEqual(out.total, 2);
            assert.strictEqual(out.passed, 2);
            assert.strictEqual(out.failed, 0);

            out = await t.test(null, null, 'xx');

            assert.strictEqual(out.total, 2);
            assert.strictEqual(out.passed, 1);
            assert.strictEqual(out.failed, 1);

            out = await t.test();

            assert.strictEqual(out.total, 2);
            assert.strictEqual(out.passed, 1);
            assert.strictEqual(out.failed, 1);
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

        it('should work in steps (default)', async () => {
            const t = new ConversationTester(storage, botFactory);

            const out = await t.test();

            assert.equal(out.total, 6);
            assert.equal(out.step, null);
            assert.equal(out.stepCount, 1);
        });

        it('should work in steps (paging)', async () => {
            const cases = [
                // [stepCasesPerStep, expectedStepCount]
                [1, 6], [2, 4], [3, 4], [4, 3], [5, 2], [6, 2]
            ];
            for (const [stepCasesPerStep, expectedStepCount] of cases) {
                const t = new ConversationTester(storage, botFactory, {
                    stepCasesPerStep
                });

                let step = 1;
                while (step <= expectedStepCount) {
                    const out = await t.test(undefined, step);

                    assert.ok(out.total <= stepCasesPerStep, 'unexpected total');
                    assert.equal(out.step, step, 'unexpected step');
                    assert.equal(out.stepCount, expectedStepCount, `unexpected step count ${stepCasesPerStep}`);

                    step++;
                }
            }
        });

        it('should work in steps (even for texts)', async () => {
            const cases = [
                // [textCasesPerStep, expectedStepCount]
                [1, 9], [2, 5], [3, 4], [4, 3], [5, 3], [6, 2], [7, 2], [8, 2], [9, 2]
            ];
            for (const [textCasesPerStep, expectedStepCount] of cases) {
                const t = new ConversationTester(textStorage, botFactory, {
                    textCasesPerStep
                });

                let step = 1;
                while (step <= expectedStepCount) {
                    const out = await t.test(undefined, step);

                    assert.ok(out.total <= textCasesPerStep, 'unexpected total');
                    assert.equal(out.step, step, 'unexpected step');
                    assert.equal(out.stepCount, expectedStepCount, `unexpected step count ${textCasesPerStep}`);

                    step++;
                }
            }
        });

    });

});
