/**
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const Tester = require('../../src/Tester');
const Router = require('../../src/Router');
const MemoryChatLogStorage = require('../../src/tools/MemoryChatLogStorage');
const transcriptFromHistory = require('../../src/transcript/transcriptFromHistory');
const textBodyFromTranscript = require('../../src/transcript/textBodyFromTranscript');

describe('transcriptFromHistory', () => {

    it('should work', async () => {
        const bot = new Router();

        bot.use('start', (req, res) => {
            res
                .typingOn()
                .text('starting', { next: 'dalsi' });
        });

        bot.use('next', (req, res) => {
            res.text('hoho');
        });

        bot.use((req, res) => {
            res.button('do not understand')
                .postBackButton('random', 'next')
                .send();
        });

        const t = new Tester(bot);

        t.senderLogger = new MemoryChatLogStorage();

        await t.postBack('start');

        await t.quickReply('next');

        await t.text('sasalele');

        await t.processMessage({
            sender: { id: t.senderId },
            recipient: { id: t.pageId },
            postback: {
                title: 'random',
                payload: 'next'
            }
        }, t.senderId, t.pageId);

        const transcript = await transcriptFromHistory(t.senderLogger, t.senderId, t.pageId);

        // console.log(transcript);

        assert.deepStrictEqual(transcript, [
            {
                fromBot: false,
                text: 'start'
            },
            {
                fromBot: true,
                text: 'starting'
            },
            {
                fromBot: false,
                text: 'dalsi'
            },
            {
                fromBot: true,
                text: 'hoho'
            },
            {
                fromBot: false,
                text: 'sasalele'
            },
            {
                fromBot: true,
                text: 'do not understand'
            },
            {
                fromBot: false,
                text: 'random'
            },
            {
                fromBot: true,
                text: 'hoho'
            }
        ]);

        const text = textBodyFromTranscript(transcript);

        assert.strictEqual(text, `# > User: start
  < Bot: starting

# > User: dalsi
  < Bot: hoho

# > User: sasalele
  < Bot: do not understand

# > User: random
  < Bot: hoho`);
    });

});
