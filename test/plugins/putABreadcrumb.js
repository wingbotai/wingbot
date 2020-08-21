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

        bot.use('first', (req, res) => { res.text('first'); return true; }, plugins.getWrappedPlugin('ai.wingbot.putABreadcrumb'));

        bot.use('second', (req, res) => { res.text('second'); return true; }, plugins.getWrappedPlugin('ai.wingbot.putABreadcrumb'));

        bot.use('back', plugins.getWrappedPlugin('ai.wingbot.goToLastBreadcrumb'));

        t = new Tester(bot);
    });

    it('should go to start if no breadcrumb available', async () => {
        t.allowEmptyResponse = true;
        await t.postBack('back');

        t.any().contains('start');

        await t.postBack('first');

        await t.postBack('back');

        t.any().contains('start');
    });

    it('should get user back', async () => {
        t.allowEmptyResponse = true;

        await t.postBack('start');

        t.any().contains('start');

        await t.postBack('first');

        t.any().contains('first');

        await t.postBack('second');

        t.any().contains('second');

        await t.postBack('back');

        t.any().contains('first');

        await t.postBack('back');

        t.any().contains('start');
    });

});
