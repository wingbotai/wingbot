/*
 * @author David Menger
 */
'use strict';

// const assert = require('assert');
const Tester = require('../../src/Tester');
const Router = require('../../src/Router');
const Ai = require('../../src/Ai');
const disambiguation = require('../../plugins/ai.wingbot.disambiguation/plugin');
const BuildRouter = require('../../src/BuildRouter');
const botJson = require('../disambiguation-bot.json');

const { ai } = Ai;

describe('Disambiguation', () => {

    describe('global disambiguation', () => {

        /** @type {Tester} */
        let t;

        beforeEach(() => {
            const nested = new Router();

            // @ts-ignore
            nested.use(ai.global('has-path', 'foo', 'footitle'), (req, res) => {
                res.text('foo text');
            });

            // @ts-ignore
            nested.use(ai.global('has-tag', 'bar', () => 'bartitle'), (req, res) => {
                res.text('tag text');
            });

            // @ts-ignore
            nested.use(ai.global('has-entity', '@ent', 'enttitle'), (req, res) => {
                res.text('ent text');
            });

            const bot = new Router();

            bot.use('include', nested);

            bot.use((req, res) => {
                // simulate plugins modules
                Object.assign(res, {
                    async run (block) {
                        if (block === 'diambiguations') {
                            res.text('Dis', []);
                        }
                        return undefined;
                    }
                });
                return true;
            }, disambiguation, (req, res) => {
                res.text('No result.');
            });

            t = new Tester(bot);
        });

        it('passes intents with low threshold and title to the fallback', async () => {
            await t.intent(['foo', 'bar'], 'random', 0.5);

            t.any()
                .quickReplyAction('has-path')
                .quickReplyAction('has-tag')
                .quickReplyTextContains('bartitle');

            await t.quickReply('has-path');

            t.passedAction('has-path');
        });

        it('passes also entity with low threshold and title to the fallback', async () => {
            await t.intentWithEntity('haha', 'ent', 'val', 'text', 0.5);

            t.any()
                .quickReplyAction('has-entity');

            await t.quickReply('has-entity');

            t.passedAction('has-entity');
        });

        it('works also when there is no matching action', async () => {
            await t.intentWithEntity('haha', 'dkaldsa', 'val', 'text', 0.5);

            t.any()
                .contains('No result.');
        });

    });

    describe('local disambiguation', () => {

        /** @type {Tester} */
        let t;

        beforeEach(() => {

            const bot = BuildRouter.fromData(botJson.data);

            t = new Tester(bot);
        });

        it('just works with quick replies', async () => {
            await t.postBack('start');

            await t.intentWithEntity('intent', 'entity', 'value', 'hello', 0.5);

            t.any().contains('disambiguation');

            await t.quickReply('next');

            t.any().contains('content is value');
        });

        it('just works with intent handlers', async () => {
            await t.postBack('start');

            await t.intentWithEntity('foo', 'bar', 'sasalele', 'hello', 0.5);

            t.any()
                .contains('disambiguation')
                .quickReplyTextContains('sasalele');

            await t.quickReplyText('sasalele');

            t.any().contains('foobar is sasalele');
        });

        it('just works with intent handlers, but accepts different entity value', async () => {
            await t.postBack('start');

            await t.intentWithEntity('foo', 'bar', 'sasalele', 'hello', 0.5);

            t.any()
                .contains('disambiguation')
                .quickReplyTextContains('sasalele');

            await t.intentWithEntity('foo', 'bar', 'hoho', 'hello', 0.9);

            t.any().contains('foobar is hoho');
        });

        it('works with alternatives', async () => {
            await t.postBack('start');

            await t.processMessage({
                message: {
                    text: 'disamb'
                },
                intent: 'intent-without-disamb',
                score: 1,
                entities: [
                    {
                        entity: 'standalone',
                        value: 'primary',
                        score: 0.9,
                        alternatives: [
                            {
                                entity: 'standalone',
                                value: 'alternative',
                                score: 0.9
                            }
                        ]
                    }
                ]
            });

            t.any()
                .quickReplyTextContains('primary')
                .quickReplyTextContains('alternative');

            await t.quickReplyText('alternative');

            t.any().contains('alternative');
        });

    });

});
