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
const LLM = require('../src/LLM');

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

    it('should split messages correctly', () => {
        const content = 'Samozřejmě! 🌟 V naší kategorii **Art** máme několik skvělých produktů. Můžete si vybrat z následujících možností:\n'
            + '\n'
            + '1. **Framed postery:**\n'
            + '   - **The best is yet to come** - Optimistický motiv pro povzbuzení vašeho prostoru.\n'
            + '   - **The adventure begins** - Skvělý pro inspiraci k novým začátkům.\n'
            + '   - **Today is a good day** - Ideální pro pozitivní náladu.\n'
            + '\n'
            + '2. **Vektorové grafiky:**\n'
            + '   - **Mountain fox** - Ideální pro tisk na různé formáty.\n'
            + '   - **Brown bear** - Perfektní pro vaše kreativní projekty.\n'
            + '   - **Hummingbird** - Krásná ilustrace pro tisk.\n'
            + '\n'
            + '3. **Pack Mug + Framed poster** - Skvělá kombinace pro příjemný nákup.\n'
            + '\n'
            + 'Jaký typ produktu vás zaujal nejvíce? 😊';

        const splitted = LLM.toMessages({
            role: 'agent',
            content
        });

        assert.deepStrictEqual(splitted, [
            {
                content: 'Samozřejmě! 🌟 V naší kategorii **Art** máme několik skvělých produktů. Můžete si vybrat z následujících možností:',
                role: 'agent'
            },
            {
                content: '1. **Framed postery:**\n'
                    + '- **The best is yet to come** - Optimistický motiv pro povzbuzení vašeho prostoru.\n'
                    + '- **The adventure begins** - Skvělý pro inspiraci k novým začátkům.\n'
                    + '- **Today is a good day** - Ideální pro pozitivní náladu.',
                role: 'agent'
            },
            {
                content: '2. **Vektorové grafiky:**\n'
                    + '- **Mountain fox** - Ideální pro tisk na různé formáty.\n'
                    + '- **Brown bear** - Perfektní pro vaše kreativní projekty.\n'
                    + '- **Hummingbird** - Krásná ilustrace pro tisk.',
                role: 'agent'
            },
            {
                content: '3. **Pack Mug + Framed poster** - Skvělá kombinace pro příjemný nákup.',
                role: 'agent'
            },
            {
                content: 'Jaký typ produktu vás zaujal nejvíce? 😊',
                role: 'agent'
            }
        ]);
    });

});
