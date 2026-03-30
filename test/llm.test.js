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
const LLMSession = require('../src/LLMSession');

describe('<LLM>', () => {

    it('should work', async () => {
        const bot = new Router();

        bot.use((req, res) => {
            res.text('attaching prompt');

            res.llmAddInstructions('start ${nonexisting}');

            res.llmAddInstructions('attach ${existing}');

            res.llmAddInstructions('on side ${prompt()}', 'existing');

            return Router.CONTINUE;
        });

        bot.use(async (req, res) => {
            const s = res.llmSessionWithHistory();

            assert.deepStrictEqual(await s.toArray(), [
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

        t.anyPrompt()
            .instructionContains('The user is 5 years old')
            .resultContains('mockmodel');

        t.any()
            .contains('The user is 5 years old.')
            .contains('Based on the users age explain what nuclear fusion is in 3 sentences.');
    });

    it('should be able to filter input', async () => {
        const bot = new Router();

        bot.use((req, res) => {
            res.llmAddFilter((text) => (text.startsWith('N') ? false : `X ${text} X`));
            return Router.BREAK;
        });

        bot.use(message({
            text: 'Based on the users age explain what nuclear fusion is in 3 sentences.',
            type: 'prompt'
        }, {}));

        const t = new Tester(bot);

        await t.text('text');

        t.debug();

        t.anyPrompt().promptContains('X text X');
    });

    it('should be able to add vector documents', async () => {
        const bot = new Router();

        bot.use((req, res) => {
            const vectorSearchResult = {
                maximalCosineDistanceThreshold: 0.5,
                nearestNeighbourCount: 2,
                resultDocuments: [
                    {
                        id: 'doc1',
                        name: 'Document 1',
                        text: 'Document 1: This is a test document for vector search.',
                        cosineDistance: 0.1,
                        excludedByCosineDistanceThreshold: false
                    },
                    {
                        id: 'doc2',
                        name: 'Document 2',
                        text: 'Document 2: Another document with relevant information.',
                        cosineDistance: 0.2,
                        excludedByCosineDistanceThreshold: false
                    }
                ]
            };

            res.llm.logPrompt(
                [{ role: 'user', content: 'analyze documents' }],
                { role: 'assistant', content: 'mock response' },
                vectorSearchResult
            );

            return Router.BREAK;
        });

        bot.use(message({
            text: 'Based on the provided documents, explain the main topics.',
            type: 'prompt'
        }, {}));

        const t = new Tester(bot);

        await t.text('analyze documents');

        t.debug();

        t.anyPrompt()
            .vectorSearchContains('Document 1: This is a test document for vector search')
            .vectorSearchContains('Document 2: Another document with relevant information');
    });

    it('should be able to evaluate input by the message', async () => {
        const bot = new Router();

        bot.use((req, res) => {
            const preprocessed = LLM.preprocessEvaluationRules([
                {
                    aiTags: ['#discard#'],
                    action: LLM.EVALUATION_ACTIONS.DISCARD
                },
                {
                    aiTags: ['#set-variable#'],
                    setState: {
                        lastResult: '{{$llmResult}}'
                    }
                },
                {
                    aiTags: ['#go-out#'],
                    action: 'out'
                }
            ]);
            preprocessed.forEach((prep) => res.llmAddResultRule(prep));
            return Router.BREAK;
        });

        bot.use('out', (req, res) => {
            res.text('out reached');
        });

        bot.use(message({
            text: 'Based on the users age explain what nuclear fusion is in 3 sentences.',
            type: 'prompt'
        }, {}));

        bot.use((req, res) => {
            res.text('discarded');
        });

        const t = new Tester(bot);

        await t.text('go out');
        t.any().contains('out reached');

        await t.text('discard');
        t.any().contains('discarded');

        await t.text('set variable');
        t.stateContains({
            lastResult: t.getLastPromptResult().content
        });
    });

    it('should be able to evaluate results');

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

        const splitted = LLMSession.toMessages({
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
