/*
 * @author David Menger
 */
'use strict';

const { Tester, ai } = require('../index');
const BuildRouter = require('../src/BuildRouter');
const Blocks = require('../src/Blocks');
const testbot = require('./testbot.json');

describe('<BuildRouter>', function () {

    it('should behave as router', async function () {
        const blocks = new Blocks();

        blocks.code('exampleBlock', async (req, res) => {
            await res.run('responseBlockName');
        });

        const bot = BuildRouter.fromData(testbot.data, blocks);

        const t = new Tester(bot);

        await t.postBack('/start');

        t.passedAction('start');

        t.any()
            .genericTemplate(2)
            .contains('This is the first time, you\'re here')
            .attachmentType('image');

        await t.postBack('/start');

        t.passedAction('start');

        t.any()
            .contains('This is your 1 visit')
            .quickReplyAction('subblock-include')
            .contains('Welcome in the bot');

        await t.quickReply('subblock-include');

        t.passedAction('subblock-include');

        t.any()
            .buttonTemplate('text', 3)
            .contains('Want continue?')
            .quickReplyAction('back');

        await t.quickReply('back');

        t.passedAction('back');
        t.passedAction('continued-action');

        t.any()
            .contains('Lets try to go deeper')
            .quickReplyAction('deep-entrypoint');

        await t.quickReply('deep-entrypoint');

        t.passedAction('deep-entrypoint');

        t.any()
            .contains('Can go outside')
            .quickReplyAction('back');

        await t.quickReply('back');

        t.passedAction('back');
        t.passedAction('continued-action');

        await t.postBack('subblock-include');

        t.passedAction('subblock-include');

        ai.mockIntent('localIntent');

        await t.text('anytext');

        t.any().contains('This is local AI reaction');
    });

    it('should return translated messages', async function () {
        const blocks = new Blocks();

        blocks.code('exampleBlock', async (req, res) => {
            await res.run('responseBlockName');
        });

        const bot = BuildRouter.fromData(testbot.data, blocks);

        const t = new Tester(bot);

        t.setState({ lang: 'cz' });

        await t.postBack('/start');

        t.passedAction('start');

        t.any()
            .contains('To je poprvé');

    });

});
