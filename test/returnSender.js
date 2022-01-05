/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const ReturnSender = require('../src/ReturnSender');
const Tester = require('../src/Tester');
const Router = require('../src/Router');
const { Processor, Request } = require('..');
const { ai } = require('../src/Ai');
const { WingbotModel } = require('../src/wingbot');
const { FEATURE_PHRASES } = require('../src/features');

describe('<ReturnSender>', () => {

    it('throws an error through the processor', async () => {

        const bot = new Router();

        bot.use((req, res) => {
            res.text('foo');
        });

        const log = {
            error: sinon.spy(),
            log: sinon.spy()
        };

        const p = new Processor(bot, { log });

        class MockSender extends ReturnSender {

            async _send (m) {
                if (m.message && m.message.text === 'foo') {
                    throw new Error('fails');
                }

                return { message_id: '0' };
            }

        }

        const req = Request.text('u', 'bar');
        const s = new MockSender({}, 'u', req);

        let error = null;
        try {
            await p.processMessage(req, 'i', s);
        } catch (e) {
            error = e;
        }

        assert.ok(log.error.calledOnce);
        assert.ok(log.error.firstCall.args[0] instanceof Error, 'there should be an error');
        assert.strictEqual(log.error.firstCall.args[1], req);
        assert.strictEqual(error, null, 'there should no an error');
    });

    describe('#send() & finished()', () => {

        it('should retain catched error', async () => {
            const rs = new ReturnSender({}, 'a', {});

            rs.simulateFail = true;

            rs.send({ a: 1 });

            rs.send({ wait: 100 });

            rs.simulateFail = true;

            rs.send({ b: 1 });

            await new Promise((r) => setTimeout(r, 10));

            let err = null;
            await rs.finished(null, null, null, (e) => {
                err = e;
            });

            // @ts-ignore
            assert.equal(err && err.message, 'Fail');
        });

        it('should not log, if requested', async () => {
            const bot = new Router();

            bot.use('notlog', (req, res) => {
                res.text('not')
                    .doNotLogTheEvent();
            });

            bot.use('log', (req, res) => {
                res.text('log');
            });
            const t = new Tester(bot);
            // @ts-ignore
            t.senderLogger = {
                log: sinon.spy(),
                error: sinon.spy()
            };

            await t.postBack('log');

            t.any().contains('log');

            // @ts-ignore
            assert.equal(t.senderLogger.log.callCount, 1);

            await t.postBack('notLog');

            t.any().contains('not');

            // @ts-ignore
            assert.equal(t.senderLogger.log.callCount, 1);
        });

    });

    describe('#behavior with ExpectedIntentsAndEntities', () => {

        const wait = (ts = 10) => new Promise((r) => setTimeout(r, ts));

        let rs;
        let req;
        let fetch;

        beforeEach(() => {
            fetch = sinon.spy(async () => ({
                status: 200,
                json: async () => ({
                    phrases: [
                        ['intent', ['a', 'b']],
                        ['@entity', ['b', 'c']]
                    ]
                })
            }));

            ai.register(new WingbotModel({
                model: 'sasalele', fetch
            }), 'sasalele');

            const msg = { message: { text: 'foo' }, sender: { id: 'a' }, features: [FEATURE_PHRASES] };
            req = new Request(msg, { lang: 'sasalele' }, 'page');
            rs = new ReturnSender({}, msg.sender.id, msg);
        });

        it('saves last message before finish', async () => {
            assert.strictEqual(req.supportsFeature(req.FEATURE_PHRASES), true);

            rs.send({ message: { text: 'bar' } });

            await wait();

            rs.send({ expectedIntentsAndEntities: ['intent', '@entity'] });

            assert.ok(!fetch.called);
            assert.deepEqual(rs.results, []);

            await wait(); // for sure

            await rs.finished(req);

            assert.ok(fetch.called);
            assert.strictEqual(rs.results.length, 1);
            assert.deepStrictEqual(rs.responses[0].expected, {
                entities: ['@entity'],
                phrases: ['a', 'b', 'c']
            });
        });

        it('prolongs event sending when pushing another message', async () => {
            await ai.preloadAi(req);

            rs.send({ message: { text: 'bar' } });

            await wait();

            assert.strictEqual(rs.responses.length, 0);
            rs.send({ expectedIntentsAndEntities: ['intent', '@entity'] });
            assert.deepEqual(rs.results, []);

            rs.send({ message: { text: 'another' } });

            await wait(10);

            assert.strictEqual(rs.results.length, 1);
            assert.strictEqual(rs.responses[0].expected, undefined);

            await wait(10);

            await rs.finished(req);

            assert.strictEqual(rs.results.length, 2);
            assert.deepStrictEqual(rs.responses[1].expected, {
                entities: ['@entity'],
                phrases: ['a', 'b', 'c']
            });
        });

    });

    describe('#textFilter', () => {

        it('is able to filter text data', async () => {
            const collect = [];
            const log = (...args) => collect.push(args);

            const rs = new ReturnSender(
                { textFilter: () => 'good' },
                'a',
                { message: { text: 'bad' } },
                // @ts-ignore
                { log, error: log, info: log }
            );

            rs.send({ message: { text: 'bad' } });

            rs.send({ message: { attachment: { type: 'template', payload: { text: 'bad' } } } });

            const res = await rs.finished();

            assert.equal(res.status, 200);
            assert.deepEqual(collect, [
                [
                    'a',
                    [
                        { message: { text: 'good' } },
                        { message: { attachment: { type: 'template', payload: { text: 'good' } } } }
                    ],
                    { message: { text: 'good' } },
                    { visitedInteractions: [] }
                ]
            ]);

        });

    });

});
