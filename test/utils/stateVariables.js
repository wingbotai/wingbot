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

});
