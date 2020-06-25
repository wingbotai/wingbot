/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Tester = require('../src/Tester');
const Router = require('../src/Router');
const Ai = require('../src/Ai');

const { ai } = Ai;

describe('<Router> logic', () => {

    describe('GLOBAL INTENTS', () => {

        it('should pass global intent deeply', async () => {
            const nested = new Router();

            // @ts-ignore
            nested.use(ai.global('has-path', 'foo'), (req, res) => {
                res.text('foo text');
            });

            // @ts-ignore
            nested.use(ai.global('has-tag', '#tag'), (req, res) => {
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
            subNested.use(ai.global('has-path', 'foo'), (req, res) => {
                res.text('foo text');
            });

            // @ts-ignore will be ignored
            subNested.use(ai.global('has-another-path', 'foo'), (req, res) => {
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
            nested.use(ai.global('has-path', 'foo'), (req, res) => {
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
            nested.use(ai.local('has-path', 'foo'), (req, res) => {
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
            nested.use(ai.local('has-path', 'foo'), (req, res) => {
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
            first.use(ai.global('glob', 'glob'), (req, res) => {
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
            second.use(ai.local('glob', 'glob'), (req, res) => {
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
            res.trackAsSkill('skill');
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

        await new Promise((r) => setTimeout(r, 10));

        assert.deepEqual(collector, ['/a']);

        await t.intent('int');

        await new Promise((r) => setTimeout(r, 10));

        assert.deepEqual(collector, ['/a', '/b', '/c']);
    });

    it('should be able to override tracking', async () => {
        const bot = new Router();

        const actions = [];
        const skills = [];
        const lastActions = [];

        bot.use('a', (req, res) => {
            res.text('ask')
                .trackAs('x')
                .expected('b');
        });

        // @ts-ignore
        bot.use('b', ai.match('int'), (req, res, postBack) => {
            res.trackAs('y');
            res.trackAsSkill('skill');
            postBack('c');
        });

        bot.use('c', (req, res) => {
            res
                .trackAs('z')
                .text('answer');
        });

        bot.use('after-async', (req, res) => {
            res.trackAs('hello');
        });

        bot.use((req, res, postback) => {
            res.trackAs(false);
            postback('after-async', async () => {
                await new Promise((r) => setTimeout(r, 100));
                return {};
            });
        });

        bot.on('action', (a, path, text, req, lastAction, doNotTrack, trackingSkill) => {
            actions.push(path);
            skills.push(trackingSkill);
            lastActions.push(lastAction);
        });

        const t = new Tester(bot);
        t.allowEmptyResponse = true;

        const procActions = [];
        const procLastActions = [];
        t.processor.on('event', (sender, path, text, req, lastAction) => {
            procActions.push(path);
            procLastActions.push(lastAction);
        });

        await t.postBack('a');

        t.passedAction('x');

        await new Promise((r) => setTimeout(r, 10));

        assert.deepEqual(actions, ['/x']);
        assert.deepEqual(skills, [null]);

        await t.intent('int');

        await new Promise((r) => setTimeout(r, 10));

        assert.deepEqual(actions, ['/x', '/y', '/z']);
        assert.deepEqual(skills, [null, 'skill', 'skill']);
        assert.deepEqual(lastActions, [null, '/x', '/y']);

        await t.text('random');
        t.passedAction('hello');
        await new Promise((r) => setTimeout(r, 100));

        assert.deepEqual(actions, ['/x', '/y', '/z', '/hello']);
        assert.deepEqual(skills, [null, 'skill', 'skill', 'skill']);
        assert.deepEqual(lastActions, [null, '/x', '/y', '/z']);
    });

    describe('LOCAL FALLBACKS', () => {

        /** @type {Tester} */
        let t;

        beforeEach(() => {

            const first = new Router();

            // @ts-ignore
            first.use(ai.global('f-global', 'f-global'), (req, res) => {
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
            nested.use(ai.global('another', 'another'), (req, res) => {
                res.text('another');
            });

            // @ts-ignore
            nested.use(ai.local('local-intent', 'local-intent'), (req, res) => {
                res.text('local intent');
            });

            // @ts-ignore
            nested.use(ai.global('nested-simple', ['simple-intent']), (req, res) => {
                res.text('simple intent');
            });

            // @ts-ignore
            nested.use(ai.global('nested-hard', ['simple-intent', '@hard']), (req, res) => {
                res.text('hard intent');
            });

            // @ts-ignore
            nested.use(ai.local('f-global-locally', 'f-global'), (req, res) => {
                res.text('f global intent locally');
            });

            // @ts-ignore
            nested.use(ai.local('g-global-locally', 'g-int'), (req, res) => {
                res.text('g global intent locally');
            });

            nested.use((req, res) => {
                // there should be a bookmark executed
                res.text('local fallback');
            });

            const withGlobalIntent = new Router();

            // @ts-ignore
            withGlobalIntent.use(ai.global('g-int', 'g-int'), (req, res) => {
                res.text('global intent globally');
            });

            // @ts-ignore
            withGlobalIntent.use(ai.global('g-int-with-entity', ['g-int', '@entity']), (req, res) => {
                res.text('with entity');
            });

            // @ts-ignore
            withGlobalIntent.use(ai.global('ex-int', 'ex-int'), (req, res) => {
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

    describe('back pattern', () => {

        /** @type {Tester} */
        let t;

        beforeEach(() => {
            const bot = new Router();

            const backExistsCondition = (req, res) => {
                const { lastInteraction: l, beforeLastInteraction: b } = req.state;
                const c = l === res.data.lastInteractionSet ? b : l;
                return c && c !== '/*';
            };

            bot.use('start', (req, res, postBack) => {
                res.text('Welcome', {
                    left: 'Left',
                    start: 'Again'
                });
                postBack('afterStart');
            });

            bot.use('afterStart', (req, res) => {
                if (backExistsCondition(req, res)) {
                    res.text('has');
                } else {
                    res.text('not');
                }
                res.text('Lets begin', {
                    dialog: 'Dialog',
                    'second/try': 'secondtry'
                });
            });

            bot.use('dialog', (req, res) => {
                if (backExistsCondition(req, res)) {
                    res.text('has');
                } else {
                    res.text('not');
                }

                res.text('What color do you like', {
                    whatIsColor: 'what is colour'
                });

                res.expected('dialog_responder');
            });

            bot.use('dialog_responder', async (req, res, postBack) => {
                if (res.bookmark()) {
                    await res.runBookmark(postBack);
                    // leave (to continue just comment the following line)
                    if (res.finalMessageSent) {
                        return Router.END;
                    }
                }

                return true;
            });

            bot.use('withexpected', (req, res) => {
                res.text('ex');
                res.expected('bookmarker');
            });

            bot.use('bookmarker', (req, res, postBack) => {
                if (res.bookmark()) {
                    return res.runBookmark(postBack);
                }
                return true;
            });

            bot.use('left', (req, res, postBack) => {
                res.text('left', {
                    right: 'Right'
                });
                res.expected('common');
                postBack('back');
            });

            bot.use('right', (req, res, postBack) => {
                res.text('right');
                postBack('back');
            });

            bot.use('common', (req, res) => {
                res.text('common');
            });

            const first = new Router();

            first.use('try', (req, res) => {
                res.text('Ahoj', {
                    '/second/try': 'to second'
                });
            });

            bot.use('first', first);

            const second = new Router();

            second.use('try', (req, res) => {
                res.text('Ahoj', {
                    '/sub/a': 'to exit'
                });
                res.expected('ex');
            });

            second.use('ex', ai.match('ex'), (req, res, postBack) => postBack('/sub/a'));

            second.use('book', (req, res) => {
                res.text('Book');
                res.expected('bookExpected');
            });

            second.use('bookExpected', (req, res, postBack) => {
                if (res.bookmark()) {
                    return res.runBookmark(postBack);
                }
                return true;
            });

            bot.use('second', second);

            const subrouter = new Router();

            subrouter.use((req, res) => {
                const { lastInteraction } = req.state;
                res.setState({ lastInteraction });
                return true;
            });

            // @ts-ignore
            subrouter.use(ai.global('a', 'aint'), (req, res, postBack) => {
                res.text('A');
                postBack('zpt');
            });

            // @ts-ignore
            subrouter.use(ai.global('b', 'bint'), (req, res, postBack) => {
                res.text('B');
                postBack('zpt');
                res.expected('bokmarking');
            });

            subrouter.use('bokmarking', (req, res, postBack) => {
                if (res.bookmark()) {
                    return res.runBookmark(postBack);
                }
                return true;
            });

            // @ts-ignore
            subrouter.use(ai.global('x', 'xint'), (req, res) => {
                res.text('X');
            });

            subrouter.use('c', (req, res, postBack) => {
                res.text('C');
                postBack('zpt');
            });

            subrouter.use('zpt', (req, res) => {
                res.text('Z', {
                    '/back': 'back quick reply'
                });
                res.expected('bokmarking');
            });

            subrouter.use('toA', (r, s, postBack) => postBack('/sub/a'));

            bot.use('sub', subrouter);

            // @ts-ignore
            bot.use(ai.global('whatIsColor', 'whatIsColor'), (req, res) => {
                if (backExistsCondition(req, res)) {
                    res.text('has');
                } else {
                    res.text('not');
                }
                res.text('It\'s hard to say', {
                    back: 'Back'
                });
            });

            // @ts-ignore
            bot.use(ai.global('back', 'back'), (req, res, postBack) => {
                if (req.state.beforeLastInteraction
                    && req.state.beforeLastInteraction !== '/*'
                    && req.state.beforeLastInteraction !== res.currentAction()) {

                    res.setState({ lastInteraction: null, beforeLastInteraction: null });
                    postBack(req.state.beforeLastInteraction);
                    return null;
                }
                return true;
            }, (req, res) => {
                res.text('No last action :/');
            });

            bot.use((req, res) => {
                if (backExistsCondition(req, res)) {
                    res.text('has', {
                        back: 'back'
                    });
                } else {
                    res.text('not');
                }
                res.text('fallback');
            });

            t = new Tester(bot);
        });

        it('goes from first to second and back', async () => {
            await t.postBack('start');

            await t.postBack('first/try');

            await t.quickReply('second/try');
            t.passedAction('second/try');

            await t.postBack('back');
            t.passedAction('first/try');
        });

        it('goes from first to sub', async () => {
            await t.postBack('start');

            await t.postBack('first/try');

            await t.quickReply('second/try');
            t.passedAction('second/try');

            await t.quickReply('/sub/a');

            await t.quickReply('back');
            t.passedAction('second/try');
        });

        // fuv
        it('goes from second to sub', async () => {
            await t.postBack('start');

            await t.quickReply('second/try');

            await t.quickReply('/sub/a');

            await t.quickReply('back');
            t.passedAction('second/try');
        });

        it('goes from second to sub by intent', async () => {
            await t.postBack('start');

            await t.postBack('second/try');

            await t.intent('ex');

            await t.quickReply('back');
            t.passedAction('second/try');
        });

        it('goes from second to sub by intent and another faq', async () => {
            await t.postBack('start');

            await t.postBack('second/try');

            await t.intent('ex');

            await t.postBack('sub/c');

            await t.quickReply('back');
            t.passedAction('second/try');
        });

        it('goes from second to sub by intent in bookmark and another faq', async () => {
            await t.postBack('start');

            await t.postBack('second/book');

            await t.intent('aint');
            t.passedAction('sub/a');

            await t.postBack('sub/c');

            await t.quickReply('back');
            t.passedAction('second/book');
        });

        it('goes from second to sub by intent in bookmark', async () => {
            await t.postBack('start');

            await t.postBack('second/book');

            await t.intent('aint');
            t.passedAction('sub/a');

            await t.quickReply('back');
            t.passedAction('second/book');
        });

        it('will not crash', async () => {
            await t.postBack('start');

            await t.quickReply('Again');

            await t.quickReply('Left');

            t.any().contains('left');

            await t.quickReply('Right');
        });

        it('skip some actions in back route in expected actions', async () => {

            await t.postBack('start');

            await t.postBack('withexpected');

            await t.postBack('sub/toA');

            await t.intent('back');

            t.passedAction('back');
            t.passedAction('withexpected');
        });

        it('skip some actions in back route', async () => {
            await t.postBack('start');

            await t.postBack('sub/a');

            await t.postBack('sub/b');

            await t.intent('back');

            t.passedAction('back');
            t.passedAction('start');

            await t.postBack('start');

            await t.postBack('sub/a');

            await t.postBack('sub/b');

            await t.postBack('sub/c');

            await t.quickReply('back');

            t.passedAction('back');
            t.passedAction('start');
        });

        it('should not execute back to start twice', async () => {
            await t.postBack('start');

            // t.any().contains('not');

            await t.intent('back');

            t.any().contains('No last action');
        });

        it('is able to get back using the back intent', async () => {
            await t.postBack('start');

            t.passedAction('start');
            t.passedAction('afterStart');
            t.any().contains('not');

            await t.quickReply('Dialog');

            t.passedAction('dialog');

            await t.intent('back');

            t.passedAction('back');
            t.passedAction('afterStart');

            t.any().contains('not');

            await t.intent('back');

            t.any().contains('No last action');
        });

        it('is able to get back using the back postback', async () => {
            await t.postBack('start');

            t.passedAction('start');
            t.passedAction('afterStart');

            await t.quickReply('Dialog');

            t.passedAction('dialog');
            t.any().contains('has');

            await t.postBack('back');

            t.passedAction('back');
            t.passedAction('afterStart');
            t.any().contains('not');
        });

        it('should be able to bring user back by quick reply', async () => {

            await t.postBack('dialog');

            await t.quickReply('what is colour');

            t.passedAction('whatIsColor');

            await t.quickReply('Back');

            t.passedAction('back');
            t.passedAction('dialog');
        });

        it('should be able to bring user back by quick reply after intent', async () => {

            await t.postBack('dialog');
            t.any().contains('not');

            await t.intent('whatIsColor');

            t.passedAction('whatIsColor');
            t.any().contains('has');

            await t.quickReply('Back');

            t.passedAction('back');
            t.passedAction('dialog');
        });

        it('should be able to bring user back by intent after intent', async () => {
            await t.postBack('start');

            await t.postBack('dialog');
            t.any().contains('has');

            await t.intent('whatIsColor');

            t.passedAction('whatIsColor');

            await t.intent('back');

            t.passedAction('back');
            t.any().contains('not');

            await t.intent('back');

            t.any().contains('No last action');
        });

        it('works in fallback', async () => {
            await t.postBack('start');

            t.passedAction('start');
            t.passedAction('afterStart');

            await t.text('random');

            t.any().contains('has');

            await t.quickReply('back');

            t.passedAction('afterStart');
            t.any().contains('not');
        });

        it('ignores fallback', async () => {
            await t.postBack('start');

            t.passedAction('start');
            t.passedAction('afterStart');

            await t.text('random');

            await t.postBack('dialog');

            t.any().contains('not');

            await t.intent('back');

            t.any().contains('No last action');
        });

        it('first bookmark', async () => {
            const bot = new Router();

            bot.use(ai.local('loc', 'int'), (req, res) => {
                res.text('hello');
            });

            bot.use('q', (req, res) => {
                res.text('phone?')
                    .expected('ex');
            });

            bot.use('ex', (req, res) => {
                if (res.bookmark()) {
                    res.text('bookmark');
                }
            });

            const ts = new Tester(bot);

            await ts.postBack('q');

            await ts.intent('int');

            ts.any().contains('bookmark');
        });

    });

    describe('re-expected in fallback', () => {

        /** @type {Tester} */
        let t;

        beforeEach(() => {
            const bot = new Router();

            bot.use('start', (req, res) => {
                res.text('Welcome');
                res.expected('expected');
            });

            bot.use('expected', /keyword/, (req, res) => {
                res.text('received keyword');
            });

            bot.use((req, res) => {
                const expected = req.expected();

                if (expected) {

                    const { action, data = {} } = expected;

                    if (!data._expectedFallbackOccured) {

                        res.expected(action, {
                            ...data,
                            _expectedFallbackOccured: true
                        });
                    }
                }

                res.text('fallback');
            });

            t = new Tester(bot);
        });

        it('is able to re-answer expected actions', async () => {
            await t.postBack('start');

            await t.text('any');

            t.any().contains('fallback');

            await t.text('keyword');

            t.any().contains('keyword');
        });

        it('two fallbacks means just a fallback', async () => {
            await t.postBack('start');

            await t.text('any');

            t.any().contains('fallback');

            await t.text('any');

            t.any().contains('fallback');

            await t.text('keyword');

            t.any().contains('fallback');
        });

    });

    describe('new globals', () => {

        it('works', async () => {
            const bot = new Router();

            const nested = new Router();

            nested.use(ai.global('path', 'intent'), (req, res) => {
                res.text('foo');
                res.expectedIntent('bar', 'next');
            });

            nested.use('next', (req, res) => {
                res.text('gotbar');
            });

            bot.use('nested', nested);

            const t = new Tester(bot);

            await t.intent('intent');

            t.passedAction('nested/path');

            await t.intent('bar');

            t.any().contains('gotbar');
        });

        it('makes bookmarking great again', async () => {
            const nested = new Router();

            // @ts-ignore
            nested.use(ai.global('has-path', 'foo'), (req, res) => {
                res.text('foo text');
            });

            const bot = new Router();

            bot.use('start', (req, res) => {
                res.text('prompt')
                    .expected('prompt');
            });

            bot.use('prompt', async (req, res, postBack) => {
                const a = req.actionByAi();
                res.text(`BM ${a}`);
                await postBack(a, {}, true);
            });

            bot.use('include', nested);

            const t = new Tester(bot);

            await t.postBack('start');

            await t.intent('foo');

            t.any()
                .contains('BM /include/has-path')
                .contains('foo text');
        });

        it('works with full text quick replies', async () => {

            const bot = new Router();

            bot.use('start', (req, res) => {
                res.text('prompt', {
                    next: 'Dlouhý text 1'
                });
            });

            bot.use('next', (req, res) => {
                res.text('ahoj');
            });

            const t = new Tester(bot);

            await t.postBack('start');

            await t.text('dlouhy text 1');

            t.any()
                .contains('ahoj');
        });

    });

    describe('KEEP PREVIOUS CONTEXT', () => {
        let t;

        beforeEach(() => {
            const bot = new Router();

            bot.use('start', (req, res) => {
                res.text('prompt', {
                    next: 'next'
                });
                res.expected('nothing');
            });

            bot.use('next', (req, res) => {
                res.text('yes');
            });

            bot.use('nothing', (req, res) => {
                // @ts-ignore
                res.setState(req.expectedContext(true, true));
                res.text('nothing');
            });

            bot.use('keep', (req, res) => {
                res.text('prompt', {
                    next: 'next'
                });
                res.expected('keep-context');
            });

            bot.use('keep-context', (req, res) => {
                // @ts-ignore
                res.setState(req.expectedContext());
                // @ts-ignore
                res.setState(req.expectedKeywords());
                res.text('still nothing');
            });

            bot.use((req, res) => {
                res.text('fallback');
            });

            t = new Tester(bot);
        });

        it('keeps previous context once', async () => {

            await t.postBack('start');

            await t.text('foo');

            t.any().contains('nothing');

            await t.text('fallback');

            t.any().contains('nothing');

            await t.text('fallback');

            t.any().contains('fallback');
        });

        it('keeps previous context still', async () => {

            await t.postBack('keep');

            await t.text('foo');

            t.any().contains('still nothing');

            await t.text('fallback');

            t.any().contains('still nothing');

            await t.text('fallback');

            t.any().contains('still nothing');

            await t.text('next');

            t.any().contains('yes');
        });

        it('remembers previous value', async () => {

            await t.postBack('start');

            await t.text('foo');

            t.any().contains('nothing');

            await t.text('next');

            t.any().contains('yes');
        });

    });

    describe('LOCAL INTENT REQUEST', async () => {

        let t;

        beforeEach(() => {
            const bot = new Router();

            bot.use(ai.global('start', ['known']), (req, res) => {
                res.text('known intent');
            });

            bot.use((req, res) => {
                // @ts-ignore
                res.text(`${req.intent()} intent`);
            });

            t = new Tester(bot);
        });

        it('works as expected', async () => {
            await t.intent('known');

            t.any()
                .contains('known');

            await t.intent('unknown');

            t.any()
                .contains('unknown');
        });

    });

    describe('CONFIDENTAL REQUESTS FILTERING', () => {

        it('filters confident data in following request', async () => {

            const bot = new Router();

            bot.use('start', (req, res) => {
                // evil question
                res.text('Give me your CARD NUMBER :D')
                    .expected('received-card-number')
                    .expectedConfidentInput();
            });

            bot.use('received-card-number', (req, res) => {
                const cardNumber = req.text();

                // raw card number

                res.text(req.isConfidentInput()
                    ? 'got it'
                    : 'what?')
                    .setState({ cardNumber });
            });

            bot.use((req, res) => {
                res.text(
                    req.isConfidentInput()
                        ? 'confident'
                        : 'ok'
                );
            });

            const t = new Tester(bot);

            const log = sinon.spy();
            t.senderLogger = { log };

            await t.postBack('start');

            assert.strictEqual(log.callCount, 1);

            await t.text('123456789');

            assert.strictEqual(log.callCount, 2);
            assert.deepEqual(log.args[1][2].message, { text: '@CONFIDENT' });
            t.any().contains('got it');

            await t.text('hello');

            assert.strictEqual(log.callCount, 3);
            assert.deepEqual(log.args[2][2].message, { text: 'hello' });
            t.any().contains('ok');
        });

    });

});
