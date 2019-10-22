/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Router = require('../src/Router');
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

            bot.use((req, res) => {
                res.text('Fallback');
            });

            return bot;
        };
    });

    describe('#test()', () => {

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
