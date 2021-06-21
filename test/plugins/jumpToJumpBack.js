/**
 * @author David Menger
 */
'use strict';

// const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');

describe('Plugins<ai.wingbot.jumpTo> / Plugins<ai.wingbot.jumpBack>', () => {

    /**
     * @type {Tester}
     */
    let t;

    beforeEach(() => {
        const bot = new Router();
        const plugins = new Plugins();

        bot.use(
            'start',
            plugins.getWrappedPlugin('ai.wingbot.jumpTo', {
                whereToJump: 'next',
                whereToJumpBack: 'end'
            })
        );

        bot.use('next', (req, res) => { res.text('next', { goback: 'goback' }); });

        bot.use('goback', plugins.getWrappedPlugin('ai.wingbot.jumpBack'), (req, res) => {
            res.text('no way');
        });

        bot.use('end', (req, res) => { res.text('end'); });

        bot.use((req, res) => {
            res.text('fallback');
        });

        t = new Tester(bot);
    });

    it('should reply with fallback if empty', async () => {
        t.allowEmptyResponse = true;
        await t.postBack('start');

        t.any().contains('next');

        await t.quickReplyText('goback');

        t.any().contains('end');
    });

});
