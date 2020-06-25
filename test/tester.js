/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../src/Tester');
const Router = require('../src/Router');
const Request = require('../src/Request');

describe('Tester', function () {

    it('should be able to test', async function () {

        const music = new Router();

        music.use('/', (req, res) => {
            res.text('Listen to the music!', {
                back: 'Go back',
                play: {
                    title: 'Play',
                    match: /(^|\s)(play|plej)(\s|$)/
                }
            });
        });

        music.use('/back', (a, res, postBack) => {
            res.setData({ x: 1 });
            postBack('/start');
        });

        music.use('/play', (req, res, postBack) => {
            res.image('/image.png');
            postBack('./');
        });

        const read = new Router();

        read.use('/', (req, res) => {
            res.text('Lets read');
            return Router.CONTINUE;
        });

        read.use('/', (req, res) => {
            res.button('button text')
                .postBackButton('Action', 'go')
                .send();

            res.text('What?', {
                go: {
                    title: 'Go',
                    match: /(^|\s)(faa|fee)(\s|$)/,
                    data: { foo: 1 }
                }
            });
        });

        read.use('/go', (req, res) => {
            const { foo = 0 } = req.actionData();
            res.text(`See: ${foo}`);
            res.expected('out', { bar: 1 });
        });

        read.use('out', (req, res) => {
            const { bar = 0 } = req.actionData();
            res.text(`Yeah: ${bar}`);
            res.text(req.text());
        });

        const goThru = new Router();

        goThru.use('/start', (req, res) => {
            res.text('Go thru');
            return Router.CONTINUE;
        });

        const r = new Router();

        r.use(goThru);

        r.use('/start', (req, res) => {
            if (res.data.x === 1) {
                res.text('Data was passed');
            }
            res.text('Hello!', {
                music: {
                    title: 'Listen music'
                },
                read: 'Read books'
            });
        });

        r.use('/music', music);

        r.use('/read', read);

        const t = new Tester(r);

        await t.postBack('/start');

        t.passedAction('start');
        t.passedAction('/start');
        t.any()
            .contains('Go thru')
            .contains('Hello')
            .quickReplyAction('music')
            .quickReplyAction('read');
        t.lastRes()
            .contains('Hello')
            .quickReplyAction('music')
            .quickReplyAction('read');

        assert.throws(() => t.any().contains('nothing'));
        assert.throws(() => t.lastRes().contains('nothing'));
        assert.throws(() => t.any().quickReplyAction('nothing'));
        assert.throws(() => t.lastRes().quickReplyAction('nothing'));

        assert.throws(() => t.any().templateType('button'));
        assert.throws(() => t.any().attachmentType('image'));
        assert.throws(() => t.lastRes().templateType('button'));
        assert.throws(() => t.lastRes().attachmentType('image'));

        await t.quickReply('music');

        t.passedAction('/music')
            .any()
            .contains('Listen')
            .quickReplyAction('play');

        await t.text('plej');

        t.passedAction('play')
            .passedAction('/music');

        t.res(0).attachmentType('image');
        t.res(1).contains('Listen');

        t.any()
            .attachmentType('image')
            .contains('Listen');

        await t.quickReply('back');

        t.passedAction('/music/back');
        t.passedAction('/start');
        t.any().contains('Data was passed');

        await t.quickReply('read');

        t.passedAction('/read');
        t.any().contains('Lets read');
        t.any().contains('what');
        t.any().templateType('button');

        await t.text('faa');

        t.passedAction('go');
        t.any().contains('See: 1');
        assert.throws(() => t.any().contains('See: 0'));

        await t.text('Random Text');

        t.passedAction('out');
        t.any().contains('Yeah: 1');
        t.any().contains('Random Text');
    });

    it('should match path only when the end matches', async () => {
        const nested = new Router();

        nested.use('in', (req, res) => {
            res.text('INNER');
        });

        const r = new Router();

        r.use('inner', nested);

        const t = new Tester(r);

        await t.postBack('/inner/in');

        t.any()
            .contains('INNER');

        t.passedAction('in');
    });

    it('should work with optins', async function () {

        const r = new Router();
        let i = 0;

        r.use('/start', (req, res, postBack) => {
            i++;
            res.text(`Hello ${req.state.i || '0'}`);
            res.text(req.isOptin() ? 'optin' : 'postback');
            res.text(req.senderId ? 'hasSender' : 'noSender');
            res.setState({ i });
            postBack('postBack');
        });

        r.use('/postBack', (req, res) => {
            i++;
            res.setState({ i });
            res.text(`Go ${req.state.i}`);
        });

        const t = new Tester(r);

        await t.postBack('/start');

        assert.deepEqual(t.getState().state, {
            i: 2,
            _expected: null,
            _lastAction: '/postBack',
            _expectedKeywords: null,
            _lastVisitedPath: null,
            beforeLastInteraction: null,
            lastAction: '/postBack',
            lastInteraction: '/start'
        });

        t.any()
            .contains('postback')
            .contains('hasSender')
            .contains('Hello 0')
            .contains('Go 1');

        await t.optin('/start');

        assert.deepEqual(t.getState().state, {
            i: 4,
            _expected: null,
            _expectedKeywords: null,
            _lastAction: '/postBack',
            _lastVisitedPath: null,
            beforeLastInteraction: null,
            lastAction: '/postBack',
            lastInteraction: '/start'
        });

        t.any()
            .contains('optin')
            .contains('noSender')
            .contains('Hello 0')
            .contains('Go 3');

    });

    it('should match referral path only when is defined', async () => {
        const r = new Router();

        r.use('/start', (req, res) => {
            res.text('START');
        });

        r.use('/ref', (req, res) => {
            res.text('REF');
        });

        const t = new Tester(r);

        await t.postBack('/start');

        t.passedAction('start');

        await t.postBack('/start', {}, '/ref');

        t.passedAction('ref');
        assert.throws(() => {
            t.passedAction('start');
        }, 'should not pass through start action');
    });

    it('should recognise pass thread', async function () {
        const r = new Router();

        r.use('/start', (req, res) => {
            res.passThread('app');
        });

        r.use('/pass-thread', (req, res) => {
            const { theData } = req.actionData();
            res.text(theData);
        });

        const t = new Tester(r);

        await t.postBack('start');

        t.passedAction('start');
        t.any().passThread();
        t.res(0).passThread();

        await t.postBack('pass-thread');

        t.passedAction('pass-thread');

        assert.throws(() => {
            t.passedAction('start');
        }, 'should not pass through start action');
    });

    it('is able to test router plugins', async () => {
        const r = new Router();

        r.use('/', async (req, res, postBack) => {
            assert(typeof req.params === 'object', 'params should be an object');

            await res.run('foo');

            postBack('next');
        });

        r.use('/next', async (req, res) => {
            await res.run('bar');
        });

        const t = new Tester(r);

        await t.postBack('/');

        t.respondedWithBlock('foo')
            .respondedWithBlock('bar');
    });

    it('can find quick reply by text', async () => {
        const r = new Router();

        r.use('/start', (req, res) => {
            res.text('text', [
                {
                    action: 'quick',
                    title: 'look',
                    data: { val: '1' }
                }
            ]);
        });

        r.use('/quick', (req, res) => {
            const { val } = req.actionData();

            res.text(`v${val}`);
        });

        const t = new Tester(r);

        await t.postBack('start');

        const res = await t.quickReplyText('look');

        assert.strictEqual(res, true);

        t.any().contains('v1');

        const res2 = await t.quickReplyText('look');
        assert.strictEqual(res2, false);
    });

    it('thows nice exceptions', async () => {
        const r = new Router();

        r.use('/text', (req, res) => {
            res.text('haha');
            res.text('text', {
                action: 'quick'
            });
        });

        r.use('/redir', (req, res, postback) => postback('button'));

        r.use('/button', (req, res) => {
            res.text('haha');
            res.button('text')
                .postBackButton('title', 'act')
                .send();

        });

        const t = new Tester(r);

        let message;
        await t.postBack('redir');
        try {
            t.passedAction('other');
        } catch (e) {
            ({ message } = e);
        }
        assert.ok(message && message.indexOf('Interaction was not passed') !== -1);
        t.any().contains('text');

        try {
            t.any().contains('other');
        } catch (e) {
            ({ message } = e);
        }
        assert.ok(message && message.indexOf('No response contains required text') !== -1);

        await t.postBack('text');
        try {
            t.any().contains('other');
        } catch (e) {
            ({ message } = e);
        }
        assert.ok(message && message.indexOf('No response contains required text') !== -1);

        try {
            t.any().quickReplyAction('other');
        } catch (e) {
            ({ message } = e);
        }
        assert.ok(message && message.indexOf('Quick reply action not found') !== -1);

        try {
            t.any().quickReplyTextContains('other');
        } catch (e) {
            ({ message } = e);
        }
        assert.ok(message && message.indexOf('Quick reply not found') !== -1);
    });

    describe('setState', () => {

        /** @type {Tester} */
        let t;

        beforeEach(() => {
            const bot = new Router();

            bot.use('start', (req, res) => {
                res.text('Ahoj', [
                    { action: 'a', title: 'Bye', setState: { foo: 2 } }
                ]);

                res.expectedIntent('intent', 'b', {}, { foo: 3 });
            });

            bot.use('b', (req, res) => {
                const { foo } = req.state;
                const { foo: fooFromSetState } = res.newState;

                res.text(`b:${foo}:${fooFromSetState}`);
            });

            bot.use(['a', /^a$/], (req, res) => {
                const { foo } = req.state;
                const { foo: fooFromSetState } = res.newState;

                res.text(`${foo}:${fooFromSetState}`);
            });

            t = new Tester(bot);
        });

        it('works from postback', async () => {
            await t.processMessage(Request.postBackWithSetState(t.senderId, 'a', {}, { 'foo.bar': 1 }));

            t.any().contains('[object Object]:[object Object]');

            const { state } = t.getState();
            assert.deepEqual(state, { ...state, foo: { bar: 1 } });
        });

        it('works from text', async () => {
            await t.processMessage(Request.textWithSetState(t.senderId, 'a', { foo: 1 }));

            t.any().contains('1:1');

            const { state } = t.getState();
            assert.deepEqual(state, { ...state, foo: 1 });
        });

        it('works from quick reply', async () => {
            await t.postBack('start');

            await t.quickReplyText('Bye');

            t.any().contains('2:2');

            const { state } = t.getState();
            assert.deepEqual(state, { ...state, foo: 2 });
        });

        it('works from quick reply by text', async () => {
            await t.postBack('start');

            await t.text('Bye');

            t.any().contains('2:2');

            const { state } = t.getState();
            assert.deepEqual(state, { ...state, foo: 2 });
        });

        it('works from quick reply by intent', async () => {
            await t.postBack('start');

            await t.intent('intent');

            t.any().contains('b:3:3');

            const { state } = t.getState();
            assert.deepEqual(state, { ...state, foo: 3 });
        });

    });

});
