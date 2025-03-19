/* eslint-disable no-template-curly-in-string */
/**
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const Router = require('../src/Router');
const Tester = require('../src/Tester');
const message = require('../src/resolvers/message');
const contextMessage = require('../src/resolvers/contextMessage');

describe('<LLM>', () => {

    it('should work', async () => {
        const bot = new Router();

        bot.use((req, res) => {
            res.text('attaching prompt');

            res.llmAddSystemPrompt('start ${nonexisting}');

            res.llmAddSystemPrompt('attach ${existing}');

            res.llmAddSystemPrompt('on side ${prompt()}', 'existing');

            return Router.CONTINUE;
        });

        bot.use(async (req, res) => {
            const s = await res.llmSessionWithHistory();

            assert.deepStrictEqual(s.toArray(), [
                {
                    content: 'start\n\nattach on side',
                    role: 'system'
                },
                {
                    content: 'test',
                    role: 'user'
                },
                {
                    content: 'attaching prompt',
                    role: 'assistant'
                }
            ]);

            await s.systemPrompt('last prompt')
                .debug()
                .generate();

            s.send();
        });

        const t = new Tester(bot);

        await t.text('test');

        t.debug();
    });

    it('should work with resolvers', async () => {
        const bot = new Router();

        bot.use(contextMessage({
            context: 'The user is 5 years old.'
        }, {}));

        bot.use(message({
            text: 'Based on the users age explain what nuclear fusion is in 3 sentences.',
            type: 'prompt'
        }, {}));

        const t = new Tester(bot);

        await t.text('hello this is user');

        t.any()
            .contains('The user is 5 years old.')
            .contains('Based on the users age explain what nuclear fusion is in 3 sentences.');
    });

    it('should work with resolvers', async () => {
        const bot = new Router();

        bot.use(contextMessage({
            context: 'The user is 5 years old.'
        }, {}));

        bot.use(message({
            text: 'Based on the users age explain what nuclear fusion is in 3 sentences.',
            type: 'prompt'
        }, {}));

        const t = new Tester(bot);

        await t.text('hello this is user');

        t.any()
            .contains('The user is 5 years old.')
            .contains('Based on the users age explain what nuclear fusion is in 3 sentences.');
    });

});
