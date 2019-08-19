/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const AiMatching = require('../src/AiMatching');

const SCORE = 0.95;
const MULTI_SCORE = 0.95 * 1.2;

function entity (e, value = 'val', score = SCORE) {
    return { entity: e, value, score };
}

function intent (i, entities = null, score = SCORE) {
    return { intent: i, entities, score };
}

function fakeReq (intents = [], entities = [], text = 'foo') {
    return { intents, entities, text: () => text };
}

describe('<AiMatching>', () => {

    const ai = new AiMatching();

    describe('match', () => {

        it('should match intent', () => {
            const rule = ai.preprocessRule('intent');

            const i = intent('intent');
            const req = fakeReq([i]);
            const badReq = fakeReq([intent('bad')]);

            assert.deepEqual(ai.match(req, rule), i, 'should match');
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
        });

        it('should match entity', () => {
            const rule = ai.preprocessRule('@entity=');

            const e = entity('entity');
            const req = fakeReq([], [e]);
            const badReq = fakeReq([], [entity('bad')]);

            assert.deepEqual(ai.match(req, rule), intent(null, [e], SCORE));
            assert.strictEqual(ai.match(badReq, rule), null);
        });

        it('should match more intents', () => {
            const rule = ai.preprocessRule(['foo', 'bar']);

            const foo = intent('foo');
            const fooReq = fakeReq([foo]);

            const bar = intent('bar');
            const barReq = fakeReq([bar]);

            const badReq = fakeReq([intent('bad')]);

            assert.deepEqual(ai.match(fooReq, rule), foo);
            assert.deepEqual(ai.match(barReq, rule), bar);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
        });

        it('should match more entities', () => {
            const rule = ai.preprocessRule(['@foo', '@bar']);

            const foo = entity('foo');
            const bar = entity('bar');

            const goodReq = fakeReq([], [foo, bar]);
            const badReq = fakeReq([], [foo]);

            const winningIntent = intent(null, [foo, bar], MULTI_SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
        });

        it('should handicap redundant entities', () => {
            const rule = ai.preprocessRule(['@foo']);

            const foo = entity('foo');
            const bar = entity('bar');

            const badReq = fakeReq([], [foo, bar]);
            const goodReq = fakeReq([], [foo]);

            const { score: badScore } = ai.match(badReq, rule);
            const { score: goodScore } = ai.match(goodReq, rule);

            assert(badScore < goodScore);
        });

        it('should handicap optional entities', () => {
            const badRule = ai.preprocessRule(['@foo', '@bar?']);
            const goodRule = ai.preprocessRule(['@foo', { entity: 'bar', optional: false }]);

            const foo = entity('foo');
            const bar = entity('bar');

            const req = fakeReq([], [foo, bar]);

            const { score: badScore } = ai.match(req, badRule);
            const { score: goodScore } = ai.match(req, goodRule);

            assert(badScore < goodScore);
        });

        it('should handicap optional entities if the entity is missing', () => {
            const badRule = ai.preprocessRule(['@foo', { entity: 'bar', optional: true }]);
            const goodRule = ai.preprocessRule(['@foo']);

            const foo = entity('foo');

            const req = fakeReq([], [foo]);

            const { score: badScore } = ai.match(req, badRule);
            const { score: goodScore } = ai.match(req, goodRule);

            assert(badScore < goodScore);
        });

        it('should prefer request with intent 1', () => {
            const goodRule = ai.preprocessRule(['intent', '@foo']);
            const midRule = ai.preprocessRule(['intent']);
            const badRule = ai.preprocessRule(['@foo']);

            const foo = entity('foo', 'val', SCORE - 0.05);
            const i = intent('intent', [foo]);

            const req = fakeReq([i], [foo]);

            const { score: badScore } = ai.match(req, badRule);
            const { score: midScore } = ai.match(req, midRule);
            const { score: goodScore } = ai.match(req, goodRule);

            assert(badScore < goodScore, 'intent with entity should be better than just an entity');
            assert(midScore < goodScore, 'missing entity should handicap the middle rule');
            // no, it depends on score
            assert(badScore < midScore, 'this depends on score');
        });

        it('should match two same entities', () => {
            const rule = ai.preprocessRule(['@foo', '@foo']);

            const foo = entity('foo');

            const goodReq = fakeReq([], [foo, foo]);
            const badReq = fakeReq([], [foo]);

            const winningIntent = intent(null, [foo, foo], MULTI_SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
        });

        it('should compare equality', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'eq', compare: ['yes yes č'] }]);
            const stringRule = ai.preprocessRule(['@foo=yes yes č']);

            const goodFoo = entity('foo', 'yes yes č');
            const badFoo = entity('foo', 'no');

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('should compare inequality', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'ne', compare: ['yes'] }]);
            const stringRule = ai.preprocessRule(['@foo!=yes']);

            const goodFoo = entity('foo', 'no');
            const badFoo = entity('foo', 'yes');

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('should compare LT', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'lt', compare: [2] }]);
            const stringRule = ai.preprocessRule(['@foo<2']);

            const goodFoo = entity('foo', '1');
            const badFoo = entity('foo', '2');

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('should compare LTE', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'lte', compare: [2] }]);
            const stringRule = ai.preprocessRule(['@foo<=2']);

            const goodFoo = entity('foo', '2');
            const badFoo = entity('foo', '3');

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('should compare GT', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'gt', compare: [2] }]);
            const stringRule = ai.preprocessRule(['@foo>2']);

            const goodFoo = entity('foo', '4');
            const badFoo = entity('foo', '2');

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('should compare GTE', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'gte', compare: [2] }]);
            const stringRule = ai.preprocessRule(['@foo>=2']);

            const goodFoo = entity('foo', '2');
            const badFoo = entity('foo', '1');

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('should compare well defined ranges', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'range', compare: [2, 4] }]);
            const stringRule = ai.preprocessRule(['@foo<>2,4']);

            const goodFoo = entity('foo', '3');
            const badFoo = entity('foo', '1');

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('should compare right side ranges', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'range', compare: [2] }]);
            const stringRule = ai.preprocessRule(['@foo<>2']);

            const goodFoo = entity('foo', '3');
            const badFoo = entity('foo', '1');

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('should compare left side ranges', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'range', compare: [null, 2] }]);
            const stringRule = ai.preprocessRule(['@foo<>,2']);

            const goodFoo = entity('foo', '-1');
            const badFoo = entity('foo', '3');

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('should be ok with mixed types', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'range', compare: ['-1.5', '3'] }]);
            const stringRule = ai.preprocessRule(['@foo<>-1.5,3']);

            // @ts-ignore
            const goodFoo = entity('foo', 0.25);
            // @ts-ignore
            const badFoo = entity('foo', -345);

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

    });

});
