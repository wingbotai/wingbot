/**
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const { Plugins } = require('../index');
const BuildRouter = require('../src/BuildRouter');
const Tester = require('../src/Tester');
const configurationbot = require('./configurationbot.json');

describe('<buildRouterConfiguration>', () => {

    /** @type {Tester} */
    let t;

    beforeEach(() => {
        const plugins = new Plugins();

        plugins.register('exampleBlock', async (req, res) => {
            res.run('responseBlockName');
        });

        plugins.register('routerBlock', (req, res) => {
            res.text('routerBlock');
        });
        const bot = BuildRouter.fromData(configurationbot.data, plugins, {
            allowForbiddenSnippetWords: true,
            configuration: { foo: 'root value' },
            routeConfigs: [
                {
                    path: 'subblock-include',
                    enabled: true,
                    configuration: {
                        foo: 'sub value',
                        bar: 'sasa lele'
                    }
                }
            ]
        });

        t = new Tester(bot);
    });

    describe('#', () => {

        it('should work', async () => {
            await t.postBack('start');

            t.any()
                .contains('This is the first time, you\'re here root value');

            assert.throws(() => {
                t.any().quickReplyTextContains('Nesmi tu byt');
            });

            await t.quickReplyText('Go To Subblock');

            t.any()
                .contains('Want continue sub value');

            assert.deepEqual(
                t.res(0).response.message.attachment.payload.buttons,
                [{
                    type: 'postback',
                    title: 'musi',
                    payload: '{"action":"/subblock-include/deep-entrypoint","data":{"_ca":"/subblock-include"}}'
                }]
            );

            await t.quickReply('back');

            t.any()
                .contains('Deeper sasa lele here');

            await t.intent('globalIntent');

            t.any()
                .contains('Yes, this is the fallback');
        });

    });

});
