/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../src/Tester');
const Router = require('../src/Router');
const Plugins = require('../src/Plugins');

describe('Tracking', () => {

    /** @type {Plugins} */
    let plugins;

    /** @type {Router} */
    let bot;

    /** @type {Tester} */
    let t;

    let events = [];

    function assertActions (expectedActions) {
        const actions = t.actions
            .filter((a) => !a.doNotTrack)
            .map((a) => a.action);
        assert.deepStrictEqual(actions, expectedActions);
    }

    beforeEach(() => {
        events = [];

        plugins = new Plugins();

        plugins.register('justfn', (req, res) => {
            res.text('justfn');
        });

        plugins.register('fnWithItem', async (req, res) => {
            await res.run('item');
        });

        plugins.registerFactory('router', () => {
            const r = new Router();

            r.use('/', (req, res) => {
                res.text('router');
            });

            return r;
        });

        plugins.registerFactory('routerWithItem', () => {
            const r = new Router();

            r.use('/', async (req, res) => {
                await res.run('item');
            });

            return r;
        });

        bot = new Router();

        t = new Tester(bot);

        t.processor.on('event', (senderId, action) => {
            events.push(action);
        });
    });

    describe('Processor tracking', () => {

        it('should emit event when using a plugin with', async () => {
            bot.use('go', plugins.getWrappedPlugin('justfn'));

            await t.postBack('go');

            assertActions([
                '/go'
            ]);

            assert.deepStrictEqual(events, [
                '/go'
            ]);
        });

        it('should emit event when using a plugin with', async () => {
            bot.use('go', plugins.getWrappedPlugin('fnWithItem', {}, {
                item: (req, res) => res.text('go')
            }));

            await t.postBack('go');

            assertActions([
                '/go'
            ]);

            assert.deepStrictEqual(events, [
                '/go'
            ]);
        });

        it('should emit event when using a plugin with', async () => {
            bot.use('go', plugins.getWrappedPlugin('router'));

            await t.postBack('go');

            assertActions([
                '/go'
            ]);

            assert.deepStrictEqual(events, [
                '/go'
            ]);
        });

        it('should emit event when using a plugin with', async () => {
            bot.use('go', plugins.getWrappedPlugin('routerWithItem', {}, {
                item: (req, res) => res.text('go')
            }));

            await t.postBack('go');

            assertActions([
                '/go'
            ]);

            assert.deepStrictEqual(events, [
                '/go'
            ]);
        });

    });

});
