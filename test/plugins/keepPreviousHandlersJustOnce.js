/**
 * @author David Menger
 */
'use strict';

// const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');

describe('Plugins<ai.wingbot.keepPreviousHandlersJustOnce>', () => {

    /**
     * @type {Tester}
     */
    let t;

    beforeEach(() => {
        const bot = new Router();
        const plugins = new Plugins();

        bot.use('start', (req, res) => {
            res.text('start', [{ title: 'title', action: 'second', match: ['#text'] }])
                .expected('next');
        });

        bot.use('next', (req, res) => {
            res.text('next');
            return true;
        }, plugins.getWrappedPlugin('ai.wingbot.keepPreviousHandlersJustOnce'));

        bot.use('second', (req, res) => {
            res.text('second');
        });

        bot.use((req, res) => {
            res.text('fallback');
        });

        t = new Tester(bot);
    });

    it('should keep context just once and the', async () => {
        await t.postBack('start');

        t.any().contains('start');

        await t.text('any');

        t.any().contains('next');

        await t.text('any');

        t.any().contains('next');

        await t.text('text');

        t.any().contains('fallback');
    });

    it('should keep context', async () => {
        await t.postBack('start');

        t.any().contains('start');

        await t.text('any');

        t.any().contains('next');

        await t.text('text');

        t.any().contains('second');
    });

});
