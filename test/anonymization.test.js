/**
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const Router = require('../src/Router');
const Tester = require('../src/Tester');

describe('<anonymization>', () => {

    /** @type {Tester} */
    let t;

    let messages = [];

    beforeEach(() => {
        const bot = new Router();

        bot.use('text', (req, res) => {
            res.nextOutputConfident((msg, key) => (key === 'text' ? '*m*' : msg));
            res.text('something confident');
        });

        bot.use('button', (req, res) => {
            res.nextOutputConfident((msg, key) => {
                switch (key) {
                    case 'content':
                        return '*c*';
                    case 'title':
                        return '*t*';
                    case 'text':
                        return '*m*';
                    case 'url':
                        return '*u*';
                    default:
                        return msg;
                }
            });
            res.button('something confident')
                .urlButton('title', 'http://link')
                .attachmentButton('attach', {
                    content: '# Heading 1',
                    contentType: 'text/markdown'
                })
                .send();
        });

        t = new Tester(bot);
        messages = [];

        t.senderLogger = {
            log: (a, b) => {
                messages = b;
            }
        };
    });

    it('should work with text message', async () => {
        await t.postBack('text');

        assert.strictEqual(messages[0].message.text, '*m*');
    });

    it('should work with button', async () => {
        await t.postBack('button');

        assert.deepStrictEqual(messages[0].message.attachment.payload, {
            template_type: 'button',
            text: '*m*',
            buttons: [
                {
                    type: 'web_url',
                    title: '*t*',
                    url: '*u*',
                    webview_height_ratio: 'full',
                    messenger_extensions: false
                },
                {
                    type: 'attachment',
                    title: '*t*',
                    payload: {
                        content: '*c*',
                        content_type: 'text/markdown'
                    }
                }
            ]
        });
    });

});
