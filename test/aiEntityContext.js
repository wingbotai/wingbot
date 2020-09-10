/*
 * @author David Menger
 */
'use strict';

const Tester = require('../src/Tester');
const Router = require('../src/Router');
const Ai = require('../src/Ai');

const { ai } = Ai;

describe('<Ai> entity context', () => {

    /** @type {Tester} */
    let t;

    beforeEach(() => {
        const bot = new Router();

        const first = new Router();

        first.use(ai.global('foo-with', ['foo', '@entity']), (req, res) => {
            res.text('foo with entity');
        });

        first.use(ai.global('bar-with', ['bar', '@entity']), (req, res) => {
            res.text('bar with entity');
        });

        first.use(ai.global('bar-without', ['bar']), (req, res) => {
            res.text('bar without entity', [
                { action: 'bar-with', title: 'set en', match: ['@entity=value'] }
            ]);
        });

        first.use(ai.global('first', ['first']), (req, res) => {
            res.text('first without entity');
        });

        const second = new Router();

        second.use(ai.global('baz-with', ['baz', '@entity']), (req, res) => {
            res.text('baz with entity');
        });

        second.use(ai.global('baz-without', ['baz', '@entity!=']), (req, res) => {
            res.text('baz without entity');
        });

        second.use(ai.global('second', ['second']), (req, res) => {
            res.text('second without entity');
        });

        first.use('expect', (req, res) => {
            res.text('gimme').expected('next');
        });

        first.use('next', async (req, res, postBack) => {
            if (req.actionByAi()) {
                await postBack(req.actionByAi(), {}, true);
            }
            res.text('back here');
        });

        bot.use('start', (req, res) => {
            res.text('Welcome');
        });

        bot.use(ai.global('fakin', ['@entity']), (req, res) => {
            res.text('Fakin');
        });

        bot.use('first', first);
        bot.use('second', second);

        bot.use((req, res) => {
            res.text('fallback');
        });

        t = new Tester(bot);
    });

    it('keeps the entity inside a context', async () => {
        await t.intentWithEntity('foo', 'entity', 'value');

        t.any().contains('foo with entity');

        await t.intent('first');

        t.any().contains('first without entity');

        await t.intent('bar');

        t.any().contains('bar with entity');
    });

    it('keeps the entity when changing a dialogue', async () => {
        await t.intentWithEntity('foo', 'entity', 'value');

        t.any().contains('foo with entity');

        await t.intent('baz');

        t.any().contains('baz with entity');
    });

    it('keeps the entity when changing a dialogue just for the transmit', async () => {
        await t.intentWithEntity('foo', 'entity', 'value');

        t.any().contains('foo with entity');

        await t.intent('second');

        t.any().contains('second without entity');

        await t.intent('baz');

        t.any().contains('baz without entity');
    });

    it('ignores solo remembered entity', async () => {
        await t.intentWithEntity('foo', 'entity', 'value');

        t.any().contains('foo with entity');

        await t.intent('sasalele');

        t.any().contains('fallback');
    });

    it('keeps the entity while FAQ bounce (and bookmark)', async () => {
        await t.intentWithEntity('foo', 'entity', 'value');

        await t.postBack('/first/expect');

        await t.intent('second');

        t.any()
            .contains('second without entity')
            .contains('back here');

        await t.intent('bar');

        t.any().contains('bar with entity');
    });

    it('saves the entity from quick reply', async () => {
        await t.postBack('/first/bar-without');

        await t.quickReply('bar-with');

        await t.intent('baz');

        t.any().contains('baz with entity');
    });

    it('saves the entity from expected keywords', async () => {
        await t.postBack('/first/bar-without');

        await t.intentWithEntity('any', 'entity', 'value');

        await t.intent('baz');

        t.any().contains('baz with entity');
    });

});
