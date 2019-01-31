/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Router = require('../../src/Router');
const Tester = require('../../src/Tester');
const Notifications = require('../../src/notifications/Notifications');

const TEST_ITEMS = 20;

describe('Notifications', function () {

    describe('#runCampaign()', function () {

        it('should work', async () => {

            const logger = {
                error: sinon.spy()
            };
            // @ts-ignore
            const notifications = new Notifications(undefined, { log: logger });

            const processorMock = {
                processMessage: sinon.spy((message) => {
                    const num = parseInt(message.sender.id, 10);

                    const status = num % notifications.limit === 0 ? 403 : 200;

                    if (num % notifications.limit === 1) {
                        throw new Error('Fail');
                    }

                    return Promise.resolve({
                        status,
                        responses: [
                            { message_id: `${Date.now()}${Math.random()}` }
                        ]
                    });
                })
            };

            for (let k = 100; k < 100 + TEST_ITEMS; k++) {
                await notifications.subscribe(`${k}`, 'test');
            }

            let campaign = await notifications.createCampaign('name', 'start');
            await notifications.runCampaign(campaign);

            const iterations = Math.ceil(TEST_ITEMS / notifications.limit);

            for (let k = 1; k <= iterations + 1; k++) {
                await notifications.processQueue(processorMock, 0);
            }

            campaign = await notifications._storage.getCampaignById(campaign.id);

            assert.strictEqual(campaign.queued, TEST_ITEMS);
            assert.strictEqual(campaign.sent, iterations * (notifications.limit - 2), 'sent must match');
            assert.strictEqual(campaign.leaved, iterations, 'unsubscribed count must match');
            assert.strictEqual(campaign.failed, iterations, 'fail count must match');

            assert.equal(processorMock.processMessage.callCount, TEST_ITEMS);

            const { data: subs } = await notifications._storage.getSubscribtions([], [], 500);

            assert.equal(subs.length, TEST_ITEMS - iterations);
            assert.equal(logger.error.callCount, iterations);
        });

    });

    function wait (ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    describe('#middleware()', () => {

        let bot;
        /** @type {Notifications} */
        let notifications;
        let campaign;

        beforeEach(async () => {
            notifications = new Notifications();
            bot = new Router();

            campaign = await notifications
                .createCampaign('Test', 'testAction', { id: 'identifiedCampaign' });

            bot.use(notifications.middleware());

            bot.use('testAction', (req, res) => {
                res.text('Hello');
            });

            bot.use('onceAction', (req, res) => {
                res.text('Bye');
            });

            bot.use('unsubscribe', (req, res) => {
                res.text('Unsubscribed');

                // @ts-ignore
                res.unsubscribe('anyTag');
            });

            bot.use('start', (req, res) => {
                res.text('Start');

                // @ts-ignore
                res.subscribe('anyTag');
            });
        });

        it('is possible to trigger action in right time and it\'s not added again', async () => {
            const t = new Tester(bot);

            await t.postBack('start');

            assert.throws(() => t.passedAction('testAction'));

            await notifications.runCampaign(campaign);

            await notifications.processQueue(t);

            t.passedAction('testAction');

            await wait(200);

            t.cleanup();

            await notifications.processQueue(t);

            assert.throws(() => t.passedAction('testAction'));

            await wait(10);

            const deliveryWaterMark = Date.now();

            await notifications.processMessage({
                sender: { id: t.senderId },
                timestamp: deliveryWaterMark,
                delivery: {
                    watermark: deliveryWaterMark + 1
                }
            }, t.pageId);

            await wait(10);

            const readWaterMark = Date.now();

            await notifications.processMessage({
                sender: { id: t.senderId },
                timestamp: readWaterMark,
                read: {
                    watermark: readWaterMark + 1
                }
            }, t.pageId);

            const [task] = notifications._storage._tasks;

            assert.equal(task.delivery, deliveryWaterMark);
            assert.equal(task.read, readWaterMark);
        });

        it('does not sent a message, when user leaves target group', async () => {
            const t = new Tester(bot);

            await t.postBack('start');

            await notifications.runCampaign(campaign);

            // the message has been queued, so lets unsubscribe the user with responder method
            await t.postBack('unsubscribe');

            await wait(10);

            t.passedAction('unsubscribe');

            t.cleanup();

            await notifications.processQueue(t);

            assert.throws(() => t.passedAction('testAction'));
        });

        it('does not sent a message, when campaign has been removed or deactivated', async () => {
            const t = new Tester(bot);

            await t.postBack('start');

            await notifications.runCampaign(campaign);

            await notifications._storage.removeCampaign(campaign.id);

            t.cleanup();

            await notifications.processQueue(t);

            assert.throws(() => t.passedAction('testAction'));
        });

        it('does not sent a message, when campaign has a condition', async () => {
            const t = new Tester(bot);

            await t.postBack('start');

            await wait(10);

            await notifications._storage.updateCampaign(campaign.id, {
                hasCondition: true,
                condition: '() => { return false; }'
            });

            await notifications.runCampaign(campaign);

            t.cleanup();

            await notifications.processQueue(t);

            assert.throws(() => t.passedAction('testAction'));
        });

        it('should not send a campaign twice to single user', async () => {
            const t = new Tester(bot);

            await t.postBack('start');

            await wait(10);

            campaign = await notifications._storage.updateCampaign(campaign.id, {
                hasCondition: true,
                condition: '() => { return true; }'
            });

            await notifications.runCampaign(campaign);

            t.cleanup();

            await notifications.processQueue(t);

            t.passedAction('testAction');

            await notifications.runCampaign(campaign);

            t.cleanup();

            await notifications.processQueue(t);

            assert.throws(() => t.passedAction('testAction'));
        });

        it('should send a campaign twice to single user when enabled', async () => {
            const t = new Tester(bot);

            await t.postBack('start');

            await wait(10);

            campaign = await notifications._storage.updateCampaign(campaign.id, {
                hasCondition: true,
                condition: '() => { return true; }',
                allowRepeat: true
            });

            await notifications.runCampaign(campaign);

            t.cleanup();

            await notifications.processQueue(t);

            t.passedAction('testAction');

            await wait(10);

            await notifications.runCampaign(campaign);

            await wait(10);

            t.cleanup();

            await notifications.processQueue(t);

            t.passedAction('testAction');
        });

        it('does not fail, when campaign has been removed - uses <removed> as name of campaign', async () => {
            const t = new Tester(bot);

            await t.postBack('start');

            assert.throws(() => t.passedAction('testAction'));
            await notifications.runCampaign(campaign);
            await wait(10);
            await notifications.processQueue(t);

            t.passedAction('testAction');

            await notifications._storage.removeCampaign(campaign.id);

            const deliveryWaterMark = Date.now();

            await notifications.processMessage({
                sender: { id: t.senderId },
                timestamp: deliveryWaterMark,
                delivery: {
                    watermark: deliveryWaterMark + 1
                }
            }, t.pageId);

            await wait(10);

            const readWaterMark = Date.now();

            await notifications.processMessage({
                sender: { id: t.senderId },
                timestamp: readWaterMark,
                read: {
                    watermark: readWaterMark + 1
                }
            }, t.pageId);

            const [task] = notifications._storage._tasks;

            assert.equal(task.delivery, deliveryWaterMark);
            assert.equal(task.read, readWaterMark);
        });

        it('makes able to send sliding campaigns', async () => {
            const t = new Tester(bot);

            let slidingCampaign = await notifications.createCampaign('sliding one', 'testAction', {}, {
                sliding: true,
                slide: 50
            });

            assert.equal(slidingCampaign.sent, 0);
            assert.equal(slidingCampaign.queued, 0);

            // subscribe
            await t.postBack('start');

            await wait(10);

            slidingCampaign = await notifications._storage.getCampaignById(slidingCampaign.id);
            assert.equal(slidingCampaign.sent, 0);
            assert.equal(slidingCampaign.queued, 1);

            // nothing should be sent now
            t.cleanup();
            await notifications.processQueue(t);
            assert.equal(t.actions.length, 0);

            // lets make an interaction
            await t.postBack('onceAction');
            t.passedAction('onceAction');

            // nothing should be sent now
            t.cleanup();
            await notifications.processQueue(t);
            assert.equal(t.actions.length, 0);

            // lets make another interaction
            await t.postBack('onceAction');
            t.passedAction('onceAction');

            await wait(60);

            await notifications.processQueue(t);

            t.passedAction('testAction');

            slidingCampaign = await notifications._storage.getCampaignById(slidingCampaign.id);
            assert.equal(slidingCampaign.sent, 1);
            assert.equal(slidingCampaign.queued, 1);
        });

        it('is able to shedule campaigns', async () => {
            const t = new Tester(bot);

            await t.postBack('start');

            assert.throws(() => t.passedAction('testAction'));

            await notifications.createCampaign('name', 'testAction', {}, {
                active: true,
                startAt: 10
            });

            t.cleanup();

            await notifications.processQueue(t, 10000, 10);

            t.passedAction('testAction');
        });

    });

    describe('#sendCampaignMessage()', () => {

        it('allows to send message directly', async () => {
            const bot = new Router();

            bot.use('camp-action', (req, res) => {
                const { a = 'noo' } = req.action(true);

                res.text('yeeesss')
                    .text(a);
            });

            const t = new Tester(bot);

            const notifications = new Notifications();

            const campaign = await notifications
                .createCampaign('Custom campaign', 'camp-action', {}, { id: 'custom-campaign' });

            const res = await notifications.sendCampaignMessage(campaign, t, t.pageId, t.senderId, { a: 'fooo' });

            assert.strictEqual(res.status, 200);

            t.any()
                .contains('yeeesss')
                .contains('fooo');

            // queue will not process this task again
            await wait(10);

            // nothing should be sent now
            t.cleanup();
            await notifications.processQueue(t);
            assert.equal(t.actions.length, 0);
        });
    });

    describe('#_uniqueTs()', () => {

        it('keeps only few entries', async () => {
            const notifications = new Notifications();

            let ts;
            for (let k = 1; k <= 60; k++) {
                const ts1 = notifications._uniqueTs(`${k}`);
                const ts2 = notifications._uniqueTs(`${k}`);
                const ts3 = notifications._uniqueTs(`${k}`);
                assert.notEqual(ts1, ts2);
                assert.notEqual(ts2, ts3);
                assert.equal(ts1, ts2 - 1);
                assert.equal(ts2, ts3 - 1);
                ts = ts3;
            }

            assert.equal(notifications._lts.size, 60);

            await wait(1010);

            const lastTs = notifications._uniqueTs('60');
            assert.notEqual(lastTs, ts);

            assert.equal(notifications._lts.size, 1);
        });

    });

});
