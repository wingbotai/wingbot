/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../src/Tester');
const Router = require('../src/Router');

function delay (job) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(job());
        }, 5);
    });
}

describe('Router extended functions', function () {

    it('should proceed deep link into the nested router', async function () {
        const nested = new Router();

        nested.use('/', (req, res) => delay(() => {
            res.text('FIRST');
        }));

        nested.use('deep', (req, res) => delay(() => {
            res.text('DEEP');
        }));

        const r = new Router();

        r.use('/start', (req, res) => {
            res.text('START', {
                'nested/deep': 'Test'
            });
        });

        r.use('nested', nested);

        const t = new Tester(r);

        await t.postBack('/start');

        t.any()
            .contains('START');

        await t.quickReply('nested/deep');

        t.passedAction('deep');

        t.res(0).contains('DEEP');
    });

    it('should be able to use array as OR condition', async function () {

        const nested = new Router();

        nested.use((req, res) => res.text('SHOULD PROCESS'));

        const music = new Router();

        music.use(['play', /^play$/], (req, res) => {
            res.text('PLAYING');
            res.expected('expectedTest');
        });

        music.use('/', (req, res) => {
            res.text('Listen to the music!', {
                back: 'Go back',
                play: 'Play'
            }).expected('./'); // stay in this router
        });

        music.use('expectedTest', /^start$/, (req, res) => {
            res.text('START TEST');
            res.expected('expectedTest');
        });

        music.use('expectedTest', /^stop$/, (req, res) => {
            res.text('STOP TEST');
            res.expected('expectedTest');
        });

        music.use('/back', (r, s, postBack) => postBack('/start'));

        const goThru = new Router();

        goThru.use('/start', (req, res) => {
            res.text('Go thru');
            return Router.CONTINUE;
        });

        const r = new Router();

        r.use(goThru);

        r.use('/start', (req, res) => {
            res.text('Hello!', {
                music: {
                    title: 'Listen music'
                },
                read: 'Read books'
            });
        });

        r.use('/music', music);

        const t = new Tester(r);

        await t.postBack('/start');
        await t.quickReply('music');

        t.passedAction('/music')
            .any()
            .contains('Listen')
            .quickReplyAction('play');

        await t.text('play');

        t.any()
            .contains('PLAY');
        t.passedAction('play');

        await t.text('stop');

        assert.strictEqual(t.responses.length, 1);
        t.any()
            .contains('stop test');

        await t.text('start');

        assert.strictEqual(t.responses.length, 1);
        t.any()
            .contains('start test');
    });

    it('should match the text from quick reply', async function () {
        const r = new Router();

        r.use('/start', (req, res) => {
            res.text('START', {
                rt: 'Test'
            });
            res.expected('fallback');
        });

        r.use('rt', (req, res) => {
            res.text('DEEP');
            res.expected('fallback');
        });

        r.use('fallback', (req, res) => {
            res.text('FB');
        });

        const t = new Tester(r);

        await t.postBack('/start');

        t.any()
            .contains('START');

        await t.text('test');

        t.passedAction('rt');

        t.res(0).contains('DEEP');

        await t.text('test');

        t.passedAction('fallback');

        await t.postBack('/start');

        t.any()
            .contains('START');

        await t.text('test test');

        t.passedAction('fallback');
    });

});
