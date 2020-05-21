/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Ai = require('../src/Ai');
const Router = require('../src/Router');
const Tester = require('../src/Tester');
const Request = require('../src/Request');
const WingbotModel = require('../src/wingbot/WingbotModel');

const DEFAULT_SCORE = 0.96;

function createResponse (intent = 'hello', score = 0.96) {
    return { tags: intent ? [{ intent, score: intent === 'low' ? 0.5 : score }] : [] };
}

function fakeReq (text = 'text') {
    return [
        {
            action () { return null; },
            event: { timestamp: Date.now() },
            text () { return text; },
            isTextOrIntent () { return !!text; },
            intents: null,
            isQuickReply () { return false; },
            isConfidentInput () { return false; }
        },
        {
            bookmark: () => null
        },
        sinon.spy()
    ];
}

let syncRes;

const ai = new Ai();

describe('<Ai>', function () {

    beforeEach(function () {
        syncRes = Promise.resolve(createResponse());

        this.fakeRequest = sinon.spy(() => syncRes);

        const model = new WingbotModel({ model: 'test', request: this.fakeRequest });
        ai.register(model);
    });

    describe('match()', function () {

        it('should use cache for responding requests', async function () {
            const model = new WingbotModel({ model: 'test', request: this.fakeRequest, cacheSize: 1 });
            ai.register(model);

            const mid = ai.match('hello');
            const mid2 = ai.match(['hello']);
            let args = fakeReq();
            let res = await mid(...args);

            assert.ok(this.fakeRequest.calledOnce);
            assert.strictEqual(res, Router.CONTINUE);
            assert.strictEqual(args[0].intents[0].score, DEFAULT_SCORE);

            args = fakeReq();

            await mid2(...args);
            res = await mid(...args);

            assert.ok(this.fakeRequest.calledOnce);
            assert.strictEqual(res, Router.CONTINUE);
            assert.strictEqual(args[0].intents[0].score, DEFAULT_SCORE);

            syncRes = Promise.resolve(createResponse(null));
            args = fakeReq('unknown');
            res = await mid(...args);

            assert.ok(this.fakeRequest.calledTwice);
            assert.strictEqual(res, Router.BREAK);
            assert.deepStrictEqual(args[0].intents, []);
        });

        it('should skip request without texts', async function () {
            const mid = ai.match('hello', 0.1);
            const args = fakeReq(null);
            const res = await mid(...args);

            assert.ok(!this.fakeRequest.called);
            assert.strictEqual(res, Router.BREAK);
            assert.strictEqual(args[0].intents, null);
        });

        it('should skip request when the confidence is low', async function () {
            const mid = ai.match('low');
            const args = fakeReq('low');
            const res = await mid(...args);

            assert.ok(this.fakeRequest.called);
            assert.strictEqual(res, Router.BREAK);
            assert.deepStrictEqual(args[0].intents, [{ intent: 'hello', score: 0.96 }]);
        });

        it('mutes errors', async function () {
            syncRes = Promise.reject(new Error());
            const mid = ai.match('hello', 0.1);
            const args = fakeReq();
            const res = await mid(...args);

            assert.ok(this.fakeRequest.calledOnce);
            assert.strictEqual(res, Router.BREAK);
            assert.deepStrictEqual(args[0].intents, []);
        });

        it('mutes bad responses', async function () {
            syncRes = Promise.resolve({});
            const mid = ai.match('hello', 0.1);
            const args = fakeReq();
            const res = await mid(...args);

            assert.ok(this.fakeRequest.calledOnce);
            assert.strictEqual(res, Router.BREAK);
            assert.deepStrictEqual(args[0].intents, []);
        });

        it('makes able to dispath previously matched intent, when there is an "expected" action', async () => {

            const bot = new Router();

            const steps = [];

            bot.use(ai.local('action-name', 'test-intent'), (req, res) => {
                steps.push(3);
                res.text('Bar');
            });

            bot.use('start', (req, res) => {
                steps.push(1);
                res.text('Started');
                res.expected('expect');
            });

            bot.use('expect', async (req, res, postBack) => {
                if (res.bookmark()) {
                    steps.push(2);
                    await res.runBookmark(postBack);
                    steps.push(4);
                }
                res.text('Foo');
            });

            const t = new Tester(bot);

            await t.postBack('start');

            await t.intent('test-intent', 'Text');

            t.any()
                .contains('Bar')
                .contains('Foo');

            assert.deepEqual(steps, [1, 2, 3, 4]);
        });

        it('works in "expected" with entity', async () => {

            const bot = new Router();

            bot.use('start', (req, res) => {
                res.text('Started');
                res.expected('expect');
            });

            bot.use(ai.global('path', ['in']), (req, res) => {
                res.text('path');
            });

            bot.use('expect', ai.match(['@En=Ah']), async (req, res) => {
                res.text('yes');
            });

            bot.use('expect', async (req, res) => {
                res.text('no');
            });

            const t = new Tester(bot);

            await t.postBack('start');

            await t.intentWithEntity('in', 'En', 'Ah', 'Ahoj');

            t.any()
                .contains('yes');
        });

        it('supports regexes', async () => {
            const bot = new Router();

            // @ts-ignore
            bot.use(ai.match('#word-match|foo-match'), (req, res) => {
                res.text('Full match');
            });

            // @ts-ignore
            bot.use(ai.match('#😀😃😄'), (req, res) => {
                res.text('Emoji match');
            });

            // @ts-ignore
            bot.use(ai.match('#keyword#'), (req, res) => {
                res.text('Keyword match');
            });

            // @ts-ignore
            bot.use(ai.match('#f[au]n[ck]y|bar'), (req, res) => {
                res.text('Fancy funky match');
            });

            // @ts-ignore
            bot.use((req, res) => {
                res.text('nothing');
            });

            const t = new Tester(bot);

            await t.text('Word matčh');
            t.res(0).contains('Full match');

            await t.text('Not Word matčh');
            t.res(0).contains('nothing');

            await t.text('😃😄😃😄😃😄');
            t.res(0).contains('Emoji match');

            await t.text('😃😄😃😄😃😄.');
            t.res(0).contains('nothing');

            await t.text('😃😎');
            t.res(0).contains('nothing');

            await t.text('keyword in between');
            t.res(0).contains('Keyword match');

            await t.text('funky');
            t.res(0).contains('Fancy funky match');
            await t.text('fancy');
            t.res(0).contains('Fancy funky match');
            await t.text('bar');
            t.res(0).contains('Fancy funky match');
            await t.text('funky bar');
            t.res(0).contains('nothing');
        });

        it('single entity makes a match');

    });

    describe('mockIntent', function () {

        it('should mock all intents', () => {
            const testAi = new Ai();

            testAi.mockIntent('testIntent');

            const match = testAi.match('testIntent');

            const req = {
                isTextOrIntent: () => true,
                isQuickReply: () => false,
                action: () => null,
                event: { timestamp: Date.now() }
            };

            return match(req, { bookmark: () => null })
                .then((res) => {
                    assert.strictEqual(res, Router.CONTINUE);
                    const { intent, score } = req.intents[0];

                    assert.strictEqual(intent, 'testIntent');
                    assert.strictEqual(score, ai.confidence);
                });
        });

        it('should mock mock intent with request', () => {
            const testAi = new Ai();

            testAi.mockIntent();

            const match = testAi.match('testIntent');

            const event = Request.intentWithText('any', 'hoho', 'testIntent');
            const req = {
                isTextOrIntent: () => true, isQuickReply: () => false, event, action: () => null
            };

            return match(req, { bookmark: () => null })
                .then((res) => {
                    assert.strictEqual(res, Router.CONTINUE);
                    const { intent, score } = req.intents[0];

                    assert.strictEqual(intent, 'testIntent');
                    assert.strictEqual(score, 1);
                });
        });

    });

});
