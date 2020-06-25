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

function intent (i, entities = [], score = SCORE) {
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
            const rule = ai.preprocessRule(['@entity?', 'intent', 'diff']);

            const req = fakeReq([intent('intent', [entity('another', 'c', 0.9975)], 0.9975)]);

            assert.deepEqual(ai.match(req, rule), {
                entities: [],
                intent: 'intent',
                score: 0.9375
            });
        });

        it('should match intent with optional entity', () => {
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

        it('intent with optional entity should have smaller score than with required entity', () => {
            const rule = ai.preprocessRule(['foo', '@entity!=']);
            const ruleWithEntity = ai.preprocessRule(['foo', '@entity']);

            const foo = intent('foo');
            const fooReq = fakeReq([foo]);

            const fooEntity = intent('foo', [entity('entity', 'val')]);
            const fooWithEntity = fakeReq([fooEntity]);

            const resWithoutEntity = ai.match(fooReq, rule);
            const resWithEntity = ai.match(fooWithEntity, ruleWithEntity);

            assert.ok(resWithEntity.score > resWithoutEntity.score, `${resWithEntity.score} > ${resWithoutEntity.score}`);
        });

        it('should match more intents without entities', () => {
            const rule = ai.preprocessRule(['foo', 'bar', '@hehe!=']);

            const foo = intent('foo');
            const fooReq = fakeReq([foo]);

            const bar = intent('bar');
            const barReq = fakeReq([bar]);

            const badReq = fakeReq([intent('bad')]);

            assert.deepEqual(ai.match(fooReq, rule), { ...foo, score: 1.1387999999999998 });
            assert.deepEqual(ai.match(barReq, rule), { ...bar, score: 1.1387999999999998 });
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

            const winningIntent = intent(null, [goodFoo], 0.949);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('should match empty entity', () => {
            const rule = ai.preprocessRule(['@en=a']);

            const en = entity('en', 'a');
            const goodFoo = intent('intent', [en]);
            const matchFoo = intent(null, [en], 0.8899999999999999);

            const goodReq = fakeReq([goodFoo], [en]);

            assert.deepEqual(ai.match(goodReq, rule), matchFoo);
        });

        it('should compare inequality with empty sets', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'ne', compare: [] }]);
            const stringRule = ai.preprocessRule(['@foo!=']);

            const goodFoo = entity('noFoo', 'no');
            const badFoo = entity('foo', 'yes');

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [{ entity: 'foo', score: 0.97, value: undefined }], 0.969);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('works good, when theres no comparison data', () => {
            const lt = ai.preprocessRule(['@foo<']);
            const gt = ai.preprocessRule(['@foo>']);
            const lte = ai.preprocessRule(['@foo<=']);
            const gte = ai.preprocessRule(['@foo>=']);

            const more = entity('foo', '1');
            const less = entity('foo', '-1');
            const zero = entity('foo', '0');

            const moreReq = fakeReq([], [more]);
            const lessReq = fakeReq([], [less]);
            const zeroReq = fakeReq([], [zero]);

            assert.strictEqual(ai.match(moreReq, lt), null);
            assert.strictEqual(ai.match(zeroReq, lt), null);
            assert.notStrictEqual(ai.match(lessReq, lt), null);

            assert.notStrictEqual(ai.match(moreReq, gt), null);
            assert.strictEqual(ai.match(zeroReq, gt), null);
            assert.strictEqual(ai.match(lessReq, gt), null);

            assert.strictEqual(ai.match(moreReq, lte), null);
            assert.notStrictEqual(ai.match(zeroReq, lte), null);
            assert.notStrictEqual(ai.match(lessReq, lte), null);

            assert.notStrictEqual(ai.match(moreReq, gte), null);
            assert.notStrictEqual(ai.match(zeroReq, gte), null);
            assert.strictEqual(ai.match(lessReq, gte), null);

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
