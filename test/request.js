/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Request = require('../src/Request');
const Ai = require('../src/Ai');

const SENDER_ID = 'abcde';
const ACTION = 'action_ACTION';
const FILE_URL = 'http://goo.gl';
const DATA = { a: 1 };
const STATE = {};
const REF_ACTION = 'action_REF_ACTION';
const REF_DATA = { b: 2 };

describe('Request', function () {

    it('should have senderId and recipientId and pageId', function () {

        const postBack = Request.postBack(SENDER_ID, ACTION, DATA);

        postBack.recipient = {
            id: 789
        };

        const req = new Request(postBack, STATE, 456);

        assert.strictEqual(req.senderId, SENDER_ID);
        assert.strictEqual(req.pageId, 456);
        assert.strictEqual(req.recipientId, 789);
    });

    describe('#isPostBack()', function () {

        it('should know, whats postback', function () {
            const req = new Request(Request.postBack(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.isPostBack(), true);
        });

        it('should know, whats referral postback', function () {
            const req = new Request(
                Request.postBack(SENDER_ID, ACTION, DATA, REF_ACTION, REF_DATA),
                STATE
            );
            assert.strictEqual(req.isPostBack(), true);
        });

    });

    describe('#isReferral()', function () {

        it('should know, whats referral', function () {
            const req = new Request(Request.referral(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.isReferral(), true);
        });

        it('should know, whats referral', function () {
            const req = new Request(
                Request.postBack(SENDER_ID, ACTION, DATA, REF_ACTION, REF_DATA),
                STATE
            );
            assert.strictEqual(req.isReferral(), true);
        });

    });

    describe('#isStandby()', function () {

        it('should know, whats standby', function () {
            const req = new Request({
                ...Request.postBack(SENDER_ID, ACTION, DATA),
                isStandby: true
            }, STATE);
            assert.strictEqual(req.isStandby(), true);
        });

    });

    describe('#isOptin()', function () {

        it('should know, whats optin', function () {
            const req = new Request(Request.optin(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.isOptin(), true);
        });

    });

    describe('#.state', function () {

        it('should have state', function () {
            const req = new Request(Request.postBack(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.state, STATE);
        });

    });

    describe('#action()', function () {

        it('should return action name from postback', function () {
            const req = new Request(Request.postBack(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.action(), ACTION);
        });

        it('should return action data from postback', function () {
            const req = new Request(Request.postBack(SENDER_ID, ACTION, DATA), STATE);
            assert.deepEqual(req.actionData(), DATA);
        });

        it('should return referral action name from postback', function () {
            const req = new Request(
                Request.postBack(SENDER_ID, ACTION, DATA, REF_ACTION, REF_DATA),
                STATE
            );
            assert.strictEqual(req.action(), REF_ACTION);
        });

        it('should return referral action data from postback', function () {
            const req = new Request(
                Request.postBack(SENDER_ID, ACTION, DATA, REF_ACTION, REF_DATA),
                STATE
            );
            assert.deepEqual(req.actionData(), REF_DATA);
        });

        it('should return action name from referral', function () {
            const req = new Request(Request.referral(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.action(), ACTION);
        });

        it('should return action data from postback', function () {
            const req = new Request(Request.referral(SENDER_ID, ACTION, DATA), STATE);
            assert.deepEqual(req.actionData(), DATA);
        });

        it('should return action name from optin', function () {
            const req = new Request(Request.optin(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.action(), ACTION);
        });

        it('should return action data from optin', function () {
            const req = new Request(Request.optin(SENDER_ID, ACTION, DATA), STATE);
            assert.deepEqual(req.actionData(), DATA);
        });

        it('should return action name from quick reply', function () {
            const req = new Request(Request.quickReply(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.action(), ACTION);
        });

        it('should return action data from quick reply', function () {
            const req = new Request(Request.quickReply(SENDER_ID, ACTION, DATA), STATE);
            assert.deepEqual(req.actionData(), DATA);
        });

        it('should return action name from _expected state', function () {
            const data = Request.quickReply(SENDER_ID, null);
            const req = new Request(data, { _expected: ACTION });
            assert.strictEqual(req.action(), ACTION);
        });

        it('should return action data from _expected state', function () {
            const data = Request.quickReply(SENDER_ID, null);
            const req = new Request(data, { _expected: ACTION });
            assert.deepEqual(req.actionData(), {});
        });

        it('should return action name from _expected text', function () {
            const data = Request.text(SENDER_ID, 'Foo Bar');
            const req = new Request(data, {
                _expectedKeywords: [{ action: ACTION, match: '#foo-bar#' }]
            });
            assert.strictEqual(req.action(), ACTION);
        });

    });

    describe('#postBack()', function () {

        it('should return action name', function () {
            const req = new Request(Request.postBack(SENDER_ID, ACTION), STATE);
            assert.strictEqual(req.postBack(), ACTION);
        });

        it('should return action data', function () {
            const req = new Request(Request.postBack(SENDER_ID, ACTION, DATA), STATE);
            assert.deepEqual(req.postBack(true), DATA);
        });

        it('should return referral action name', function () {
            const req = new Request(
                Request.postBack(SENDER_ID, ACTION, DATA, REF_ACTION, REF_DATA),
                STATE
            );
            assert.strictEqual(req.postBack(), ACTION);
        });

        it('should return referral action data', function () {
            const req = new Request(
                Request.postBack(SENDER_ID, ACTION, DATA, REF_ACTION, REF_DATA),
                STATE
            );
            assert.deepEqual(req.postBack(true), DATA);
        });

        it('should return null, when the message is not a postback', function () {
            const req = new Request(Request.quickReply(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.postBack(), null);
        });

    });

    describe('#quickReply()', function () {

        it('should return action name', function () {
            const req = new Request(Request.quickReply(SENDER_ID, ACTION), STATE);
            assert.strictEqual(req.quickReply(), ACTION);
        });

        it('should return action data', function () {
            const req = new Request(Request.quickReply(SENDER_ID, ACTION, DATA), STATE);
            assert.deepEqual(req.quickReply(true), DATA);
        });

        it('should return null, when the message is not a quick reply', function () {
            const req = new Request(Request.postBack(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.quickReply(), null);
        });
    });

    describe('#text() / #isMessage()', function () {

        it('should return original text', function () {
            let req = new Request(Request.quickReply(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.text(), ACTION);
            assert.strictEqual(req.isMessage(), true);

            req = new Request(Request.postBack(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.text(), '');
            assert.strictEqual(req.isMessage(), false);

            req = new Request(Request.fileAttachment(SENDER_ID, FILE_URL), STATE);
            assert.strictEqual(req.text(), '');
            assert.strictEqual(req.isMessage(), true);
        });

        it('should return tokenized text', function () {
            const req = new Request(Request.quickReply(SENDER_ID, ACTION, DATA), STATE);
            assert.strictEqual(req.text(true), 'action-action');
        });

    });

    describe('#isFile() / #isImage() / #isAttachment() / isSticker()', function () {

        it('should validate file type', function () {
            const req = new Request(Request.fileAttachment(SENDER_ID, FILE_URL), STATE);

            assert.strictEqual(req.isFile(), true);
            assert.strictEqual(req.isImage(), false);
            assert.strictEqual(req.isAttachment(), true);
            assert.strictEqual(req.isSticker(), false);
            assert.strictEqual(req.isText(), false);
        });

        it('should validate image type', function () {
            const req = new Request(Request.fileAttachment(SENDER_ID, FILE_URL, 'image'), STATE);

            assert.strictEqual(req.isFile(), false);
            assert.strictEqual(req.isImage(), true);
            assert.strictEqual(req.isAttachment(), true);
            assert.strictEqual(req.isSticker(), false);
            assert.strictEqual(req.isText(), false);
        });

        it('should return false when theres no message', function () {
            const req = new Request(Request.quickReply(SENDER_ID, ACTION, DATA), STATE);

            assert.strictEqual(req.isFile(), false);
            assert.strictEqual(req.isImage(), false);
            assert.strictEqual(req.isAttachment(), false);
            assert.strictEqual(req.isSticker(), false);
            assert.strictEqual(req.isText(), false);
        });

        it('should recognize a sticker', () => {
            const req = new Request(Request.sticker(SENDER_ID, 1, ''));

            assert.strictEqual(req.isFile(), false);
            assert.strictEqual(req.isImage(), false);
            assert.strictEqual(req.isImage(0, true), true);
            assert.strictEqual(req.isAttachment(), true);
            assert.strictEqual(req.isSticker(), true);
            assert.strictEqual(req.isSticker(true), true);
            assert.strictEqual(req.isText(), false);
        });

        it('should transfer some stickers to text', () => {
            const req = new Request(Request.sticker(SENDER_ID, 369239263222822, ''));

            assert.strictEqual(req.isFile(), false);
            assert.strictEqual(req.isImage(), false);
            assert.strictEqual(req.isImage(0, true), true);
            assert.strictEqual(req.isAttachment(), true);
            assert.strictEqual(req.isSticker(), false);
            assert.strictEqual(req.isSticker(true), true);
            assert.strictEqual(req.isText(), true);
        });

    });

    describe('#attachmentUrl() / #attachment()', function () {

        it('should validate file type', function () {
            const req = new Request(Request.fileAttachment(SENDER_ID, FILE_URL), STATE);

            assert.strictEqual(req.attachmentUrl(), FILE_URL);
            assert.strictEqual(req.attachmentUrl(2), null);
            assert.strictEqual(typeof req.attachment(), 'object');
        });

        it('should validate image type', function () {
            const req = new Request(Request.fileAttachment(SENDER_ID, FILE_URL, 'image'), STATE);

            assert.strictEqual(req.attachmentUrl(), FILE_URL);
            assert.strictEqual(typeof req.attachment(), 'object');
        });

        it('should return false when theres no message', function () {
            const req = new Request(Request.quickReply(SENDER_ID, ACTION, DATA), STATE);

            assert.strictEqual(req.attachmentUrl(), null);
            assert.strictEqual(req.attachment(), null);
        });

    });

    describe('#intent()', () => {

        it('should return intent, when present', async () => {
            const req = new Request(Request.intentWithText(SENDER_ID, 'any', 'foo'), STATE);
            await Ai.ai.preloadIntent(req);
            assert.strictEqual(req.intent(), 'foo');
        });

        it('should return intent data, when present', async () => {
            const req = new Request(Request.intentWithText(SENDER_ID, 'any', 'foo'), STATE);
            await Ai.ai.preloadIntent(req);
            assert.deepStrictEqual(req.intent(true), { intent: 'foo', score: 1 });
        });

        it('should return null, when present, but score is too low', async () => {
            const req = new Request(Request.intentWithText(SENDER_ID, 'any', 'foo'), STATE);
            await Ai.ai.preloadIntent(req);
            assert.strictEqual(req.intent(1.1), null);
            assert.strictEqual(req.intent(0.1), 'foo');
        });

        it('should return null, when intent is missing', async () => {
            const req = new Request(Request.postBack(SENDER_ID, 'any'), STATE);
            await Ai.ai.preloadIntent(req);
            assert.strictEqual(req.intent(), null);
            assert.strictEqual(req.intent(true), null);
        });

        it('should return null, when AI middleware is not used', async () => {
            const req = new Request(Request.intentWithText(SENDER_ID, 'any', 'foo'), STATE);

            assert.strictEqual(req.intent(), null);
            assert.strictEqual(req.intent(true), null);
        });
    });

    describe('#hasLocation()', () => {

        it('should return false, when there is no location', () => {
            let req = new Request(Request.postBack(SENDER_ID, 'any'), STATE);

            assert.strictEqual(req.hasLocation(), false);

            req = new Request(Request.fileAttachment(SENDER_ID, 'http', 'image'), STATE);

            assert.strictEqual(req.hasLocation(), false);
        });

        it('should return true, when there is a location', () => {
            const req = new Request(Request.location(SENDER_ID, 10, 20), STATE);

            assert.strictEqual(req.hasLocation(), true);
        });

    });

    describe('#getLocation()', () => {

        it('should return false, when there is no location', () => {
            let req = new Request(Request.postBack(SENDER_ID, 'any'), STATE);

            assert.strictEqual(req.getLocation(), null);

            req = new Request(Request.fileAttachment(SENDER_ID, 'http', 'image'), STATE);

            assert.strictEqual(req.getLocation(), null);
        });

        it('should return true, when there is a location', () => {
            const req = new Request(Request.location(SENDER_ID, 10, 20), STATE);

            assert.deepStrictEqual(req.getLocation(), { lat: 10, long: 20 });
        });

    });

});
