/**
 * @author David Menger
 */
'use strict';

const { Plugins, Tester } = require('../..');
const BuildRouter = require('../../src/BuildRouter');
const Router = require('../../src/Router');
const { plugin } = require('../../src/resolvers');

describe('<notLastMessage>', () => {

    it('should work', async () => {
        const plugins = new Plugins();

        plugins.registerFactory('plug', () => async (req, res) => {
            await res.run('first');
            await res.run('second');
        }, { notLastMessageItems: ['first'] });

        const bot = new Router();

        bot.use('run', (req, res) => {
            res.quickReply({
                title: 'added',
                action: 'run'
            });
            return true;
        }, plugin({
            codeBlockId: 'plug',
            items: {
                first: {
                    resolvers: [
                        { type: 'botbuild.message', params: { text: 'first' } }
                    ]
                },
                second: {
                    resolvers: [
                        { type: 'botbuild.message', params: { text: 'second' } }
                    ]
                }
            }
        // @ts-ignore
        }, { router: new BuildRouter({ routes: [] }) }, plugins));

        const t = new Tester(bot);

        await t.postBack('run');

        // t.debug();

        t.res(1).quickReplyAction('run');
    });

});
