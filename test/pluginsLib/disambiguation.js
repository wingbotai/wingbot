/*
 * @author David Menger
 */
'use strict';

// const assert = require('assert');
const Tester = require('../../src/Tester');
const Router = require('../../src/Router');
const Ai = require('../../src/Ai');
const disambiguation = require('../../src/pluginsLib/disambiguation');

const { ai } = Ai;

describe('Disambiguation', () => {

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
