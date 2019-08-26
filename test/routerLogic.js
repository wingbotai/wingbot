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

        it('should pass global without a path', async () => {
            const nested = new Router();

            nested.use((req, res) => {
                res.text('been there');
                return Router.CONTINUE;
            });

            // @ts-ignore
            nested.use(ai.globalMatch('foo'), (req, res) => {
                res.text('foo text');
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

        it('makes right bookmark from a global intent, when there\'s expected action', async () => {
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

        it('makes right bookmark from a local intent, when there\'s expected action before the expected action', async () => {
            const nested = new Router();

            // @ts-ignore
            nested.use(['has-path', ai.localMatch('foo')], (req, res) => {
                res.text('foo text');
            });

            nested.use('prompt', async (req, res, postBack) => {
                res.text(`BM ${res.bookmark()}`);
                await res.runBookmark(postBack);
            });


            const bot = new Router();

            bot.use('start', (req, res) => {
                res.text('prompt')
                    .expected('include/prompt');
            });
            bot.use('include', nested);

            bot.use((req, res) => {
                res.expected('expected');
                res.text(res.bookmark() ? 'Bookmark' : 'Fallback');
            });

            const t = new Tester(bot);

            await t.postBack('start');

            await t.intent('foo');

            t.any()
                .contains('BM /include/has-path')
                .contains('foo text');

            await t.intent('foo');

            t.any()
                .contains('foo text');

            await t.text('random');

            t.any().contains('Fallback');

            await t.intent('foo');

            t.any().contains('Fallback');
        });

        it('makes right bookmark from a local intent, when there\'s expected action after the expected action', async () => {
            const nested = new Router();

            nested.use('prompt', async (req, res, postBack) => {
                res.text(`BM ${res.bookmark()}`);
                await res.runBookmark(postBack);
            });

            // @ts-ignore
            nested.use(['has-path', ai.localMatch('foo')], (req, res) => {
                res.text('foo text');
            });


            const bot = new Router();

            bot.use('start', (req, res) => {
                res.text('prompt')
                    .expected('include/prompt');
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

    describe('RESPONDERS', () => {
        /** @type {Tester} */
        let t;

        beforeEach(() => {
            const first = new Router();

            // @ts-ignore
            first.use(['glob', ai.globalMatch('glob')], (req, res) => {
                res.text('glob match');
            });

            const second = new Router();

            second.use('/', (req, res) => {
                res.text('Ask me')
                    .expected('asked');
            });

            // @ts-ignore
            second.use('asked', ai.match('glob'), async (req, res, postBack) => {
                res.text('asked');
                if (res.bookmark()) {
                    await res.runBookmark(postBack);
                }
            });

            // @ts-ignore
            second.use(['glob', ai.localMatch('glob')], (req, res) => {
                res.text('local match');
            });

            const bot = new Router();

            bot.use('/first', first);

            bot.use('/second', second);

            bot.use((req, res) => {
                res.text('fallback');
            });

            t = new Tester(bot);
        });

        it('should not be confused when using responders', async () => {
            await t.postBack('second');

            t.any().contains('Ask me');

            await t.intent('glob', 'glob');

            t.any()
                .contains('asked')
                .contains('local match');
        });
    });

    it('should trigger right actions, when there is a postback in responder', async () => {
        const bot = new Router();

        const collector = [];

        bot.use('a', (req, res) => {
            res.text('ask')
                .expected('b');
        });

        // @ts-ignore
        bot.use('b', ai.match('int'), (req, res, postBack) => {
            postBack('c');
        });

        bot.use('c', (req, res) => {
            res.text('answer');
        });

        bot.on('action', (a, path) => {
            collector.push(path);
        });

        const t = new Tester(bot);

        await t.postBack('a');

        t.passedAction('a');

        await new Promise(r => setTimeout(r, 10));

        assert.deepEqual(collector, ['/a']);

        await t.intent('int');

        await new Promise(r => setTimeout(r, 10));

        assert.deepEqual(collector, ['/a', '/b', '/c']);
    });

    describe('LOCAL FALLBACKS', () => {

        /** @type {Tester} */
        let t;

        beforeEach(() => {

            const first = new Router();

            // @ts-ignore
            first.use(['f-global', ai.globalMatch('f-global')], (req, res) => {
                res.text('global f intent globally');
            });

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
            nested.use(['local-intent', ai.localMatch('local-intent')], (req, res) => {
                res.text('local intent');
            });

            // @ts-ignore
            nested.use(['nested-simple', ai.globalMatch(['simple-intent'])], (req, res) => {
                res.text('simple intent');
            });

            // @ts-ignore
            nested.use(['nested-hard', ai.globalMatch(['simple-intent', '@hard'])], (req, res) => {
                res.text('hard intent');
            });

            // @ts-ignore
            nested.use(['f-global-locally', ai.localMatch('f-global')], (req, res) => {
                res.text('f global intent locally');
            });

            // @ts-ignore
            nested.use(['g-global-locally', ai.localMatch('g-int')], (req, res) => {
                res.text('g global intent locally');
            });

            nested.use((req, res) => {
                // there should be a bookmark executed
                res.text('local fallback');
            });

            const withGlobalIntent = new Router();

            // @ts-ignore
            withGlobalIntent.use(['g-int', ai.globalMatch('g-int')], (req, res) => {
                res.text('global intent globally');
            });

            // @ts-ignore
            withGlobalIntent.use(['g-int-with-entity', ai.globalMatch(['g-int', '@entity'])], (req, res) => {
                res.text('with entity');
            });

            // @ts-ignore
            withGlobalIntent.use(['ex-int', ai.globalMatch('ex-int')], (req, res) => {
                res.text('ex intent globally');
                res.expected('test');
            });

            withGlobalIntent.use('test', (req, res) => {
                res.text(req.text()); // echo
            });

            const bot = new Router();

            bot.use('/start', (req, res) => {
                res.text('start action');
            });

            bot.use('/first', first);

            bot.use('/nested', nested);

            bot.use('/with', withGlobalIntent);

            bot.use((req, res) => {
                res.text('global fallback');
            });

            t = new Tester(bot);

        });

        it('should prefer exact match', async () => {
            await t.postBack('/start');

            await t.intentWithEntity('simple-intent', 'hard', 'v', 'abc', 1);

            t.passedAction('nested-hard');

            await t.postBack('/start');

            await t.intentWithEntity('simple-intent', 'hard', 'v', 'abc', 1);

            t.passedAction('nested-hard');
        });

        it('should not fall into the global fallback', async () => {
            await t.postBack('with/ex-int');

            t.any().contains('ex intent globally');

            await t.text('fafafa');

            t.any().contains('fafafa');
        });

        it('should prefer local intent before the global one', async () => {
            await t.postBack('/nested/foo');

            t.passedAction('nested/foo');
            t.any().contains('foo action');

            await t.intent('g-int', 'g text');

            t.passedAction('g-global-locally');
            t.any().contains('g global intent locally');

            // should work without the postback
            // await t.postBack('/nested/foo');

            await t.intent('f-global', 'f text');

            t.passedAction('f-global-locally');
            t.any().contains('f global intent locally');
        });

        it('should not fall into the global fallback even there is a global intent', async () => {
            await t.postBack('with/ex-int');

            t.any().contains('ex intent globally');

            await t.intent('another', 'fafafa');

            t.any().contains('fafafa');
        });

        it('should prefer a local fallback', async () => {

            await t.postBack('/nested');

            t.passedAction('nested');
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
            await t.intent('ex-int', 'x text');

            t.any().contains('ex intent globally');
            assert.strictEqual(t.responses.length, 1, 'one response');

            // context should be swithed to the global intent
            await t.intent('rand-int', 'rand');

            t.any().contains('rand');
            assert.strictEqual(t.responses.length, 1, 'one response');

        });

        it('intent with entity should win', async () => {
            await t.intentWithEntity('g-int', 'entity');

            t.passedAction('g-int-with-entity');
        });

    });

});
