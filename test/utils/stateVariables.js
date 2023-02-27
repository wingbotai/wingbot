/**
 * @author David Menger
 */
'use strict';

const Tester = require('../../src/Tester');
const Router = require('../../src/Router');
const { vars } = require('../../src/utils/stateVariables');

// const assert = require('assert');

async function tryXtimes (t, times, action = 'try') {
    for (let i = 0; i < times; i++) {
        await t.postBack(action);

        t.any()
            .contains('try hello')
            .contains('msg hello');
    }
}

describe('vars', () => {

    describe('vars.dialogContext()', () => {

        /** @type {Tester} */
        let t;

        beforeEach(() => {
            const r = new Router();
            const a = new Router();
            const b = new Router();

            a.use('set', (req, res) => {
                res.setState(vars.dialogContext('key', 'hello'));
                res.text('set');
            });

            a.use('try', (req, res, postBack) => {
                res.text(`try ${req.state.key || 'empty'}`);
                postBack('msg');
            });

            a.use('msg', (req, res) => { res.text(`msg ${req.state.key || 'empty'}`); });

            b.use('try', (req, res, postBack) => {
                res.text(`try ${req.state.key || 'empty'}`);
                postBack('msg');
            });

            b.use('msg', (req, res) => { res.text(`msg ${req.state.key || 'empty'}`); });

            r.use('a', a);
            r.use('b', b);

            t = new Tester(r);
        });

        it('should retain in dialogue', async () => {
            await t.postBack('a/set');

            await tryXtimes(t, 2, 'a/try');

            await t.postBack('b/try');

            t.any()
                .contains('try hello')
                .contains('msg hello');

            await t.postBack('b/msg');

            t.any()
                .contains('msg empty');
        });

    });

    describe('vars.expiresAfter()', () => {

        /** @type {Tester} */
        let t;

        beforeEach(() => {
            const r = new Router();

            r.use('set', (req, res) => {
                res.setState(vars.expiresAfter('key', 'hello', 3));
                res.text('set');
            });

            r.use('reset', (req, res) => {
                res.setState({ key: 'hello' });
                res.text('reset');
            });

            r.use('try', (req, res, postback) => {
                res.text(`try ${req.state.key || 'empty'}`);
                postback('msg');
            });

            r.use('msg', (req, res) => { res.text(`msg ${req.state.key || 'empty'}`); });

            t = new Tester(r);
        });

        it('should retain variable for few cycles', async () => {
            await t.postBack('set');

            await tryXtimes(t, 3);

            await t.postBack('try');

            t.any()
                .contains('try empty')
                .contains('msg empty');
        });

        it('can be resetted by setstate', async () => {
            await t.postBack('set');

            await tryXtimes(t, 2);

            await t.postBack('reset');

            await tryXtimes(t, 5);
        });

    });

    describe('vars.expiresAfter()', () => {

        /** @type {Tester} */
        let t;

        function wait () {
            return new Promise((r) => { setTimeout(r, 500); });
        }

        beforeEach(() => {
            const root = new Router();

            root.use('start', (req, res) => { res.text('start'); });

            root.use('context', (req, res) => {
                res.text('context')
                    .setState(vars.sessionContext('c', 'foo', null));
            });

            root.use('target', (req, res, postBack) => {
                res.text('target')
                    .setState(vars.sessionContext('t', 'foo', true));
                postBack('bot/hello');
            });

            const bot = new Router();

            bot.use('hello', (req, res) => { res.text('hello'); });

            bot.use('session', (req, res) => {
                res.text('session')
                    .setState(vars.sessionContext('s', 'foo'));
            });

            bot.use('context', (req, res) => {
                res.text('context')
                    .setState(vars.sessionContext('d', 'foo', null));
            });

            root.use('bot', bot);

            t = new Tester(root, undefined, undefined, { sessionDuration: 400 });
        });

        it('cleans variable, when state ends', async () => {
            await t.postBack('bot/session');

            t.stateContains({ s: 'foo' });

            await wait();

            await t.postBack('start');

            t.stateContains({ s: undefined });
        });

        it('cleans variable, when state ends', async () => {
            await t.postBack('bot/context');

            t.stateContains({ d: 'foo' });

            await wait();

            await t.postBack('bot/hello');

            t.stateContains({ d: 'foo' });

            await t.postBack('start');

            t.stateContains({ s: undefined });
        });

        it('is able to use last dialogue path', async () => {
            await t.postBack('target');

            t.stateContains({ t: 'foo' });

            await wait();

            await t.postBack('bot/hello');

            t.stateContains({ t: 'foo' });

            await t.postBack('start');

            t.stateContains({ s: undefined });
        });

        it('somehow works in root', async () => {
            await t.postBack('context');

            t.stateContains({ c: 'foo' });

            await wait();

            await t.postBack('start');

            t.stateContains({ c: 'foo' });

            await t.postBack('bot/hello');

            t.stateContains({ c: undefined });
        });

    });

});
