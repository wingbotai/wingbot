/**
 * @author David Menger
 */
'use strict';

// const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');

describe('Plugins<ai.wingbot.conditionIfGoBackPossible>', () => {

    /**
     * @type {Tester}
     */
    let t;

    beforeEach(() => {
        const bot = new Router();
        const plugins = new Plugins();

        bot.use('start', (req, res) => { res.text('start'); });

        const condition = plugins.getWrappedPlugin('ai.wingbot.conditionIfGoBackPossible');

        bot.use('ask', (req, res) => {
            // @ts-ignore
            const result = condition(req, res);
            if (result) {
                res.text('possible');
            } else {
                res.text('no way');
            }
        });

        bot.use((req, res) => {
            res.text('fallback');
        });

        t = new Tester(bot);
    });

    it('should know, when the return is possible', async () => {
        await t.postBack('ask');

        t.any().contains('no way');

        await t.postBack('start');

        t.any().contains('start');

        await t.postBack('ask');

        t.any().contains('possible');

        await t.text('any');

        t.any().contains('fallback');

        await t.postBack('ask');

        t.any().contains('no way');
    });

});
