/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Router = require('../src/Router');
const Tester = require('../src/Tester');
const Plugins = require('../src/Plugins');

function pluginFactory () {
    const bot = new Router();

    bot.use('/', (req, res) => {
        res.text('go', [
            {
                action: 'next',
                title: 'hoho'
            }
        ]);
    });

    bot.use('next', (req, res) => {
        res.text(`given ${req.text()}`);
    });

    return bot;
}

const plugins = new Plugins();

plugins.registerFactory('gogo', pluginFactory);

describe('handling late buttons', () => {

    /** @type {Tester} */
    let t;

    beforeEach(() => {
        const bot = new Router();

        bot.use((req, res) => {
            const { _ca: currentAction } = req.actionData();

            if (!currentAction) {
                return Router.CONTINUE;
            }

            const isSame = currentAction === req.state.lastAction
                || currentAction.indexOf(`${req.state.lastAction}/`) === 0;

            if (!isSame) {
                res.text('ignoring');
                res.text(req.state.lastAction).text(currentAction);
                res.keepPreviousContext(req, false, true);
                res.trackAs(false);
                return Router.END;
            }

            return Router.CONTINUE;
        });

        bot.use('gogo', plugins.getWrappedPlugin('gogo'));

        bot.use('start', (req, res) => {
            res.text('hello', [
                { action: 'next', title: 'next' }
            ]);
        });

        bot.use('next', (req, res) => {
            res.text(`next${req.actionData()._ca}`, [
                { action: 'start', title: 'back' }
            ]);
            res.expected('ex');
        });

        bot.use('ex', (req, res) => {
            res.text(`la:${req.state.lastAction}`, [
                { action: 'start', title: 'back' }
            ]);
        });

        bot.use((req, res) => {
            res.text('fallback', [
                { action: 'start', title: 'start' }
            ]);
        });

        t = new Tester(bot);
    });

    it('should work in nested plugins', async () => {
        await t.postBack('gogo');

        t.any().contains('go');

        await t.quickReplyText('hoho');

        t.any().contains('given hoho');
    });

    it('should work', async () => {
        await t.postBack('start');

        t.any().contains('hello');

        await t.quickReplyText('next');

        t.any().contains('next/start');

        // send it again
        await t.quickReply('next', { _ca: '/start' });

        t.any().contains('ignoring');

        await t.text('any');

        t.any().contains('la:/next');
        assert.strictEqual(t.getState().state.lastAction, '/ex');

        await t.quickReplyText('back');

        t.any().contains('hello');

        await t.text('any');

        t.any().contains('fallback');

        assert.strictEqual(
            t.lastRes().response.message.quick_replies[0].payload,
            '{"action":"/start","data":{"_ca":"/*"}}'
        );

        assert.strictEqual(t.getState().state.lastAction, '/*');

        /**
         * [x] QR v pluginu
         * [x] QR z expected
         * [x] QR ve fallbacku
         * [ ] jak udelat bounce back, kdyz to nechci ignorovat? postback na expected?
         */
    });

});
