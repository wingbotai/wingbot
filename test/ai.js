/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Ai = require('../src/Ai');
const Router = require('../src/Router');
const Request = require('../src/Request');
const WingbotModel = require('../src/wingbot/WingbotModel');

const DEFAULT_SCORE = 0.96;

function createResponse (tag = 'hello', score = 0.96) {
    return { tags: tag ? [{ tag, score }] : [] };
}

function fakeReq (text = 'text') {
    return [
        {
            data: { timestamp: Date.now() },
            text () { return text; },
            isText () { return !!text; },
            _intents: null
        },
        {},
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
            assert.strictEqual(args[0]._intents[0].score, DEFAULT_SCORE);

            args = fakeReq();

            await mid2(...args);
            res = await mid(...args);

            assert.ok(this.fakeRequest.calledOnce);
            assert.strictEqual(res, Router.CONTINUE);
            assert.strictEqual(args[0]._intents[0].score, DEFAULT_SCORE);

            syncRes = Promise.resolve(createResponse(null));
            args = fakeReq('unknown');
            res = await mid(...args);

            assert.ok(this.fakeRequest.calledTwice);
            assert.strictEqual(res, Router.BREAK);
            assert.deepStrictEqual(args[0]._intents, []);
        });

        it('should skip request without texts', async function () {
            const mid = ai.match('hello', 0.1);
            const args = fakeReq(null);
            const res = await mid(...args);

            assert.ok(!this.fakeRequest.called);
            assert.strictEqual(res, Router.BREAK);
            assert.strictEqual(args[0]._intents, null);
        });

        it('should skip request when the confidence is low', async function () {
            const mid = ai.match('hello', 1);
            const args = fakeReq('hello');
            const res = await mid(...args);

            assert.ok(this.fakeRequest.called);
            assert.strictEqual(res, Router.BREAK);
            assert.deepStrictEqual(args[0]._intents, [{ intent: 'hello', score: 0.96 }]);
        });

        it('mutes errors', async function () {
            syncRes = Promise.reject(new Error());
            const mid = ai.match('hello', 0.1);
            const args = fakeReq();
            const res = await mid(...args);

            assert.ok(this.fakeRequest.calledOnce);
            assert.strictEqual(res, Router.BREAK);
            assert.deepStrictEqual(args[0]._intents, []);
        });

        it('mutes bad responses', async function () {
            syncRes = Promise.resolve({});
            const mid = ai.match('hello', 0.1);
            const args = fakeReq();
            const res = await mid(...args);

            assert.ok(this.fakeRequest.calledOnce);
            assert.strictEqual(res, Router.BREAK);
            assert.deepStrictEqual(args[0]._intents, []);
        });

    });

    describe('mockIntent', function () {

        it('should mock all intents', () => {
            const testAi = new Ai();

            testAi.mockIntent('testIntent');

            const match = testAi.match('testIntent');

            const req = { isText: () => true, data: { timestamp: Date.now() } };

            return match(req, {})
                .then((res) => {
                    assert.strictEqual(res, Router.CONTINUE);
                    const { intent, score } = req._intents[0];

                    assert.strictEqual(intent, 'testIntent');
                    assert.strictEqual(score, ai.confidence);
                });
        });

        it('should mock mock intent with request', () => {
            const testAi = new Ai();

            testAi.mockIntent();

            const match = testAi.match('testIntent');

            const data = Request.intent('any', 'hoho', 'testIntent');
            const req = { isText: () => true, data };

            return match(req, {})
                .then((res) => {
                    assert.strictEqual(res, Router.CONTINUE);
                    const { intent, score } = req._intents[0];

                    assert.strictEqual(intent, 'testIntent');
                    assert.strictEqual(score, ai.confidence);
                });
        });

    });

});
