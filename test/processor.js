/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Processor = require('../src/Processor');
const Request = require('../src/Request');
const Tester = require('../src/Tester');
const Router = require('../src/Router');
const ReducerWrapper = require('../src/ReducerWrapper');

const EMPTY_STATE = { user: {} };

function createStateStorage (state = EMPTY_STATE, simulateError = true) {
    const storage = {
        model: {
            state
        },
        saveState (newModel) {
            this.model = newModel;
            return Promise.resolve(this.model);
        },
        times: 0,
        getOrCreateAndLock (/* senderId, defaultState, timeout */) {
            this.times++;
            if (simulateError && this.times < 2) {
                return Promise.reject(Object.assign(new Error(), { code: 11000 }));
            }

            return Promise.resolve(this.model);
        }
    };
    sinon.spy(storage, 'getOrCreateAndLock');
    sinon.spy(storage, 'saveState');
    return storage;
}

function createLogger (errFn = (m, e) => {
    throw e;
}) {
    return {
        info: sinon.spy(),
        log: sinon.spy(),
        warn: sinon.spy(),
        error: sinon.spy(errFn)
    };
}

function makeOptions (stateStorage, tokenStorage = null) {
    const log = createLogger();

    return {
        log, stateStorage, tokenStorage, waitForLockedState: 300
    };
}

