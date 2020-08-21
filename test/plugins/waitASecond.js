/**
 * @author David Menger
 */
'use strict';

// const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');

describe('Plugins<ai.wingbot.waitASecond>', () => {

    /**
     * @type {Tester}
     */
    let t;

    beforeEach(() => {
        const bot = new Router();
        const plugins = new Plugins();

        bot.use('plugin', plugins.getWrappedPlugin('ai.wingbot.waitASecond'));

        t = new Tester(bot);
    });

    it('should send a wait event', async () => {
        t.allowEmptyResponse = true;
        await t.postBack('plugin');

        // no simple assert possible
    });

});
