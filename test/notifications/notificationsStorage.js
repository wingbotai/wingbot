/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const NotificationsStorage = require('../../src/notifications/NotificationsStorage');

describe('<NotificationsStorage>', () => {

    /** @type {NotificationsStorage} */
    let storage;

    beforeEach(() => {
        storage = new NotificationsStorage();
    });

    describe('#pushTasks()', () => {

        it('should insert a task and assign an id to it', async () => {
            const res = await storage.pushTasks([{
                pageId: '1',
                senderId: '1',
                campaignId: '1',
                sent: null,
                enqueue: 1
            }]);

            assert.ok(Array.isArray(res));
            assert.equal(typeof res[0].id, 'string');

            const res2 = await storage.pushTasks([{
                pageId: '1',
                senderId: '2',
                campaignId: '1',
                sent: null,
                enqueue: 1
            }]);

            assert.ok(Array.isArray(res2));
            assert.equal(typeof res2[0].id, 'string');
            assert.notEqual(res[0].id, res2[0].id);
        });

        it('should not usert same task again, but it should update it', async () => {
            const res = await storage.pushTasks([{
                pageId: '1',
                senderId: '1',
                campaignId: '1',
                sent: null,
                enqueue: 1
            }]);

            assert.strictEqual(res[0].insEnqueue, 1);
            assert.strictEqual(res[0].enqueue, 1);

            const res2 = await storage.pushTasks([{
                pageId: '1',
                senderId: '1',
                campaignId: '1',
                sent: null,
                enqueue: 2
            }]);

            assert.strictEqual(res2[0].insEnqueue, 1);
            assert.strictEqual(res2[0].enqueue, 2);

            assert.equal(res[0].id, res2[0].id);
        });

        it('should not usert same task again, but it should update it', async () => {
            const res = await storage.pushTasks([{
                pageId: '1',
                senderId: '1',
                campaignId: '1',
                sent: null,
                enqueue: 1
            }]);

            assert.strictEqual(res[0].insEnqueue, 1);
            assert.strictEqual(res[0].enqueue, 1);

            const res2 = await storage.pushTasks([{
                pageId: '1',
                senderId: '1',
                campaignId: '1',
                sent: null,
                enqueue: 1
            }]);

            assert.strictEqual(res2[0].insEnqueue, 1);
            assert.strictEqual(res2[0].enqueue, 2);

            assert.equal(res[0].id, res2[0].id);
        });

        it('reused task should have a same enqueue', async () => {
            const res = await storage.pushTasks([{
                pageId: '1',
                senderId: '1',
                campaignId: '1',
                sent: null,
                enqueue: 1
            }]);

            assert.strictEqual(res[0].insEnqueue, 1);
            assert.strictEqual(res[0].enqueue, 1);

            await storage.popTasks(1, 2);

            const res2 = await storage.pushTasks([{
                pageId: '1',
                senderId: '1',
                campaignId: '1',
                sent: null,
                enqueue: 2
            }]);

            assert.strictEqual(res2[0].insEnqueue, 2);
            assert.strictEqual(res2[0].enqueue, 2);

            assert.equal(res[0].id, res2[0].id);
        });

    });

    describe('#unsuccessfulCampaigns()', () => {

        beforeEach(async () => {
            await storage.pushTasks([
                { // leaved
                    pageId: '1',
                    senderId: '1',
                    campaignId: '1',
                    sent: null,
                    enqueue: 1,
                    leaved: 1,
                    reaction: null
                },
                { // sent, but without reaction
                    pageId: '1',
                    senderId: '2',
                    campaignId: '1',
                    sent: 1,
                    enqueue: 1,
                    leaved: null,
                    reaction: false
                },
                { // sent with reaction
                    pageId: '1',
                    senderId: '3',
                    campaignId: '1',
                    sent: 1,
                    enqueue: 1,
                    leaved: null,
                    reaction: true
                },
                { // not sent
                    pageId: '1',
                    senderId: '4',
                    campaignId: '1',
                    sent: null,
                    enqueue: 1,
                    leaved: null,
                    reaction: null
                },
                { // another page leaved
                    pageId: '2',
                    senderId: '5',
                    campaignId: '1',
                    sent: null,
                    enqueue: 1,
                    leaved: 1,
                    reaction: null
                },
                { // another campaing without reaction
                    pageId: '1',
                    senderId: '6',
                    campaignId: '2',
                    sent: null,
                    enqueue: 1,
                    leaved: null,
                    reaction: false
                }
            ]);
        });

        it('shoud return campaings that has not been sent', async () => {
            const res = await storage.getUnsuccessfulSubscribersByCampaign('1', false, '1');

            assert.deepEqual(res, [
                { senderId: '1', pageId: '1' }
            ]);
        });

        it('shoud return campaings that has been sent, but without users reaction', async () => {
            const res = await storage.getUnsuccessfulSubscribersByCampaign('1', true, '1');

            assert.deepEqual(res, [
                { senderId: '2', pageId: '1' }
            ]);
        });

    });

    describe('#popTasks()', () => {

        beforeEach(async () => {
            await storage.pushTasks([{
                pageId: '1',
                senderId: '1',
                campaignId: '1',
                sent: null,
                enqueue: 1
            }, {
                pageId: '1',
                senderId: '2',
                campaignId: '1',
                sent: null,
                enqueue: 2
            }, {
                pageId: '1',
                senderId: '3',
                campaignId: '1',
                sent: null,
                enqueue: 3
            }]);
        });

        it('should pop tasks in right order and count', async () => {
            let pop = await storage.popTasks(1);

            assert.equal(pop.length, 1);
            assert.equal(pop[0].senderId, '1');

            pop = await storage.popTasks(1);

            assert.equal(pop.length, 1);
            assert.equal(pop[0].senderId, '2');

            pop = await storage.popTasks(1);

            assert.equal(pop.length, 1);
            assert.equal(pop[0].senderId, '3');

            pop = await storage.popTasks(1);

            assert.equal(pop.length, 0);
        });

        it('should not pop tasks with larger enqueue number', async () => {
            const pop = await storage.popTasks(1, 0);

            assert.equal(pop.length, 0);
        });

    });

    describe('#updateTask()', () => {

        beforeEach(async () => {
            await storage.pushTasks([{
                pageId: '1',
                senderId: '1',
                campaignId: '1',
                sent: null,
                enqueue: 1
            }]);
        });

        it('should update popped task and return it', async () => {
            const [pop] = await storage.popTasks(1);

            const updatedTask = await storage.updateTask(pop.id, { mid: 12 });

            assert.equal(updatedTask.id, pop.id);
            assert.equal(updatedTask.mid, 12);
        });

        it('returns null for random Ids', async () => {
            const updatedTask = await storage.updateTask('random id', { mid: 12 });

            assert.strictEqual(updatedTask, null);
        });

    });

    describe('#updateTasksByWatermark()', () => {

        beforeEach(async () => {
            await storage.pushTasks([{
                pageId: '1',
                senderId: '1',
                campaignId: '1',
                sent: null,
                enqueue: 1
            }, {
                pageId: '1',
                senderId: '1',
                campaignId: '2',
                sent: null,
                enqueue: 2
            }]);

            const [pop, pop2] = await storage.popTasks(2);
            await storage.updateTask(pop.id, { mid: 123, sent: 5 });
            await storage.updateTask(pop2.id, { mid: 123, sent: 6 });
        });

        it('should update actions state but not again', async () => {
            let updatedTasks = await storage.updateTasksByWatermark('1', '1', 5, 'read', 10);

            assert.equal(updatedTasks.length, 1);
            assert.equal(updatedTasks[0].read, 10);

            updatedTasks = await storage.updateTasksByWatermark('1', '1', 5, 'read', 10);

            assert.equal(updatedTasks.length, 0);
        });

        it('should update more than one action', async () => {
            const updatedTasks = await storage.updateTasksByWatermark('1', '1', 6, 'read', 10);

            assert.equal(updatedTasks.length, 2);
        });

    });

    describe('#getSentCampagnIds()', () => {

        beforeEach(async () => {
            await storage.pushTasks([{
                pageId: '1',
                senderId: '1',
                campaignId: '1',
                sent: null,
                enqueue: 1
            }, {
                pageId: '1',
                senderId: '1',
                campaignId: '2',
                sent: null,
                enqueue: 2
            }]);

        });

        it('returns list of campaign ids of sent tasks', async () => {
            let res = await storage.getSentCampagnIds('1', '1', ['1', '2']);

            assert.deepStrictEqual(res, []);

            const [pop, pop2] = await storage.popTasks(2);

            await storage.updateTask(pop.id, { mid: 123, sent: 5 });
            await storage.updateTask(pop2.id, { mid: 123, sent: 6 });

            res = await storage.getSentCampagnIds('1', '1', ['1', '2']);

            assert.deepStrictEqual(res, ['1', '2']);
        });

    });

    describe('#upsertCampaign()', () => {

        it('creates ID of campaign, when campaign was inserted', async () => {
            const camp = await storage.upsertCampaign({
                name: 'hello'
            });

            assert.equal(typeof camp.id, 'string');
        });

        it('not overrides campaign with existing id', async () => {
            let camp = await storage.upsertCampaign({
                id: 'same',
                name: 'hello'
            });

            assert.equal(camp.id, 'same');

            camp = await storage.upsertCampaign({
                id: 'same',
                name: 'ignore'
            });

            assert.equal(camp.id, 'same');
            assert.equal(camp.name, 'hello');
        });

        it('overrides data with campaign given as second param', async () => {
            let camp = await storage.upsertCampaign({
                id: 'same',
                name: 'hello'
            });

            assert.equal(camp.id, 'same');

            camp = await storage.upsertCampaign({
                id: 'same'
            }, { name: 'will be there' });

            assert.equal(camp.id, 'same');
            assert.equal(camp.name, 'will be there');
        });

    });

    describe('#removeCampaign()', () => {

        it('removes previously created campaign', async () => {
            const camp = await storage.upsertCampaign({
                name: 'hello'
            });

            assert.equal(typeof camp.id, 'string');

            const get = await storage.getCampaignById(camp.id);

            assert.deepStrictEqual(get, camp);

            await storage.removeCampaign(camp.id);

            const nothing = await storage.getCampaignById(camp.id);

            assert.strictEqual(nothing, null);
        });

    });

    describe('#incrementCampaign()', () => {

        it('increments state of the campaign', async () => {
            let camp = await storage.upsertCampaign({
                name: 'hello'
            });

            assert.strictEqual(camp.sent, undefined);

            await storage.incrementCampaign(camp.id, { sent: 1 });
            camp = await storage.getCampaignById(camp.id);

            assert.strictEqual(camp.sent, 1);

            await storage.incrementCampaign(camp.id, { sent: 1 });
            camp = await storage.getCampaignById(camp.id);

            assert.strictEqual(camp.sent, 2);

        });

    });

    describe('#updateCampaign()', () => {

        it('updates the campaign', async () => {
            let camp = await storage.upsertCampaign({
                name: 'hello'
            });

            camp = await storage.updateCampaign(camp.id, { name: 'foo' });

            assert.strictEqual(camp.name, 'foo');

        });

    });

    describe('#getCampaignByIds()', () => {

        it('returns campaigns by specific ids', async () => {
            const camp = await storage.upsertCampaign({
                name: 'hello'
            });

            await storage.upsertCampaign({
                id: 'mein',
                name: 'hello'
            });

            const res = await storage.getCampaignByIds([camp.id, 'mein']);

            assert.strictEqual(res.length, 2);

            assert.ok(res.every((c) => ['mein', camp.id].includes(c.id)));
        });

    });

    describe('#getCampaigns()', () => {

        beforeEach(async () => {
            await storage.upsertCampaign({
                name: 'foo',
                active: true
            });

            await storage.upsertCampaign({
                id: 'mein',
                name: 'bar',
                active: true
            });

            await storage.upsertCampaign({
                name: 'inactive',
                active: false
            });
        });

        it('returns campaigns by specific condition', async () => {
            const { data: res } = await storage.getCampaigns({ active: true });

            assert.strictEqual(res.length, 2);
            assert.ok(res.every((c) => ['foo', 'bar'].includes(c.name)));
        });

        it('accepts limit and allows pagination', async () => {
            const { data: res, lastKey } = await storage.getCampaigns({ active: true }, 1);

            assert.strictEqual(res.length, 1);
            assert.ok(res.some((c) => ['foo', 'bar'].includes(c.name)));

            const {
                data: res2,
                lastKey: lk2
            } = await storage.getCampaigns({ active: true }, 1, lastKey);

            assert.strictEqual(lk2, null);
            assert.strictEqual(res2.length, 1);
            assert.ok(res2.some((c) => ['foo', 'bar'].includes(c.name)));
            assert.ok(res2.every((c) => c.name !== res[0].name));
        });

    });

    describe('#getTags()', () => {

        beforeEach(async () => {
            await storage.subscribe('1', '1', 'foo');
            await storage.subscribe('1', '1', 'bar');
            await storage.subscribe('2', '2', 'foo');
            await storage.subscribe('3', '1', 'bar');
            await storage.subscribe('4', '4', 'bar');
        });

        it('lists all tags', async () => {
            const res = await storage.getTags();

            assert.deepEqual(res, [
                { tag: 'bar', subscribtions: 3 },
                { tag: 'foo', subscribtions: 2 }
            ]);
        });

        it('lists all tags in page', async () => {
            const res = await storage.getTags('1');

            assert.deepEqual(res, [
                { tag: 'bar', subscribtions: 2 },
                { tag: 'foo', subscribtions: 1 }
            ]);
        });

    });

    describe('#subscribe()', async () => {

        it('adds subscibtion, but does not override the first ts', async () => {
            await storage.subscribe('sid', 'pid', 'foo');
            await storage.subscribe('sid', 'pid', 'bar');
            await storage.subscribe('sid', 'pid', 'foo');

            const subs = await storage.getSenderSubscribtions('sid', 'pid');

            assert.deepStrictEqual(subs, [
                'foo',
                'bar'
            ]);
        });

    });

    describe('#unsubscribe()', async () => {

        beforeEach(async () => {
            await storage.subscribe('sid', 'pid', 'foo');
            await storage.subscribe('sid', 'pid', 'bar');
            await storage.subscribe('sid', 'pid', 'foo');
        });

        it('removes subscribtion', async () => {
            let subs = await storage.getSenderSubscribtions('sid', 'pid');

            assert.deepStrictEqual(subs, [
                'foo', 'bar'
            ]);

            await storage.unsubscribe('sid', 'pid', 'foo');

            subs = await storage.getSenderSubscribtions('sid', 'pid');

            assert.deepStrictEqual(subs, [
                'bar'
            ]);

            await storage.unsubscribe('sid', 'pid', 'bar');

            subs = await storage.getSenderSubscribtions('sid', 'pid');

            assert.deepStrictEqual(subs, []);
        });

        it('does not fail, when subscribtion or user not exists', async () => {
            await storage.unsubscribe('sid', 'pid', 'blabla');

            let subs = await storage.getSenderSubscribtions('sid', 'pid');

            assert.deepStrictEqual(subs, [
                'foo', 'bar'
            ]);

            await storage.unsubscribe('foo', 'pid', 'foo');

            subs = await storage.getSenderSubscribtions('sid', 'pid');

            assert.deepStrictEqual(subs, [
                'foo', 'bar'
            ]);
        });

        it('removes all subscribtions with empty tag', async () => {
            await storage.unsubscribe('sid', 'pid');

            const subs = await storage.getSenderSubscribtions('sid', 'pid');

            assert.deepStrictEqual(subs, []);
        });

    });

    describe('#getSubscribtionsCount()', () => {

        beforeEach(async () => {
            await storage.subscribe('1', '1', 'foo');
            await storage.subscribe('1', '1', 'bar');
            await storage.subscribe('2', '2', 'foo');
            await storage.subscribe('3', '3', 'foo');
        });

        it('should count the subscribtions by schema', async () => {
            const count = await storage.getSubscribtionsCount(['foo'], ['bar']);

            assert.equal(count, 2);
        });

    });

    describe('#getSubscribtions()', () => {

        beforeEach(async () => {
            await storage.subscribe('1', '1', 'foo');
            await storage.subscribe('1', '1', 'bar');
            await storage.subscribe('2', '2', 'foo');
            await storage.subscribe('3', '3', 'bar');
        });

        it('makes union by include parameter', async () => {
            let { data: res } = await storage.getSubscribtions(['foo'], [], 10);

            assert.deepStrictEqual(res, [
                { senderId: '1', pageId: '1' },
                { senderId: '2', pageId: '2' }
            ]);

            const { data } = await storage.getSubscribtions(['bar'], [], 10);
            res = data;

            assert.deepStrictEqual(res, [
                { senderId: '1', pageId: '1' },
                { senderId: '3', pageId: '3' }
            ]);

            const { data: data2 } = await storage.getSubscribtions(['foo', 'bar'], [], 10);
            res = data2;

            assert.deepStrictEqual(res, [
                { senderId: '1', pageId: '1' },
                { senderId: '2', pageId: '2' },
                { senderId: '3', pageId: '3' }
            ]);
        });

        it('excludes unwanted items', async () => {
            const { data } = await storage.getSubscribtions(['foo'], ['bar'], 10);

            assert.deepStrictEqual(data, [
                { senderId: '2', pageId: '2' }
            ]);
        });

        it('empty tagging returns all items', async () => {
            const { data } = await storage.getSubscribtions([], [], 10);

            assert.deepStrictEqual(data, [
                { senderId: '1', pageId: '1' },
                { senderId: '2', pageId: '2' },
                { senderId: '3', pageId: '3' }
            ]);
        });

        it('filters item by page', async () => {
            const { data } = await storage.getSubscribtions([], [], 10, '2');

            assert.deepStrictEqual(data, [
                { senderId: '2', pageId: '2' }
            ]);
        });

        it('allows pagination', async () => {
            const { data: res, lastKey: first } = await storage.getSubscribtions([], [], 2);

            assert.deepStrictEqual(res, [
                { senderId: '1', pageId: '1' },
                { senderId: '2', pageId: '2' }
            ]);

            const {
                data: res2,
                lastKey: second
            } = await storage.getSubscribtions([], [], 2, null, first);

            assert.deepStrictEqual(res2, [
                { senderId: '3', pageId: '3' }
            ]);
            assert.strictEqual(second, null);
        });
    });

    describe('#popCampaign()', () => {

        it('should pop sheduled campaign once', async () => {
            const createdCampaign = await storage.upsertCampaign({
                name: 'Test',
                startAt: 10,
                active: true
            });

            const pop1 = await storage.popCampaign(9);
            const pop2 = await storage.popCampaign(10);
            const pop3 = await storage.popCampaign(11);

            assert.strictEqual(pop1, null);
            assert.strictEqual(pop3, null);
            assert.strictEqual(pop2.id, createdCampaign.id);
            assert.strictEqual(pop2.startAt, 10);

        });

    });

});
