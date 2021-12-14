/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { FEATURE_PHRASES, FEATURE_VOICE } = require('../src/features');
const Responder = require('../src/Responder');

const SENDER_ID = 123;
const APP_URL = 'http://goo.gl';
const TOKEN = 't';

function createAssets () {
    const sendFn = sinon.spy();
    const translator = sinon.spy((w) => `-${w}`);

    const messageSender = { send: sendFn };
    const opts = { translator, appUrl: APP_URL };
    return { sendFn, opts, messageSender };
}

describe('Responder', function () {

    describe('#text()', function () {

        it('should send nice text', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            assert.strictEqual(res.text('Hello'), res, 'should return self');

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].recipient.id, SENDER_ID);
            assert.equal(sendFn.firstCall.args[0].message.text, '-Hello');

            assert(opts.translator.calledOnce);
        });

        it('should send nice text with persona', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            assert.strictEqual(res.setPersona('a'), res, 'should return self');

            res.text('Hello');

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].recipient.id, SENDER_ID);
            assert.equal(sendFn.firstCall.args[0].message.text, '-Hello');
            assert.equal(sendFn.firstCall.args[0].persona_id, 'a');

            assert(opts.translator.calledOnce);
        });

        it('should send nice text with persona', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            assert.strictEqual(res.setPersona({ a: 1 }), res, 'should return self');

            res.text('Hello');

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].recipient.id, SENDER_ID);
            assert.equal(sendFn.firstCall.args[0].message.text, '-Hello');
            assert.deepEqual(sendFn.firstCall.args[0].persona, { a: 1 });

            assert(opts.translator.calledOnce);
        });

        it('should send nice text with quick replies', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            assert.strictEqual(res.text('Hello', {
                option: 'Text'
            }), res, 'should return self');

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].message.text, '-Hello');
            assert.equal(sendFn.firstCall.args[0].message.quick_replies[0].title, '-Text');
            assert.equal(sendFn.firstCall.args[0].message.quick_replies[0].payload, '{"action":"option","data":{"_ca":"/"}}');

            assert(opts.translator.calledTwice);
        });

        it('should send nice text with quick replies with empty payload', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            assert.strictEqual(res.text('Hello', [{ title: 'Text' }]), res, 'should return self');

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].message.text, '-Hello');
            assert.equal(sendFn.firstCall.args[0].message.quick_replies[0].title, '-Text');
            assert.equal(sendFn.firstCall.args[0].message.quick_replies[0].payload, undefined);

            assert(opts.translator.calledTwice);
        });

        it('should send no quick replies, when they are empty', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            assert.strictEqual(res.text('Hello', []), res, 'should return self');

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].message.text, '-Hello');
            assert.strictEqual(sendFn.firstCall.args[0].message.quick_replies, undefined);

            assert(opts.translator.calledOnce);
        });

        it('should send nice structured text with advanced quick replies', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);
            res.path = '/foo';

            assert.strictEqual(res.text('Hello', {
                option: {
                    title: 'Text Title',
                    data: { information: 1 }
                },
                another: {
                    title: 'Text2',
                    match: /some|another/
                },
                textMatch: {
                    title: 'Text2',
                    match: 'Custom Text'
                }
            }), res, 'should return self');

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].recipient.id, SENDER_ID);
            assert.equal(sendFn.firstCall.args[0].message.text, '-Hello');
            assert.equal(sendFn.firstCall.args[0].message.quick_replies[0].title, '-Text Title');
            assert.equal(sendFn.firstCall.args[0].message.quick_replies[0].payload, '{"action":"/foo/option","data":{"_ca":"/foo","information":1}}');

            assert.equal(opts.translator.callCount, 4);

            assert.deepEqual(res.newState._expectedKeywords, [
                {
                    action: '/foo/option', match: '#text-title', data: { information: 1 }, title: '-Text Title'
                },
                {
                    action: '/foo/another', match: '#some|another#', data: {}, title: '-Text2'
                },
                {
                    action: '/foo/textMatch', match: '#custom-text', data: {}, title: '-Text2'
                }
            ]);
        });

        it('should send typing off and seen messages', function () {
            const { sendFn, opts, messageSender } = createAssets();

            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.typingOn();
            res.typingOff();
            res.seen();

            assert.equal(sendFn.callCount, 3);
            assert.equal(sendFn.getCall(0).args[0].sender_action, 'typing_on');
            assert.equal(sendFn.getCall(1).args[0].sender_action, 'typing_off');
            assert.equal(sendFn.getCall(2).args[0].sender_action, 'mark_seen');
        });

        it('should send "typing" and "wait" in case of autoTyping is on', function () {
            const { sendFn, opts, messageSender } = createAssets();
            opts.autoTyping = true;

            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.text('Hahahaaaa');
            res.text('You are so funny!! So funny I need to write this veeeeeeery long message to test typing_on is longer for long texts.');

            assert.equal(sendFn.callCount, 6);
            assert.equal(sendFn.getCall(0).args[0].sender_action, 'typing_on');
            assert.equal(typeof sendFn.getCall(1).args[0].wait, 'number');
            assert.equal(sendFn.getCall(2).args[0].message.text, '-Hahahaaaa');
            assert.equal(sendFn.getCall(3).args[0].sender_action, 'typing_on');
            assert.equal(typeof sendFn.getCall(4).args[0].wait, 'number');
            assert.equal(typeof sendFn.getCall(5).args[0].message.text, 'string');

            assert(
                sendFn.getCall(4).args[0].wait > sendFn.getCall(1).args[0].wait,
                'The wait time should be longer for long texts.'
            );
        });

    });

    describe('#addQuickReply', () => {

        it('is able to add the quick reply at the beginning', () => {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.addQuickReply('x', 'Y', {}, false);

            assert.strictEqual(res.text('Hello', {
                option: 'Text'
            }), res, 'should return self');

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].message.text, '-Hello');
            assert.equal(sendFn.firstCall.args[0].message.quick_replies[0].title, '-Text');
            assert.equal(sendFn.firstCall.args[0].message.quick_replies[0].payload, '{"action":"option","data":{"_ca":"/"}}');
            assert.equal(sendFn.firstCall.args[0].message.quick_replies[1].title, '-Y');
            assert.equal(sendFn.firstCall.args[0].message.quick_replies[1].payload, '{"action":"x","data":{"_ca":"/"}}');
        });

        it('is able to add the quick reply only when replies presents', () => {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.addQuickReply('x', 'Y', {}, false, true);

            res.text('Hi');

            assert.strictEqual(res.text('Hello', []), res, 'should return self');

            assert(sendFn.calledTwice);
            assert.equal(sendFn.firstCall.args[0].message.text, '-Hi');
            assert.equal(sendFn.secondCall.args[0].message.text, '-Hello');
            assert.equal(sendFn.secondCall.args[0].message.quick_replies[0].title, '-Y');
            assert.equal(sendFn.secondCall.args[0].message.quick_replies[0].payload, '{"action":"x","data":{"_ca":"/"}}');
        });

    });

    [
        { media: 'image' },
        { media: 'video' },
        { media: 'file' }
    ].forEach(({ media }) => {

        describe(`#${media}()`, function () {

            it(`should send ${media} url with base path`, function () {
                const { sendFn, opts, messageSender } = createAssets();
                const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

                assert.strictEqual(res[media]('/img.png'), res, 'should return self');

                assert(sendFn.calledOnce);
                assert.equal(sendFn.firstCall.args[0].recipient.id, SENDER_ID);

                const { attachment } = sendFn.firstCall.args[0].message;
                assert.equal(attachment.type, media);
                assert.equal(attachment.payload.url, `${APP_URL}/img.png`);
            });

            it(`should send ${media} url without base path`, function () {
                const { sendFn, opts, messageSender } = createAssets();
                const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

                assert.strictEqual(res[media]('http://goo.gl/img.png'), res, 'should return self');

                assert(sendFn.calledOnce);
                assert.equal(sendFn.firstCall.args[0].recipient.id, SENDER_ID);

                const { attachment } = sendFn.firstCall.args[0].message;
                assert.equal(attachment.type, media);
                assert.equal(attachment.payload.url, 'http://goo.gl/img.png');
            });

        });

    });

    describe('#button()', function () {

        it('should send message with url', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.setPath('/hello');

            res.button('Hello')
                .postBackButton('Text', 'action')
                .urlButton('Url button', '/internal', true)
                .send();

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].recipient.id, SENDER_ID);

            const { attachment } = sendFn.firstCall.args[0].message;
            assert.equal(attachment.type, 'template');

            const { payload } = attachment;
            assert.equal(payload.template_type, 'button');
            assert.equal(payload.buttons.length, 2);

            assert.equal(payload.buttons[0].title, '-Text');
            assert.equal(payload.buttons[0].type, 'postback');
            assert.equal(payload.buttons[0].payload, '{"action":"/hello/action","data":{"_ca":"/hello"}}');

            assert.equal(payload.buttons[1].title, '-Url button');
            assert.equal(payload.buttons[1].type, 'web_url');
            assert.equal(payload.buttons[1].url, 'http://goo.gl/internal#token=t&senderId=123');
            assert.equal(payload.buttons[1].messenger_extensions, true);

            assert(opts.translator.calledThrice);
        });

    });

    describe('#receipt()', function () {

        it('should send message with receipt', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.receipt('Name', 'Cash', 'CZK', '1')
                .addElement('Element', 1, 2, '/inside.png', 'text')
                .send();

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].recipient.id, SENDER_ID);

            const { attachment } = sendFn.firstCall.args[0].message;
            assert.equal(attachment.type, 'template');

            const { payload } = attachment;
            assert.equal(payload.template_type, 'receipt');
            assert.equal(payload.elements.length, 1);

            assert.equal(payload.elements[0].title, '-Element');
            assert.equal(payload.elements[0].subtitle, '-text');
            assert.equal(payload.elements[0].price, 1);
            assert.equal(payload.elements[0].image, 'http://goo.gl/inside.png');

            assert(opts.translator.calledTwice);
        });

    });

    describe('#toAbsoluteAction()', function () {

        it('converts relative ation to absolute', function () {
            const { opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            assert.equal(res.toAbsoluteAction('xyz'), 'xyz');
            assert.equal(res.toAbsoluteAction('/xyz'), '/xyz');

            res.setPath('abs');

            assert.equal(res.toAbsoluteAction('xyz'), 'abs/xyz');
            assert.equal(res.toAbsoluteAction('/xyz'), '/xyz');

            res.setPath('/abs');

            assert.equal(res.toAbsoluteAction('xyz'), '/abs/xyz');
            assert.equal(res.toAbsoluteAction('/xyz'), '/xyz');

        });

    });

    describe('#expectedIntent()', () => {

        it('passes AI data to sender if phrases are supported', () => {
            const { opts, messageSender, sendFn } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, {
                ...opts,
                features: [FEATURE_PHRASES, FEATURE_VOICE]
            });

            res.expectedIntent(['#phrase-word'], 'action');

            assert.strictEqual(sendFn.called, false);

            res.expectedIntent(['intent'], 'action');

            assert.deepStrictEqual(sendFn.lastCall.args[0], {
                expectedIntentsAndEntities: ['intent']
            });

            res.expectedIntent(['@entity!=foo', '@bar?'], 'action');

            assert.deepStrictEqual(sendFn.lastCall.args[0], {
                expectedIntentsAndEntities: ['@entity', '@bar']
            });

            res.text('text', [
                {
                    action: 'somewhere', match: ['@some']
                }
            ], {
                ssml: '<speak>a</speak>',
                speed: 2.0
            });

            assert.deepStrictEqual(sendFn.lastCall.args[0], {
                ...sendFn.lastCall.args[0],
                message: {
                    ...sendFn.lastCall.args[0].message,
                    text: '-text',
                    voice: {
                        speed: 2.0
                    }
                }
            });
        });

    });

    describe('#setMessagingType()', function () {

        it('sends default message type', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            assert.strictEqual(res.text('Hello'), res, 'should return self');

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].messaging_type, 'RESPONSE');

            assert(opts.translator.calledOnce);
        });

        it('sets message type to message', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.setMessagingType(Responder.TYPE_NON_PROMOTIONAL_SUBSCRIPTION);

            assert.strictEqual(res.text('Hello'), res, 'should return self');

            assert(sendFn.calledOnce);
            assert.equal(
                sendFn.firstCall.args[0].messaging_type,
                Responder.TYPE_NON_PROMOTIONAL_SUBSCRIPTION
            );

            assert(opts.translator.calledOnce);
        });

        it('sets message tag to message', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.setMessagingType(Responder.TYPE_MESSAGE_TAG, 'TAG');

            assert.strictEqual(res.text('Hello'), res, 'should return self');

            assert(sendFn.calledOnce);
            assert.equal(
                sendFn.firstCall.args[0].messaging_type,
                Responder.TYPE_MESSAGE_TAG
            );
            assert.equal(
                sendFn.firstCall.args[0].tag,
                'TAG'
            );

            assert(opts.translator.calledOnce);
        });

    });

    describe('#genericTemplate()', function () {

        it('should send message with generic template', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.setPath('/path');

            res.genericTemplate()
                .addElement('title', 'subtitle')
                .setElementImage('/local.png')
                .postBackButton('Button title', 'action', { actionData: 1 })
                .addElement('another', null, true)
                .setElementImage('https://goo.gl/image.png')
                .setElementAction('/localUrl', true)
                .urlButton('Local link with extension', '/local/path', true, 'compact')
                .send();

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].recipient.id, SENDER_ID);

            const { attachment } = sendFn.firstCall.args[0].message;
            assert.equal(attachment.type, 'template');

            const { payload } = attachment;
            assert.equal(payload.template_type, 'generic');
            assert.equal(payload.elements.length, 2);

            assert.equal(payload.elements[0].title, '-title');
            assert.equal(payload.elements[0].subtitle, '-subtitle');
            assert.equal(payload.elements[0].image_url, `${APP_URL}/local.png`);
            assert.equal(payload.elements[0].buttons.length, 1);

            assert.equal(payload.elements[1].title, 'another');
            assert.strictEqual(payload.elements[1].subtitle, undefined);
            assert.equal(payload.elements[1].image_url, 'https://goo.gl/image.png');
            assert.deepEqual(payload.elements[1].default_action, {
                type: 'web_url',
                url: 'http://goo.gl/localUrl#token=t&senderId=123',
                webview_height_ratio: 'tall',
                messenger_extensions: true
            });
            assert.equal(payload.elements[1].buttons.length, 1);

            assert.notStrictEqual(payload.elements[0].buttons, payload.elements[1].buttons);

            assert.equal(opts.translator.callCount, 4);
        });

    });

    describe('#list()', function () {

        it('should send message with generic template', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.setPath('/path');

            res.list()
                .addElement('title', 'subtitle')
                .setElementImage('/local.png')
                .setElementUrl('https://www.seznam.cz')
                .postBackButton('Button title', 'action', { actionData: 1 })
                .addElement('another', null, true)
                .setElementImage('https://goo.gl/image.png')
                .setElementAction('/localUrl', true)
                .urlButton('Local link with extension', '/local/path', true, 'compact')
                .send();

            assert(sendFn.calledOnce);
            assert.equal(sendFn.firstCall.args[0].recipient.id, SENDER_ID);

            const { attachment } = sendFn.firstCall.args[0].message;
            assert.equal(attachment.type, 'template');

            const { payload } = attachment;
            assert.equal(payload.template_type, 'list');
            assert.equal(payload.elements.length, 2);

            assert.equal(payload.elements[0].title, '-title');
            assert.equal(payload.elements[0].subtitle, '-subtitle');
            assert.equal(payload.elements[0].image_url, `${APP_URL}/local.png`);
            assert.equal(payload.elements[0].item_url, 'https://www.seznam.cz');
            assert.equal(payload.elements[0].buttons.length, 1);

            assert.equal(payload.elements[1].title, 'another');
            assert.strictEqual(payload.elements[1].subtitle, undefined);
            assert.equal(payload.elements[1].image_url, 'https://goo.gl/image.png');
            assert.deepEqual(payload.elements[1].default_action, {
                type: 'web_url',
                url: 'http://goo.gl/localUrl#token=t&senderId=123',
                webview_height_ratio: 'tall',
                messenger_extensions: true
            });
            assert.equal(payload.elements[1].buttons.length, 1);

            assert.notStrictEqual(payload.elements[0].buttons, payload.elements[1].buttons);

            assert.equal(opts.translator.callCount, 4);
        });

    });

    describe('#expected()', function () {

        it('should set state to absolute expected value', function () {
            const { opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.setPath('/relative');

            res.expected('makeAction');

            assert.deepEqual(res.newState, { _expected: { action: '/relative/makeAction', data: {} } });
        });

        it('should set state absolute expectation', function () {
            const { messageSender, opts } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.setPath('/relative');

            res.expected('/absoule/path');

            assert.deepEqual(res.newState, { _expected: { action: '/absoule/path', data: {} } });
        });

        it('should null expected action with null', function () {
            const { messageSender, opts } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.setPath('/relative');

            res.expected(null);

            assert.deepStrictEqual(res.newState, { _expected: null });
        });

    });

    describe('#wait()', function () {

        it('creates wait action', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.wait(100);

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, { wait: 100, recipient: { id: 123 }, messaging_type: 'RESPONSE' });
        });

    });

    describe('#passThread()', function () {

        it('creates pass thread event', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.passThread('123');

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                messaging_type: 'RESPONSE',
                metadata: '{"data":{"$hopCount":0}}',
                recipient: {
                    id: SENDER_ID
                },
                target_app_id: '123'
            });
        });

        it('creates pass thread event with metadata', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.passThread('123', { a: 1 });

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                messaging_type: 'RESPONSE',
                recipient: {
                    id: SENDER_ID
                },
                target_app_id: '123',
                metadata: '{"a":1,"data":{"$hopCount":0}}'
            });
        });

        it('should not modify string metadata', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.passThread('123', '{"a":1}');

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                messaging_type: 'RESPONSE',
                recipient: {
                    id: SENDER_ID
                },
                target_app_id: '123',
                metadata: '{"a":1}'
            });
        });

        it('should not incremement object metadata $hopCount', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.passThread('123', { a: 1, data: { $hopCount: 1 } });

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                messaging_type: 'RESPONSE',
                recipient: {
                    id: SENDER_ID
                },
                target_app_id: '123',
                metadata: '{"a":1,"data":{"$hopCount":1}}'
            });
        });

        it('should increment $hopCount and merge with metadata', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts, { _$hopCount: 0 });

            res.passThread('123', { a: 1, data: {} });

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                messaging_type: 'RESPONSE',
                recipient: {
                    id: SENDER_ID
                },
                target_app_id: '123',
                metadata: '{"a":1,"data":{"$hopCount":1}}'
            });
        });

        it('should incremement $hopCount', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts, { _$hopCount: 0 });

            res.passThread('123', { a: 1 });

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                messaging_type: 'RESPONSE',
                recipient: {
                    id: SENDER_ID
                },
                target_app_id: '123',
                metadata: '{"a":1,"data":{"$hopCount":1}}'
            });
        });

        it('should throw exeption on cross threshold $hopCount', function () {
            const { opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts, { _$hopCount: 5 });

            assert.throws(
                () => {
                    res.passThread('123', { a: 1 });
                },
                Error,
                'More than 5 handovers occured'
            );
        });

    });

    describe('#requestThread()', function () {

        it('creates request thread event', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.requestThread('123');

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                ...object,
                request_thread_control: { metadata: '123' }
            });
        });

        it('creates request thread event with metadata', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.requestThread({ a: 1 });

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                ...object,
                request_thread_control: { metadata: '{"a":1}' }
            });
        });

        it('should be able to send no metadata', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.requestThread();

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                ...object,
                request_thread_control: {}
            });
        });

    });

    describe('#takeThread()', function () {

        it('creates take thread event', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.takeThead('random');

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                messaging_type: 'RESPONSE',
                recipient: {
                    id: SENDER_ID
                },
                take_thread_control: {
                    metadata: 'random'
                }
            });
        });

        it('creates take thread event with metadata', function () {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.takeThead({ a: 1 });

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                messaging_type: 'RESPONSE',
                recipient: {
                    id: SENDER_ID
                },
                take_thread_control: {
                    metadata: '{"a":1}'
                }
            });
        });

        // it.only('sentTextResponses', () => {
        it('sentTextResponses', () => {

            const { opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            const msgs = ['sale', 'sale', 'sasa', 'lele'];

            msgs.forEach((msg) => res.text(msg));

            const response = res.textResponses;

            assert.deepStrictEqual(response, msgs);

        });

        it('collects quick replies', () => {
            const { sendFn, opts, messageSender } = createAssets();
            const res = new Responder(SENDER_ID, messageSender, TOKEN, opts);

            res.addQuickReply('act', 'sasa');

            res.text('sasa');

            assert(sendFn.calledOnce);
            const object = sendFn.firstCall.args[0];
            assert.deepStrictEqual(object, {
                messaging_type: 'RESPONSE',
                recipient: {
                    id: SENDER_ID
                },
                message: {
                    text: '-sasa',
                    quick_replies: [
                        {
                            content_type: 'text',
                            payload: '{"action":"act","data":{"_ca":"/"}}',
                            title: '-sasa'
                        }
                    ]
                }
            });
        });

    });

});
