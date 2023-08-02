/*
 * @author David Menger
 */
'use strict';

const assert = require('assert').strict;
const { spy } = require('sinon');
const Tester = require('../../src/Tester');
const Router = require('../../src/Router');
const Plugins = require('../../src/Plugins');
const MemoryChatLogStorage = require('../../src/tools/MemoryChatLogStorage');

describe('openai plugin', () => {

    /** @type {Tester} */
    let t;

    it('works', async () => {
        const plugins = new Plugins();

        const bot = new Router();

        const fetch = spy(() => ({
            status: 200,
            json: async () => ({
                choices: [
                    {
                        message: {
                            role: 'assistant',
                            content: 'HI hello HI\nwelcome H'
                        }
                    }
                ]
            })
        }));

        bot.use(plugins.getWrappedPlugin('ai.wingbot.openai', { fetch, annotation: 'HI {{message}} H' }));

        t = new Tester(bot);

        await t.text('cau');

        t.any()
            .contains('HI hello HI H')
            .contains('HI welcome H');

        t.any()
            .notContains('HI HI hello')
            .notContains('welcome H H');

        await t.text('ahoj');

        // @ts-ignore
        const { body } = fetch.secondCall.args[1];

        const parsedBody = JSON.parse(body);

        assert.ok(parsedBody.messages.some((m) => m.role === 'user' && m.content === 'ahoj'));
    });

    it('filters gpt', async () => {
        const plugins = new Plugins();

        const bot = new Router();

        const fetch = spy(() => ({
            status: 200,
            json: async () => ({
                choices: [
                    {
                        message: {
                            role: 'assistant',
                            content: 'hello\nH welcome'
                        }
                    }
                ]
            })
        }));

        bot.use(/non-gpt/, (req, res) => { res.text('private'); });

        bot.use(plugins.getWrappedPlugin('ai.wingbot.openai', {
            fetch, charLim: 100, annotation: 'H', limit: '-10', maxTokens: 50
        }));

        t = new Tester(bot);

        t.senderLogger = new MemoryChatLogStorage();

        await t.text('sasa');

        t.debug();

        await t.text('lele');

        await t.text('non-gpt');

        await t.text('cau');

        t.any()
            .contains('H hello')
            .contains('H welcome');

        t.any()
            .notContains('H H welcome');

        await t.text('ahoj');

        // @ts-ignore
        const { body } = fetch.getCall(3).args[1];

        const parsedBody = JSON.parse(body);

        assert.ok(parsedBody.messages.some((m) => m.role === 'user' && m.content === 'ahoj'));
        assert.ok(parsedBody.messages.some((m) => m.role === 'user' && m.content === 'cau'));
        assert.ok(parsedBody.messages.every((m) => m.content !== 'non-gpt'));
        assert.ok(parsedBody.messages.every((m) => m.content !== 'private'));
    });

});
