/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../src/Tester');
const Router = require('../src/Router');
const Ai = require('../src/Ai');
const CustomEntityDetectionModel = require('../src/wingbot/CustomEntityDetectionModel');

const { ai } = Ai;

describe('<Ai> entity context', () => {

    /** @type {Tester} */
    let t;

    before(() => {
        ai.register(new CustomEntityDetectionModel({}))
            .setEntityDetector('customentity', (text) => {
                const match = text.match(/youyou/);

                if (!match) {
                    return null;
                }
                return {
                    text: match[0],
                    value: 'detected'
                };
            });
    });

    beforeEach(() => {
        const bot = new Router();

        const first = new Router();

        first.use(ai.global('custom', ['@customentity']), (req, res) => {
            res.text(`e ${req.entity('customentity')}`);
        });

        first.use('chacha', (req, res) => {
            res.text(`X ${req.state['@customentity']}`);
        });

        first.use(ai.global('foo-with', ['foo', '@entity']), (req, res) => {
            res.text('foo with entity');
        });

        first.use(ai.global('persist-with', ['persist', '@entity']), (req, res) => {
            res.setState({ '@entity': 'persist' });
            res.text('persist with entity');
        });

        first.use(ai.global('bar-with', ['bar', '@entity']), (req, res) => {
            res.text('bar with entity')
                .text(`req.entity ${req.entity('entity')}`);
        });

        first.use(ai.global('bar-without', ['bar']), (req, res) => {
            res.text('bar without entity', [
                { action: 'bar-with', title: 'set en', match: ['@entity=value'] },
                {
                    action: 'bar-with',
                    title: 'setstate',
                    // match: ['@entity=value'],
                    setState: { '@entity': { x: 1 }, '@customentity': 'youyou' }
                },
                { action: 'chacha', match: ['@customentity'], title: 'try' }
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

    it('can override persisted entity', async () => {
        await t.intentWithEntity('persist', 'entity', 'value');

        t.any().contains('persist with entity');

        await t.intent('foo');

        t.any().contains('foo with entity');

        await t.intent('second');

        t.any().contains('second without entity');

        await t.intent('bar');

        t.any().contains('bar with entity');

        await t.intent('second');

        t.any().contains('second without entity');

        await t.intent('foo');

        t.any().contains('foo with entity');
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

        await t.quickReplyText('set en');

        t.any().contains('req.entity value');

        await t.intent('baz');

        t.any().contains('baz with entity');

        await t.intent('bar');

        t.any().contains('bar with entity');
    });

    it('saves the entity from quick reply for limited time', async () => {
        await t.postBack('/first/bar-without');

        await t.quickReplyText('set en');

        await t.intent('second');

        t.any().contains('second without entity');

        await t.intent('bar');

        t.any().contains('bar without entity');
    });

    it('passes the text through entity detector just once', async () => {
        await t.text('youyou');

        t.any().contains('e detected');

        // @ts-ignore
        assert.strictEqual(t.getState().state['@customentity'], 'detected');
    });

    it('passes the text through entity detector just once', async () => {
        await t.postBack('/first/bar-without');

        await t.text('youyou');

        t.any().contains('X detected');

        // @ts-ignore
        assert.strictEqual(t.getState().state['@customentity'], 'detected');
    });

    it('setstate from a quick reply is preferred', async () => {
        await t.postBack('/first/bar-without');

        await t.quickReplyText('setstate');

        // @ts-ignore
        assert.strictEqual(t.getState().state['@customentity'], 'detected');

        await t.intent('second');

        t.any().contains('second without entity');

        await t.intent('bar');

        t.any().contains('bar with entity');
    });

    it('saves the entity from expected keywords', async () => {
        await t.postBack('/first/bar-without');

        await t.intentWithEntity('any', 'entity', 'value');

        t.any().contains('req.entity value');

        await t.intentWithEntity('baz', 'totally', 'unrelated');

        t.any().contains('baz with entity');
    });

});
