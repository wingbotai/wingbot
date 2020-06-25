/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const MemoryStateStorage = require('../../src/tools/MemoryStateStorage');

const SENDER_ID = 'a';
const SENDER_ID2 = 'b';
const PAGE_ID = 'a';
const DEFAULT_STATE = { x: 1 };

describe('MemoryStateStorage', function () {

    describe('#getOrCreateAndLock()', function () {

        it('should return state with state object', function () {
            const storage = new MemoryStateStorage();

            return storage.getOrCreateAndLock(SENDER_ID, PAGE_ID, DEFAULT_STATE)
                .then((state) => {
                    assert.deepEqual(state.state, DEFAULT_STATE);
                });
        });

    });

    describe('#saveState()', function () {

        it('should return state with state object', function () {
            const storage = new MemoryStateStorage();

            return storage.getOrCreateAndLock(SENDER_ID, PAGE_ID, DEFAULT_STATE)
                .then((state) => Object.assign(state, { state: { ko: 1 } }))
                .then((state) => storage.saveState(state))
                .then((state) => {
                    assert.deepEqual(state.state, { ko: 1 });

                    return storage.getOrCreateAndLock(SENDER_ID, PAGE_ID, { ko: 1 });
                })
                .then((state) => {
                    assert.deepEqual(state.state, { ko: 1 });
                });
        });

    });

    describe('#getStates()', () => {

        let storage;
        const secondState = { x: 2 };
        const lastInteraction = new Date(Date.now() - 20);
        const lastInteraction2 = new Date(Date.now() - 10);

        beforeEach(async () => {
            storage = new MemoryStateStorage();

            const first = await storage.getOrCreateAndLock(SENDER_ID, PAGE_ID, DEFAULT_STATE);
            const second = await storage.getOrCreateAndLock(SENDER_ID2, PAGE_ID, secondState);

            await storage.saveState({ ...first, lastInteraction });
            await storage.saveState({ ...second, lastInteraction: lastInteraction2 });
        });

        it('should return states by last interaction', async () => {
            let { data, lastKey } = await storage.getStates({}, 1);

            assert.deepEqual(data, [{
                pageId: PAGE_ID,
                senderId: SENDER_ID2,
                state: secondState,
                lastInteraction: lastInteraction2
            }]);

            ({ data, lastKey } = await storage.getStates({}, 1, lastKey));

            assert.deepEqual(data, [{
                pageId: PAGE_ID,
                senderId: SENDER_ID,
                state: DEFAULT_STATE,
                lastInteraction
            }]);

            assert.strictEqual(lastKey, null);
        });

        it('should be able to use search', async () => {
            const { data, lastKey } = await storage.getStates({
                search: SENDER_ID2
            });

            assert.deepEqual(data, [{
                pageId: PAGE_ID,
                senderId: SENDER_ID2,
                state: secondState,
                lastInteraction: lastInteraction2
            }]);

            assert.strictEqual(lastKey, null);
        });

    });

});
