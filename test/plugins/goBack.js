/**
 * @author David Menger
 */
'use strict';

// const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');

describe('Plugins<ai.wingbot.goBack>', () => {

    /**
     * @type {Tester}
     */
    let t;

    beforeEach(() => {
        const bot = new Router();
        const plugins = new Plugins();

        bot.use('start', (req, res) => { res.text('start'); });

        bot.use('next', (req, res) => { res.text('next'); });

        bot.use('back', plugins.getWrappedPlugin('ai.wingbot.goBack'), (req, res) => {
            res.text('no way');
        });

        bot.use((req, res) => {
            res.text('fallback');
        });

        t = new Tester(bot);
    });

    it('should reply with fallback if empty', async () => {
        t.allowEmptyResponse = true;
        await t.postBack('back');

        t.any().contains('no way');

        await t.postBack('start');

        t.any().contains('start');

        await t.postBack('back');

        t.any().contains('no way');

        await t.postBack('next');

        await t.postBack('back');

        t.any().contains('no way');
    });

    it('should get user back', async () => {
        t.allowEmptyResponse = true;

        await t.postBack('start');

        t.any().contains('start');

        await t.postBack('next');

        t.any().contains('next');

        await t.postBack('back');

        t.any().contains('start');
    });

    it('should work in fallback', async () => {
        t.allowEmptyResponse = true;

        await t.postBack('start');

        t.any().contains('start');

        await t.text('any');

        t.any().contains('fallback');

        await t.postBack('back');

        t.any().contains('start');
    });

    it('should ignore in fallback', async () => {
        t.allowEmptyResponse = true;

        await t.postBack('start');

        t.any().contains('start');

        await t.text('any');

        t.any().contains('fallback');

        await t.postBack('next');

        t.any().contains('next');

        await t.postBack('back');

        t.any().contains('no way');
    });

});
