/**
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const { Router, Tester } = require('../..');
const button = require('../../src/resolvers/button');
const MemoryChatLogStorage = require('../../src/tools/MemoryChatLogStorage');

describe('<button>', () => {

    describe('#', () => {

        it('should work', async () => {

            let trans;

            const bot = new Router();

            bot.use(/trans/, async (req, res) => {
                res.text('something');

                trans = await res.getTranscript();
            });

            bot.use(button({
                buttons: [
                    {
                        title: 'hello',
                        action: {
                            type: 'web_url_extension',
                            url: '{{{enco}}}'
                        }
                    }
                ],
                text: 'abc'
            }, {}));

            const t = new Tester(bot);

            t.senderLogger = new MemoryChatLogStorage();

            t.setState({ enco: 'http://www.seznam.cz?neco=x&foo=bar' });

            await t.text('x');

            t.debug();

            t.any().buttonTemplate('abc', 1);

            await t.text('trans');

            assert.deepStrictEqual(trans, [
                { fromBot: false, text: 'x' },
                { fromBot: true, text: 'abc' },
                { fromBot: false, text: 'trans' },
                { fromBot: true, text: 'something' }
            ]);

        });

    });

});
