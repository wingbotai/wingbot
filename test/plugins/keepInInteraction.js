/**
 * @author David Menger
 */
'use strict';

// const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');

describe('Plugins<ai.wingbot.keepInInteraction>', () => {

    /**
     * @type {Tester}
     */
    let t;

    beforeEach(() => {
        const bot = new Router();
        const plugins = new Plugins();

        bot.use('next', (req, res) => {
            res.text('next', [{ title: 'title', action: 'second', match: ['#text'] }]);
            return true;
        }, plugins.getWrappedPlugin('ai.wingbot.keepInInteraction'));

        bot.use('second', (req, res) => {
            res.text('second');
        });

        bot.use((req, res) => {
            res.text('fallback');
        });

        t = new Tester(bot);
    });

    it('should keep context forever', async () => {
        await t.postBack('next');

        t.any().contains('next');

        await t.text('any');

        t.any().contains('next');

        await t.text('any');

        t.any().contains('next');

        await t.text('any');

        t.any().contains('next');

        await t.text('text');

        t.any().contains('second');
    });

});