describe('Processor', function () {

    describe('#processMessage()', function () {

        it('should reject messages from page itself', function () {
            const reducer = sinon.spy();

            const stateStorage = createStateStorage();
            const opts = makeOptions(stateStorage);
            const proc = new Processor(reducer, opts);

            return proc.processMessage({
                sender: {
                    id: 1
                },
                message: {
                    text: 'ahoj'
                }
            }, 1).then(() => {
                assert(!reducer.called);
            });
        });

        it('has cyclic check', async () => {
            const reducer = sinon.spy((req, res, postBack) => {
                res.text('Hello');
                postBack('start');
            });

            const stateStorage = createStateStorage();
            const opts = makeOptions(stateStorage);
            const options = Object.assign(opts, { autoSeen: true, log: console });
            // @ts-ignore
            const proc = new Processor(reducer, options);

            const res = await proc.processMessage({
                sender: {
                    id: 1
                },
                message: {
                    text: 'ahoj'
                }
            }, 10);

            assert.equal(res.status, 500);
            assert.ok(res.error.startsWith('Reached 20 redirects'));
        });

        it('should work', function () {

            const reducer = sinon.spy((req, res) => {
                res.setState({ final: 1 });
                res.text('Hello');
                assert.strictEqual(req.pageId, 10);
            });

            const stateStorage = createStateStorage();
            const opts = makeOptions(stateStorage);
            const proc = new Processor(reducer, Object.assign(opts, { autoSeen: true }));

            return proc.processMessage({
                sender: {
                    id: 1
                },
                message: {
                    text: 'ahoj'
                }
            }, 10).then((res) => {
                assert(reducer.calledOnce);

                assert.deepEqual(stateStorage.model.state, {
                    final: 1,
                    user: {},
                    _expected: null,
                    _expectedKeywords: null
                });

                assert(stateStorage.saveState.called);
                assert.strictEqual(res.responses.length, 2);
                assert.deepEqual(stateStorage.getOrCreateAndLock.firstCall.args, [
                    1,
                    10,
                    {},
                    30000
                ]);
            });
        });

        it('postback should reset expectations', function () {
            const reducer = sinon.spy((req, res) => {
                res.text('Hello');
            });

            const stateStorage = createStateStorage({
                user: {},
                _expected: { action: 'expect' }
            });

            const opts = makeOptions(stateStorage);
            const proc = new Processor(reducer, opts);

            return proc.processMessage({
                sender: {
                    id: 1
                },
                postback: {
                    payload: {
                        action: 'action'
                    }
                }
            }, 10).then(() => {
                assert(reducer.calledOnce);

                assert.deepEqual(stateStorage.model.state, {
                    user: {},
                    _expected: null,
                    _expectedKeywords: null
                });
            });
        });

        it('should be able to make "synchronous" postbacks', function () {
            const reducer = sinon.spy(async (req, res, postBack) => {
                const action = req.action();

                if (action === 'action') {
                    await postBack('hello', {}, true);
                } else if (action === 'hello') {
                    res.setState({ calledAction: action });
                }
            });

            const stateStorage = createStateStorage({
                user: {},
                _expected: { action: 'expect' }
            });

            const opts = makeOptions(stateStorage);
            const proc = new Processor(reducer, opts);

            return proc.processMessage({
                sender: {
                    id: 1
                },
                postback: {
                    payload: {
                        action: 'action'
                    }
                }
            }, 10).then(() => {
                assert(reducer.calledTwice);

                assert.deepEqual(stateStorage.model.state, {
                    user: {},
                    calledAction: 'hello',
                    _expected: null,
                    _expectedKeywords: null
                });
            });
        });

        it('should pass error to default error handler', function () {
            let responder;

            const reducer = sinon.spy((req, res) => {
                responder = res;
                res.setState({ final: 1 });
                res.text('Hello');
                assert.strictEqual(req.pageId, 10);
            });

            const stateStorage = createStateStorage();
            const opts = makeOptions(stateStorage);
            opts.senderFnFactory = undefined;
            opts.log = createLogger(() => {});
            const proc = new Processor(reducer, opts);

            const message = {
                timestamp: 1,
                sender: {
                    id: 1
                },
                message: {
                    text: 'ahoj'
                }
            };

            return proc.processMessage(message, 10)
                .then(() => {
                    assert.throws(() => {
                        responder._send({ wait: 1 });
                    });
                });
        });

        it('should not process one message twice', function () {

            const reducer = sinon.spy((req, res) => {
                res.setState({ final: 1 });
                res.text('Hello');
                assert.strictEqual(req.pageId, 10);
            });

            const stateStorage = createStateStorage();
            const opts = makeOptions(stateStorage);
            const proc = new Processor(reducer, opts);

            const message = {
                timestamp: 1,
                sender: {
                    id: 1
                },
                message: {
                    text: 'ahoj'
                }
            };

            return proc.processMessage(message, 10).then(() => {
                assert(reducer.calledOnce);

                return proc.processMessage(message, 10).then(() => {
                    assert(reducer.calledOnce);

                });
            });
        });

        it('should not process reads and deliveries', async () => {

            const reducer = sinon.spy((req, res) => {
                res.setState({ final: 1 });
                res.text('Hello');
                assert.strictEqual(req.pageId, 10);
            });

            const stateStorage = createStateStorage();
            const opts = makeOptions(stateStorage);
            const proc = new Processor(reducer, opts);

            const readMessage = Request.readEvent(1, 2);
            const deliveryMessage = Request.deliveryEvent(1, 2);

            await proc.processMessage(readMessage, 10);
            await proc.processMessage(deliveryMessage, 10);

            assert.strictEqual(reducer.callCount, 0);
        });

        it('should not fire the event if it should not be tracked', async () => {

            const reducer = sinon.spy((req, res) => {
                res.trackAs(false);
            });

            const stateStorage = createStateStorage();
            const opts = makeOptions(stateStorage);
            const proc = new Processor(new ReducerWrapper(reducer), opts);

            let set = false;

            proc.on('event', (s, action) => {
                set = action;
            });

            await proc.processMessage({
                sender: {
                    id: 1
                },
                postback: {
                    payload: {
                        action: 'action'
                    }
                }
            });

            await new Promise((r) => setTimeout(r, 10));

            assert(reducer.called);
            assert.strictEqual(set, false);
        });

        it('should not fire the event if it should not be tracked', async () => {

            const reducer = new ReducerWrapper((req, res) => {
                reducer.emitAction(req, res, false);
            });

            const reducerGot = [];
            reducer.on('action', (r, a) => reducerGot.push(a));

            const stateStorage = createStateStorage();
            const opts = makeOptions(stateStorage);
            const proc = new Processor(reducer, opts);

            let set = false;

            proc.on('event', (s, action) => {
                set = action;
            });

            await proc.processMessage({
                sender: {
                    id: 1
                },
                postback: {
                    payload: {
                        action: 'action'
                    }
                }
            });

            await new Promise((r) => setTimeout(r, 10));

            assert.strictEqual(set, false);
            assert.deepEqual(reducerGot, []);
        });

        it('should enable user tracking', async () => {

            const reducer = new ReducerWrapper((req, res) => {
                reducer.emitAction(req, res, 'abc');
                reducer.emitAction(req, res, 'efg');
            });

            const reducerGot = [];
            reducer.on('action', (r, a) => reducerGot.push(a));

            const stateStorage = createStateStorage();
            const opts = makeOptions(stateStorage);
            const proc = new Processor(reducer, opts);

            let set = false;

            proc.on('event', (s, action) => {
                set = action;
            });

            await proc.processMessage({
                sender: {
                    id: 1
                },
                postback: {
                    payload: {
                        action: 'action'
                    }
                }
            });

            await new Promise((r) => setTimeout(r, 10));

            assert.strictEqual(set, 'efg');
            assert.deepEqual(reducerGot, ['abc', 'efg']);
        });

        it('invalid messages should be logged', function () {

            const reducer = sinon.spy((req, res) => {
                res.setState({ final: 1 });
            });

            const stateStorage = createStateStorage();
            const opts = makeOptions(stateStorage);
            const proc = new Processor(reducer, opts);

            return proc.processMessage({})
                .then(() => {
                    assert(opts.log.warn.calledOnce);
                    return proc.processMessage({});
                })
                .then(() => {
                    assert(opts.log.warn.calledTwice);
                    return proc.processMessage({ sender: 'ho' });
                })
                .then(() => {
                    assert(opts.log.warn.calledThrice);
                    return proc.processMessage({});
                });
        });

        it('should wait after all async postback are resolved', function () {

            const reducer = sinon.spy((req, res, postBack) => {
                if (!req.action()) {
                    const data = new Promise((r) => setTimeout(() => r({ some: 1 }), 50));
                    postBack('actionName', data);
                }
            });

            const stateStorage = createStateStorage(EMPTY_STATE, false);
            const opts = makeOptions(stateStorage);
            const proc = new Processor(reducer, opts);

            return proc.processMessage({
                sender: {
                    id: 1
                },
                message: {
                    text: 'ahoj'
                }
            }).then(() => {
                assert(reducer.calledTwice);
                assert(stateStorage.saveState.calledTwice);
            });
        });

        it('should work with tokenstorage and wrapper', function () {

            const reducer = sinon.spy((req, res) => {
                res.setState({ final: 1 });
                res.text('Hello');
            });

            const wrapper = new ReducerWrapper(reducer);

            const actionSpy = sinon.spy();
            wrapper.on('action', actionSpy);

            const tokenStorage = {
                getOrCreateToken: sinon.spy(() => Promise.resolve({ token: 'token' }))
            };

            const stateStorage = createStateStorage();
            const opts = makeOptions(stateStorage, tokenStorage);
            const proc = new Processor(wrapper, opts);

            return proc.processMessage({
                sender: {
                    id: 1
                },
                message: {
                    text: 'ahoj'
                }
            })
                // events are processed as next tick
                .then((res) => new Promise((r) => process.nextTick(() => r(res))))
                .then((res) => {
                    assert(reducer.calledOnce);

                    assert.deepEqual(stateStorage.model.state, {
                        final: 1,
                        user: {},
                        _expected: null,
                        _expectedKeywords: null
                    });

                    assert(stateStorage.saveState.called);
                    assert.equal(res.responses.length, 1);

                    assert(actionSpy.calledOnce);
                });
        });

        it('makes requests as postback', async () => {
            const bot = new Router();

            bot.use('start', (req, res, postBack) => {
                postBack({
                    timestamp: Date.now() + 1,
                    sender: {
                        id: req.senderId
                    },
                    message: {
                        text: 'hello'
                    }
                });
            });

            bot.use((req, res) => {
                res.text(`result is ${req.text()}`);
            });

            const t = new Tester(bot);

            await t.postBack('start');

            t.res(0).contains('result is hello');
        });

        it('makes async postbacks', async () => {
            const bot = new Router();

            const wait = (resData) => new Promise((r) => setTimeout(() => r(resData), 100));

            bot.use('start', (req, res, postBack) => {
                postBack('process', async () => wait({ test: 2 }));
            });

            bot.use('process', (req, res) => {
                res.text(`result is ${req.actionData().test}`);
            });

            const t = new Tester(bot);

            await t.postBack('start');

            t.res(0).contains('result is 2');
        });

    });

    describe('#plugin()', () => {

        let middleware;
        let mockPlugin;
        let mockReducer;
        let p;

        beforeEach(() => {
            middleware = sinon.spy((req) => {
                const text = req.text();

                if (text === 'stop') {
                    return null;
                }
                return true;
            });

            mockPlugin = {
                processMessage: sinon.spy((message) => ({ status: message.sender.id })),
                middleware: sinon.spy(() => middleware),
                beforeAiPreload: sinon.spy((req) => (req.event.beforeAiPreload !== undefined
                    ? req.event.beforeAiPreload
                    : true)),
                beforeProcessMessage: sinon.spy((req) => (
                    req.event.beforeProcessMessage !== undefined
                        ? req.event.beforeProcessMessage
                        : true)),
                afterProcessMessage: sinon.spy((req) => (req.event.afterProcessMessage !== undefined
                    ? req.event.afterProcessMessage
                    : true))
            };

            mockReducer = sinon.spy((req, res) => {
                res.text('1');
            });

            p = new Processor(mockReducer);

            p.plugin(mockPlugin);
            // empty plugin to ensure the optional methods are working
            p.plugin({});
        });

        it('just works', async () => {
            const res = await p.processMessage({
                sender: { id: 200 }
            });

            assert.equal(mockPlugin.processMessage.calledOnce, true, 'plugin process method should  be called');
            assert.equal(mockPlugin.beforeAiPreload.calledOnce, false, 'plugin beforeAiPreload method should not be called');
            assert.equal(mockPlugin.beforeProcessMessage.calledOnce, false, 'plugin beforeProcessMessage method should not be called');
            assert.equal(mockPlugin.afterProcessMessage.calledOnce, false, 'plugin afterProcessMessage method should not be called');
            assert.equal(middleware.called, false, 'middleware should not be called');
            assert.equal(mockReducer.called, false, 'mockReducer should not be called');
            assert.deepEqual(res, { status: 200 }, 'response should be ok');
        });

        it('goes through all methods', async () => {
            const res = await p.processMessage({
                sender: { id: 300 },
                message: { text: 'a' }
            });

            assert.equal(mockPlugin.processMessage.calledOnce, true, 'plugin process method should  be called');
            assert.equal(mockPlugin.beforeAiPreload.calledOnce, true, 'plugin beforeAiPreload method should  be called');
            assert.equal(mockPlugin.beforeProcessMessage.calledOnce, true, 'plugin beforeProcessMessage method should  be called');
            assert.equal(mockPlugin.afterProcessMessage.calledOnce, true, 'plugin afterProcessMessage method should  be called');
            assert.equal(middleware.called, true, 'middleware should not be called');
            assert.equal(mockReducer.called, true, 'mockReducer should not be called');
            assert.deepEqual(res, { ...res, status: 200 }, 'response should be ok');
        });

        it('goes works with async methods', async () => {
            const res = await p.processMessage({
                sender: { id: 300 },
                message: { text: 'a' },
                beforeAiPreload: Promise.resolve(true),
                beforeProcessMessage: Promise.resolve(true),
                afterProcessMessage: Promise.resolve(true)
            });

            assert.equal(mockPlugin.processMessage.calledOnce, true, 'plugin process method should  be called');
            assert.equal(mockPlugin.beforeAiPreload.calledOnce, true, 'plugin beforeAiPreload method should  be called');
            assert.equal(mockPlugin.beforeProcessMessage.calledOnce, true, 'plugin beforeProcessMessage method should  be called');
            assert.equal(mockPlugin.afterProcessMessage.calledOnce, true, 'plugin afterProcessMessage method should  be called');
            assert.equal(middleware.called, true, 'middleware should not be called');
            assert.equal(mockReducer.called, true, 'mockReducer should not be called');
            assert.deepEqual(res, { ...res, status: 200 }, 'response should be ok');
        });

        it('is able to stop the processing', async () => {
            const res = await p.processMessage({
                sender: { id: 300 },
                message: { text: 'a' },
                beforeAiPreload: Promise.resolve(false),
                beforeProcessMessage: Promise.resolve(true),
                afterProcessMessage: Promise.resolve()
            });

            assert.equal(mockPlugin.processMessage.calledOnce, true, 'plugin process method should  be called');
            assert.equal(mockPlugin.beforeAiPreload.calledOnce, true, 'plugin beforeAiPreload method should  be called');
            assert.equal(mockPlugin.beforeProcessMessage.calledOnce, false, 'plugin beforeProcessMessage method should not be called');
            assert.equal(mockPlugin.afterProcessMessage.calledOnce, false, 'plugin afterProcessMessage method should not be called');
            assert.equal(middleware.called, false, 'middleware should not be called');
            assert.equal(mockReducer.called, false, 'mockReducer should not be called');
            assert.deepEqual(res, { ...res, status: 204 }, 'response should be ok');
        });

        it('is able to stop the processing', async () => {
            let res = await p.processMessage({
                sender: { id: 300 },
                message: { text: 'a' },
                beforeAiPreload: Promise.resolve(false),
                beforeProcessMessage: Promise.resolve()
            });

            assert.equal(mockPlugin.processMessage.calledOnce, true, 'plugin process method should  be called');
            assert.equal(mockPlugin.beforeAiPreload.calledOnce, true, 'plugin beforeAiPreload method should  be called');
            assert.equal(mockPlugin.beforeProcessMessage.calledOnce, false, 'plugin beforeProcessMessage method should not be called');
            assert.equal(mockPlugin.afterProcessMessage.calledOnce, false, 'plugin afterProcessMessage method should not be called');
            assert.equal(middleware.called, false, 'middleware should not be called');
            assert.equal(mockReducer.called, false, 'mockReducer should not be called');
            assert.deepEqual(res, { ...res, status: 204 }, 'response should be ok');

            res = await p.processMessage({
                sender: { id: 300 },
                message: { text: 'a' },
                beforeAiPreload: Promise.resolve(true),
                beforeProcessMessage: Promise.resolve(false),
                afterProcessMessage: Promise.resolve(true)
            });

            assert.equal(mockPlugin.processMessage.calledTwice, true, 'plugin process method should  be called');
            assert.equal(mockPlugin.beforeAiPreload.calledTwice, true, 'plugin beforeAiPreload method should  be called');
            assert.equal(mockPlugin.beforeProcessMessage.calledTwice, false, 'plugin beforeProcessMessage method should not be called');
            assert.equal(mockPlugin.afterProcessMessage.calledOnce, false, 'plugin afterProcessMessage method should not be called');
            assert.equal(middleware.called, false, 'middleware should not be called');
            assert.equal(mockReducer.called, false, 'mockReducer should not be called');
            assert.deepEqual(res, { ...res, status: 204 }, 'response should be ok');
        });

        it('throws error when the plugin does not return status', async () => {
            mockPlugin = {
                processMessage: sinon.spy(() => {}),
                middleware: sinon.spy(() => () => middleware)
            };

            p = new Processor(mockReducer);

            p.plugin(mockPlugin);

            const res = await p.processMessage({
                sender: { id: 1 }
            });

            assert.equal(middleware.called, false, 'middleware should not be called');
            assert.equal(mockReducer.called, false, 'mockReducer should not be called');
            assert.deepEqual(res, { status: 500 }, 'response should be error');
        });

        it('makes plugin middleware able to stop the event processing', async () => {
            const res = await p.processMessage({
                sender: { id: 204 },
                message: { text: 'stop' }
            });

            assert.equal(middleware.called, true, 'middleware should be called');
            assert.equal(mockReducer.called, false, 'mockReducer should not be called');
            assert.equal(mockPlugin.processMessage.calledOnce, true, 'plugin process method should  be called');
            assert.deepEqual(res, { status: 204, responses: [] }, 'response should be ok');
        });

        it('allows middleware to pass the request', async () => {
            const res = await p.processMessage({
                sender: { id: 204 },
                message: { text: 'continue' }
            });

            assert.equal(middleware.called, true, 'middleware should be called');
            assert.equal(mockReducer.called, true, 'mockReducer should be called');
            assert.equal(mockPlugin.processMessage.calledOnce, true, 'plugin process method should  be called');
            assert.equal(res.status, 200, 'response should be ok');
        });

    });

});
