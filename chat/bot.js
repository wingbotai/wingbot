/**
 * @author David Menger
 */
'use strict';

const { LLMType } = require('..');
const Router = require('../src/Router');

const bot = new Router();

function getWeather () {
    return 'sunny';
}

bot.use('start', (req, res) => {
    res.text('hello');
});

bot.use(async (req, res) => {
    try {
        const structured = await res.llmSessionWithHistory()
            .systemPrompt(`# Classify the topic user wants to talk about now

- 'contact' - user wants to change contact information
- 'offer' - user wants address issues with their offer (date issued, offer number, bad attachment)
- 'terms' - wants to change delivery terms (invoicing details, warranty, delivery details)

In case of ongoinng conversation or unknown topic, use 'uknown_or_same'.
                `)
            .generateStructured(LLMType.object({
                topic: LLMType.enum([
                    'contact',
                    'offer',
                    'terms',
                    'uknown_or_same'
                ])
            }, 'IntentClassification'), {
                preset: 'routing',
                model: 'gpt-5.4-nano'
            })
            .send();

        // eslint-disable-next-line no-console
        console.log({ structured });
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log('-*__ catched', e);
        res.text(`Error: ${e.message}`);
    }

    try {
        await res.llmSessionWithHistory()
            .systemPrompt('Answer in rhymes')
            .tool(getWeather)
            .generate({
                preset: 'routing',
                model: 'gpt-5.4-nano'
            })
            .send();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log('-*__ catched', e);
        res.text(`Error: ${e.message}`);
    }
});

module.exports = bot;
