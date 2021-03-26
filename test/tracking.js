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
    let interactions = [];
    let sequence = [];
    let trackings = [];

    function assertActions (expectedActions) {
        const actions = t.actions
            .filter((a) => !a.doNotTrack)
            .map((a) => a.action);
        assert.deepStrictEqual(actions, expectedActions);
    }

    beforeEach(() => {
        events = [];
        interactions = [];
        sequence = [];
        trackings = [];

        plugins = new Plugins();

        plugins.register('justfn', (req, res) => {
            res.text('justfn');
            res.trackEvent('abc', 'cat', 'act');
        });

        plugins.register('redir', (req, res, postback) => {
            postback('goto');
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

        bot.on('action', () => {
            sequence.push('router-action');
        });

        bot.use('goto', (req, res) => {
            res.text('goto');
        });

        t = new Tester(bot);

        t.processor.on('event', (senderId, action) => {
            events.push(action);
            sequence.push('processor-event');
        });

        t.processor.on('interaction', ({ actions, lastAction, tracking }) => {
            interactions.push({ actions, lastAction });
            sequence.push('processor-interaction');
            trackings.push(tracking);
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

            assert.deepStrictEqual(trackings, [{
                events: [
                    {
                        type: 'abc',
                        category: 'cat',
                        action: 'act',
                        label: '',
                        value: 0
                    }
                ]
            }]);
        });

        it('should emit right processor events in right order', async () => {
            bot.use('go', plugins.getWrappedPlugin('redir'));

            await t.postBack('go');

            assertActions([
                '/go',
                '/goto'
            ]);

            assert.deepStrictEqual(events, [
                '/go'
            ]);

            assert.deepStrictEqual(interactions, [
                { actions: ['/go', '/goto'], lastAction: null }
            ]);

            assert.deepStrictEqual(sequence, [
                'router-action',
                'processor-event',
                'router-action',
                'processor-interaction'
            ]);

            interactions = [];

            await t.postBack('goto');

            assert.deepStrictEqual(interactions, [
                { actions: ['/goto'], lastAction: '/goto' }
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
