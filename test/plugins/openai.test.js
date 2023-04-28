/*
 * @author David Menger
 */
'use strict';

const assert = require('assert').strict;
const { spy } = require('sinon');
const Tester = require('../../src/Tester');
const Router = require('../../src/Router');
const Plugins = require('../../src/Plugins');

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
                            content: 'hello\nwelcome'
                        }
                    }
                ]
            })
        }));

        bot.use(plugins.getWrappedPlugin('ai.wingbot.openai', { fetch, annotation: 'HI {{message}} HI' }));

        t = new Tester(bot);

        await t.text('cau');

        t.any()
            .contains('HI hello HI')
            .contains('HI welcome HI');

        await t.text('ahoj');

        // @ts-ignore
        const { body } = fetch.secondCall.args[1];

        const parsedBody = JSON.parse(body);

        assert.ok(parsedBody.messages.some((m) => m.role === 'user' && m.content === 'ahoj'));
    });

});
