/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');
const Ai = require('../../src/Ai');

describe('Plugins<ai.wingbot.passThreadToBot>', () => {

    /**
     * @type {Tester}
     */
    let t;

    /**
     * @type {Router}
     */
    let bot;

    beforeEach(() => {
        bot = new Router();

        t = new Tester(bot);
    });

    it('should pass the text', async () => {
        const plugins = new Plugins();

        bot.use(plugins.getWrappedPlugin('ai.wingbot.passThreadToBot', { targetAppId: 'a' }));

        await t.text('foo');

        // @ts-ignore
        assert.deepEqual(t.responses, [
            {
                ...t.responses[0],
                target_app_id: 'a',
                metadata: '{"action":null,"data":{"$hopCount":0},"text":"foo"}'
            }
        ]);
    });

    it('should pass the action', async () => {
        const plugins = new Plugins();
        bot.use(plugins.getWrappedPlugin('ai.wingbot.passThreadToBot', { targetAppId: 'a', targetAction: 'b' }));

        await t.text('foo');

        // @ts-ignore
        assert.deepEqual(t.responses, [
            {
                ...t.responses[0],
                target_app_id: 'a',
                metadata: '{"action":"b","data":{"$hopCount":0}}'
            }
        ]);
    });

    it('should pass the intent', async () => {
        const plugins = new Plugins();
        bot.use(plugins.getWrappedPlugin('ai.wingbot.passThreadToBot', { targetAppId: 'a', targetIntent: 'b' }));

        await t.text('foo');

        // @ts-ignore
        assert.deepEqual(t.responses, [
            {
                ...t.responses[0],
                target_app_id: 'a',
                metadata: '{"intent":"b","data":{"$hopCount":0}}'
            }
        ]);
    });

    it('should pass the text when there is a disambiguation', async () => {
        const plugins = new Plugins();

        // @ts-ignore
        bot.use(
            Ai.ai.global('has-path', 'foo', 'footitle'),
            plugins.getWrappedPlugin('ai.wingbot.passThreadToBot', { targetAppId: 'a' })
        );

        // @ts-ignore
        bot.use(Ai.ai.global('has-tag', 'bar', () => 'bartitle'), (req, res) => {
            res.text('tag text');
        });

        // @ts-ignore
        bot.use(Ai.ai.global('has-entity', '@ent', 'enttitle'), (req, res) => {
            res.text('ent text');
        });

        const pluginItems = new Map();

        pluginItems.set('diambiguations', [(req, res) => {
            res.text('Disamb', []);
        }]);

        bot.use(
            plugins.getWrappedPlugin('ai.wingbot.disambiguation', {}, pluginItems),
            plugins.getWrappedPlugin('ai.wingbot.passThreadToBot', { targetAppId: 'a' })
        );

        await t.intent(['foo', 'bar'], 'random', 0.5);

        t.any().contains('Disamb');

        await t.quickReply('has-path');

        // @ts-ignore
        assert.deepEqual(t.responses, [
            {
                ...t.responses[0],
                target_app_id: 'a',
                metadata: '{"action":null,"data":{"$hopCount":0,"_senderMeta":{"flag":"d","likelyIntent":"foo","disambText":"random"}},"text":"random"}'
            }
        ]);
    });

});
