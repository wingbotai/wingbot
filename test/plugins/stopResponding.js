/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');

describe('Plugins<ai.wingbot.stopResponding>', () => {

    /**
     * @type {Tester}
     */
    let t;

    beforeEach(() => {
        const bot = new Router();
        const plugins = new Plugins();

        bot.use('plugin', plugins.getWrappedPlugin('ai.wingbot.stopResponding'));

        t = new Tester(bot);
    });

    it('should stop responding', async () => {
        t.allowEmptyResponse = true;
        await t.postBack('plugin');

        // @ts-ignore
        assert.strictEqual(t.responses.length, 0);
    });

});
