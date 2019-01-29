/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../src/Tester');
const Router = require('../src/Router');
const Ai = require('../src/Ai');

const { ai } = Ai;

describe('<Router> logic', () => {

    describe('GLOBAL INTENTS', () => {

        it('should pass global intent deeply', async () => {
            const nested = new Router();

            // @ts-ignore
            nested.use(['has-path', ai.globalMatch('foo')], (req, res) => {
                res.text('foo text');
            });

            // @ts-ignore
            nested.use(['has-tag', ai.globalMatch('#tag')], (req, res) => {
                res.text('tag text');
            });

            const bot = new Router();

            bot.use('include', nested);

            bot.use((req, res) => {
                res.text('fallback');
            });

            const t = new Tester(bot);

            await t.intent('foo', 'txt');

            t.any()
                .contains('foo text');

            await t.intent('foo', 'text', 0.5);

            t.any()
                .contains('fallback');

            await t.intent('foo', 'tag', 0.5);

            t.any()
                .contains('tag text');

            await t.text('tag');

            t.any()
                .contains('tag text');
        });

        it('globalizes intent behind the asterisk router', async () => {
            const subNested = new Router();

            // @ts-ignore
            subNested.use(['has-path', ai.globalMatch('foo')], (req, res) => {
                res.text('foo text');
            });

            // @ts-ignore will be ignored
            subNested.use(['has-another-path', ai.globalMatch('foo')], (req, res) => {
                res.text('foo text');
            });

            const nested = new Router();

            nested.use('include', subNested);

            const bot = new Router();

            bot.use(nested);

            const t = new Tester(bot);

            await t.intent('foo');

            t.any()
                .contains('foo text');
        });

        it('makes right bookmark, when there\'s expected action', async () => {
            const nested = new Router();

            // @ts-ignore
            nested.use(['has-path', ai.globalMatch('foo')], (req, res) => {
                res.text('foo text');
            });

            const bot = new Router();

            bot.use('start', (req, res) => {
                res.text('prompt')
                    .expected('prompt');
            });

            bot.use('prompt', async (req, res, postBack) => {
                res.text(`BM ${res.bookmark()}`);
                await res.runBookmark(postBack);
            });

            bot.use('include', nested);

            const t = new Tester(bot);

            await t.postBack('start');

            await t.intent('foo');

            t.any()
                .contains('BM /include/has-path')
                .contains('foo text');
        });

    });

    describe('LOCAL FALLBACKS', () => {

        /** @type {Tester} */
        let t;

        beforeEach(() => {

            const nested = new Router();

            nested.use('/', (req, res) => {
                res.text('base action');
            });

            nested.use('/foo', (req, res) => {
                res.text('foo action');
            });

            // @ts-ignore
            nested.use(['another', ai.globalMatch('another')], (req, res) => {
                res.text('another');
            });

            // @ts-ignore
            nested.use(['local-intent', ai.match('local-intent')], (req, res) => {
                res.text('local intent');
            });

            nested.use((req, res) => {
                // there should be a bookmark executed
                res.text('local fallback');
            });

            const withGlobalIntent = new Router();

            // @ts-ignore
            withGlobalIntent.use(['g-int', ai.globalMatch('g-int')], (req, res) => {
                res.text('global intent');
                res.expected('test');
            });

            withGlobalIntent.use('test', (req, res) => {
                res.text(req.text()); // echo
            });

            const bot = new Router();

            bot.use('/start', (req, res) => {
                res.text('start action');
            });

            bot.use('/nested', nested);

            bot.use('/with', withGlobalIntent);

            bot.use((req, res) => {
                res.text('global fallback');
            });

            t = new Tester(bot);

        });

        it('shold not fall into the global fallback', async () => {
            await t.postBack('with/g-int');

            t.any().contains('global intent');

            await t.text('fafafa');

            t.any().contains('fafafa');
        });

        it('shold not fall into the global fallback even there is a global intent', async () => {
            await t.postBack('with/g-int');

            t.any().contains('global intent');

            await t.intent('another', 'fafafa');

            t.any().contains('fafafa');
        });

        it('should prefer a local fallback', async () => {

            await t.postBack('/nested');

            t.any().contains('base action');
            assert.strictEqual(t.responses.length, 1, 'one response');

            await t.intent('random-intent', 'random text');

            t.any().contains('local fallback');
            assert.strictEqual(t.responses.length, 1, 'one response');

            // now it keeps the context
            await t.intent('random-intent', 'random text');

            t.any().contains('local fallback');
            assert.strictEqual(t.responses.length, 1, 'one response');

            // but the global intent should be called before :)
            await t.intent('g-int', 'g text');

            t.any().contains('global intent');
            assert.strictEqual(t.responses.length, 1, 'one response');

            // context should be swithed to the global intent
            await t.intent('rand-int', 'rand');

            t.any().contains('rand');
            assert.strictEqual(t.responses.length, 1, 'one response');

        });

    });

});
