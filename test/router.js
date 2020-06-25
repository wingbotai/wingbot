/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Router = require('../src/Router');

function createMockReq (text = '', action = 'action') {
    const req = {
        senderId: 7,
        state: {},
        action (isData) { return isData ? {} : action; },
        expected: () => null,
        text () { return text; },
        intent () { return null; },
        isText () { return !!text; },
        isQuickReply () { return text && action; }
    };
    return req;
}

function createMockRes (req) {
    const ret = {
        path: '',
        routePath: '',
        newState: {},
        bookmark () { return null; },
        setState (s) {
            Object.assign(req.state, s);
        },
        setPath (path, routePath) {
            this.path = path;
            this.routePath = routePath;
        }
    };
    return ret;
}

function shouldBeCalled (route, req, res) {
    assert(route.called, 'route should be called');
    assert.strictEqual(route.firstCall.args[0], req);
    assert.strictEqual(route.firstCall.args[1], res);
    assert.equal(typeof route.firstCall.args[2], 'function');
}

function nextTick () {
    return new Promise((r) => process.nextTick(r));
}

describe('Router', function () {

    describe('#reduce()', function () {

        it('should work', async function () {
            const router = new Router();

            const route = sinon.spy();
            const noRoute = sinon.spy();
            const req = createMockReq();
            const res = createMockRes(req);

            router.use('/first', noRoute);
            router.use('/*', route);

            await router.reduce(req, res);

            assert(!noRoute.called, 'route should not be called');
            shouldBeCalled(route, req, res);
        });

        it('should accept generators', async function () {
            const router = new Router();

            const route = sinon.spy(() => Promise.resolve());
            const noRoute = sinon.spy();
            const req = createMockReq();
            const res = createMockRes(req);

            router.use('/first', async function (r, s, p) {
                noRoute(r, s, p);
            });
            router.use('/*', async function (r, s, p) {
                await route(r, s, p);
            });

            await router.reduce(req, res);

            assert(!noRoute.called, 'route should not be called');
            shouldBeCalled(route, req, res);
        });

        it('should call matching url', async function () {
            const router = new Router();

            const route = sinon.spy();
            const noRoute = sinon.spy();
            const req = createMockReq('', 'action');
            const res = createMockRes(req);

            router.use('action', route);
            router.use('*', noRoute);

            await router.reduce(req, res);

            assert(!noRoute.called, 'route should not be called');
            shouldBeCalled(route, req, res);

        });

        it('should call matching text with regexp', async function () {
            const router = new Router();

            const route = sinon.spy();
            const noRoute = sinon.spy();
            const req = createMockReq('just a text', null);
            const res = createMockRes(req);

            router.use('*', noRoute);
            router.use(/^just\sa\stext$/, route);
            router.use('*', noRoute);

            await router.reduce(req, res);

            assert(!noRoute.called, 'route should not be called');
            shouldBeCalled(route, req, res);

        });

        it('should work with CONTINUE, BREAK correctly', async function () {
            const router = new Router();

            let i = 0;

            const first = sinon.spy(() => Router.CONTINUE);
            const asyncResolver = sinon.spy(() => new Promise((resolve) => setTimeout(resolve, 50))
                .then(() => i++)
                .then(() => Router.CONTINUE));

            const third = sinon.spy(() => {
                assert.equal(i, 1, 'The third reducer should be called after asyncResolver was resolved.');
                return new Promise((resolve) => setTimeout(resolve, 50))
                    .then(() => i++)
                    .then(() => Router.CONTINUE);
            });
            const fourth = sinon.spy(() => {
                assert.equal(i, 2, 'The fourth reducer should be called after the third async reducer was resolved.');
                return Router.BREAK;
            });
            const notCalledAfterFourth = sinon.spy();
            const notCalledAfterLast1 = sinon.spy();
            const notCalledAfterLast2 = sinon.spy();
            const last = sinon.spy();
            const req = createMockReq('just a text', null);
            const res = createMockRes(req);

            router.use(/^just\sa\stext$/, first);
            router.use(asyncResolver, third, fourth, notCalledAfterFourth);
            router.use(last, notCalledAfterLast1);
            router.use(notCalledAfterLast2);

            await router.reduce(req, res);

            shouldBeCalled(first, req, res);
            shouldBeCalled(third, req, res);
            shouldBeCalled(fourth, req, res);
            shouldBeCalled(last, req, res);

            assert.equal(asyncResolver.callCount, 1, 'The asyncResolver should be called once');
            assert.strictEqual(asyncResolver.firstCall.args[0], req);

            asyncResolver.calledBefore(first);
            first.calledBefore(third);
            first.calledBefore(fourth);
            first.calledBefore(last);
            third.calledBefore(last);
            third.calledBefore(fourth);
            fourth.calledBefore(last);

            assert(notCalledAfterFourth.notCalled);
            assert(notCalledAfterLast1.notCalled);
            assert(notCalledAfterLast2.notCalled);
        });

    });

    describe('#use()', function () {
        it('should accept a router as parameter', async function () {
            const route = sinon.spy();
            const noRoute = sinon.spy();
            const req = createMockReq('', '/nested/inner');
            const res = createMockRes(req);

            const router = new Router();
            const nestedRouter = new Router();

            nestedRouter.use('/inner', route);

            router.use('/nested', nestedRouter);
            router.use('/', noRoute);

            await router.reduce(req, res);

            assert(!noRoute.called, 'route should not be called');
            shouldBeCalled(route, req, res);
        });

        it('should pass expected actions to nested routers', async function () {
            const route = sinon.spy(() => {});
            const noRoute = sinon.spy();

            const req = createMockReq('matching text', '/nested/inner');
            const res = createMockRes(req);

            const router = new Router();
            const nestedRouter = new Router();
            const forbiddenRouter = new Router();

            nestedRouter.use('inner', route);

            forbiddenRouter.use('any', 'matching text', noRoute);

            router.use('/nogo', noRoute);
            router.use('/nested', forbiddenRouter);
            router.use('/nested', nestedRouter);

            const actionSpy = sinon.spy();

            router.on('action', actionSpy);

            const reduceResult = await router.reduce(req, res);

            // assert routes
            assert(!noRoute.called, 'route should not be called');
            shouldBeCalled(route, req, res);

            assert.equal(reduceResult, undefined);

            // check fired action event
            return nextTick()
                .then(() => {
                    assert(actionSpy.calledOnce);
                    assert.strictEqual(actionSpy.firstCall.args[0], req.senderId);
                    assert.strictEqual(actionSpy.firstCall.args[1], '/nested/inner');
                    assert.strictEqual(actionSpy.firstCall.args[2], 'matching text');
                    assert.strictEqual(actionSpy.firstCall.args[3], req);
                    assert.strictEqual(actionSpy.firstCall.args[4], null);
                });
        });

        it('should execute wildcard actions when the pattern is matching', async function () {
            const router = new Router();

            const route = sinon.spy();
            const noRoute = sinon.spy();
            const req = createMockReq('action with text', null);
            const res = createMockRes(req);

            router.use(/should-not-match/, noRoute);
            router.use(/action\swith\stext/, route);
            router.use(noRoute);

            await router.reduce(req, res);

            assert(!noRoute.called, 'route should not be called');
            shouldBeCalled(route, req, res);
        });

        it('should make relative paths absolute and call postBack methods', async function () {
            const router = new Router();

            const route = sinon.spy((req, res, postBack) => postBack('relative', { data: 1 }));
            const noRoute = sinon.spy();
            const postBack = sinon.spy();
            const req = createMockReq('action with text', 'anotherAction');
            const res = createMockRes(req);

            router.use(route);
            router.use('*', noRoute);

            await router.reduce(req, res, postBack, '/prefix');

            assert(!noRoute.called, 'route should not be called');
            shouldBeCalled(route, req, res);
            assert(postBack.calledOnce);
            assert.deepEqual(postBack.firstCall.args, ['/prefix/relative', { data: 1 }, false]);
        });

        it('should make relative paths absolute and call wait postBack methods', async function () {
            const router = new Router();

            const route = sinon.spy((req, res, postBack) => {
                postBack('relative', Promise.resolve({ data: 1 }));
            });

            const noRoute = sinon.spy();

            const postBack = sinon.spy(() => null);
            const req = createMockReq('action with text', 'anotherAction');
            const res = createMockRes(req);

            router.use(route);
            router.use('*', noRoute);

            await router.reduce(req, res, postBack, '/prefix');

            assert(!noRoute.called, 'route should not be called');
            shouldBeCalled(route, req, res);
            assert(postBack.calledOnce);
            assert.deepEqual(postBack.firstCall.args, ['/prefix/relative', Promise.resolve({ data: 1 }), false]);
        });

    });

    describe('processReducers()', function () {

        it('should be able to run small list of reducers', async () => {
            const router = new Router();
            const wrapRouter = new Router();

            const route = sinon.spy((r, s, pb) => { pb('someAction'); });
            const postBack = sinon.spy();
            const req = createMockReq(null, '/inner/theAction');
            const res = createMockRes(req);

            const list = router.createReducersArray([route]);

            router.use('/theAction', async (r, s, pb, path, action) => {
                await router.processReducers(list, r, s, pb, path, action);
            });

            wrapRouter.use('/inner', router);

            await wrapRouter.reduce(req, res, postBack);

            assert(postBack.calledOnce, 'postback should be called');
            assert.deepEqual(postBack.firstCall.args, ['/inner/someAction', {}, false]);
            shouldBeCalled(route, req, res);
        });
    });

});
