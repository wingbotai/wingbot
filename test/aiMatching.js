/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const AiMatching = require('../src/AiMatching');
const Ai = require('../src/Ai');

const SCORE = 0.95;
const MULTI_SCORE = 0.95 * 1.2;

function entity (e, value = 'val', score = SCORE, start = undefined, end = undefined) {
    return {
        entity: e,
        value,
        score,
        ...(end && { start, end })
    };
}

function intent (i, entities = [], score = SCORE) {
    return { intent: i, entities, score };
}

function fakeReq (intents = [], entities = [], text = 'foo', state = {}) {
    return {
        intents, entities, text: () => text, state
    };
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

        it('is able to use hbs templates within conditions', () => {
            const rule = ai.preprocessRule(['intent', '@entity={{stateVar}}']);

            const e = entity('entity', 'v');
            const i = intent('intent', [e]);
            const req = fakeReq([i], [e], 't', { stateVar: 'v' });
            const badReq = fakeReq([i], [e], 't', { stateVar: 'x' });

            assert.deepEqual(ai.match(req, rule), { ...i, score: 1.119 }, 'should match');
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
        });

        it('is able to use hbs templates within conditions', () => {
            const rule = ai.preprocessRule(['@entity={{stateVar}}']);

            const e = entity('entity', 'v');
            const i = intent('intent', [e]);
            const req = fakeReq([i], [e], 't', { stateVar: 'v' });
            const badReq = fakeReq([i], [e], 't', { stateVar: 'x' });

            assert.deepEqual(ai.match(req, rule), { ...i, score: 0.9299999999999999, intent: null }, 'should match');
            assert.deepEqual(ai.match(req, rule, true), { ...i, score: 0.9299999999999999, intent: null }, 'should match');
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
        });

        it('should match entity', () => {
            const rule = ai.preprocessRule(['@entity?', 'intent', 'diff']);

            const req = fakeReq([intent('intent', [entity('another', 'c', 0.9975)], 0.9975)]);

            assert.deepEqual(ai.match(req, rule), {
                entities: [],
                intent: 'intent',
                score: 0.9575
            });
        });

        it('should multiple same entities', () => {
            const rule = ai.preprocessRule(['@entity']);

            const entities = [
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('entity', 'v', 1),
                entity('x', 'v', 1),
                entity('y', 'v', 1)
            ];

            const req = fakeReq([intent('intent', entities, 0.9975)], entities);

            assert.deepEqual(ai.match(req, rule), {
                entities: [
                    entity('entity', 'v', 1)
                ],
                intent: null,
                score: 0.88
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

            assert.deepEqual(ai.match(fooReq, rule), { ...foo, score: 1.0921 });
            assert.deepEqual(ai.match(barReq, rule), { ...bar, score: 1.0921 });
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

        it('should match two same entities', () => {
            const rule = ai.preprocessRule(['@foo', '@foo']);

            const foo = entity('foo');
            const foo2 = entity('foo');

            const goodReq = fakeReq([], [foo, foo2]);
            const badReq = fakeReq([], [foo]);

            const winningIntent = intent(null, [foo, foo2], MULTI_SCORE);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
        });

        it('should match just single entity occurence', () => {
            const rule = ai.preprocessRule(['@foo', '@foo!=']);

            const foo = entity('foo');
            const foo2 = entity('foo');

            const badReq = fakeReq([], [foo, foo2]);
            const goodReq = fakeReq([], [foo]);

            const winningIntent = intent(
                null,
                [foo, { ...foo2, score: 0.96, value: undefined }],
                1.1436
            );

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
        });

        it('somehow works with order of entities', () => {
            const rule = ai.preprocessRule(['@foo=1', '@foo=2']);

            const foo1 = entity('foo', '1');
            const foo2 = entity('foo', '2');

            const goodReq = fakeReq([], [foo1, foo2]);
            const badReq = fakeReq([], [foo2, foo1]);

            const winningIntent = intent(null, [foo1, foo2], MULTI_SCORE);

            const win = ai.match(goodReq, rule);
            assert.deepEqual(win, winningIntent);
            const lost = ai.match(badReq, rule);
            assert.deepEqual(lost, winningIntent);
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

        it('should handicap optional entities, but not so much', () => {
            const rule = ai.preprocessRule(['int', 'oint', '@a?', '@b?', '@c?', '@d?', '@e?', '@f?']);

            const req = fakeReq([intent('int', [entity('a', 'x', 0.5)], 0.85)], [entity('a', 'x', 0.5)]);

            const { score } = ai.match(req, rule);

            assert.ok(score >= 0.8);
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

        it('should cope with optional entities and empty requests', () => {
            const stringRule = ai.preprocessRule(['@foo?=yes yes č']);
            const optionalRule = ai.preprocessRule(['@foo?']);

            const emptyIntentReq = fakeReq([{ intent: 'intent', score: 0.949 }], []);
            const emptyReq = fakeReq([], []);

            assert.deepStrictEqual(ai.match(emptyReq, optionalRule), null);
            assert.deepStrictEqual(ai.match(emptyIntentReq, stringRule), null);
            assert.deepStrictEqual(ai.match(emptyReq, stringRule), null);
        });

        it('should compare optional equality', () => {
            const rule = ai.preprocessRule([{
                entity: 'foo', op: 'eq', compare: ['yes yes č'], optional: true
            }]);
            const stringRule = ai.preprocessRule(['@foo?=yes yes č']);
            const intentStringRule = ai.preprocessRule(['intent', '@foo?=yes yes č']);

            const goodFoo = entity('foo', 'yes yes č');
            const badFoo = entity('foo', 'no');

            const goodReq = fakeReq([], [goodFoo]);
            const emptyIntentReq = fakeReq([{ intent: 'intent', score: 0.949 }], []);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], 0.949);
            const winningEmptyIntent = intent('intent', [], 0.929);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);

            assert.deepEqual(ai.match(emptyIntentReq, intentStringRule), winningEmptyIntent);

            assert.strictEqual(ai.match(badReq, rule), null);
            assert.strictEqual(ai.match(badReq, stringRule), null);
        });

        it('should compare inequality', () => {
            const rule = ai.preprocessRule([{ entity: 'foo', op: 'ne', compare: ['yes'] }]);
            const stringRule = ai.preprocessRule(['@foo!=yes']);

            const goodFoo = entity('foo', 'no');
            const badFoo = entity('foo', 'yes');

            const goodReq = fakeReq([], [goodFoo]);
            const badReq = fakeReq([], [badFoo]);

            const winningIntent = intent(null, [goodFoo], 0.948);

            assert.deepEqual(ai.match(goodReq, rule), winningIntent);
            assert.strictEqual(ai.match(badReq, rule), null, 'should not match');
            assert.deepEqual(ai.match(goodReq, stringRule), winningIntent);
            assert.strictEqual(ai.match(badReq, stringRule), null, 'should not match');
        });

        it('should match empty entity', () => {
            const rule = ai.preprocessRule(['@en=a']);

            const en = entity('en', 'a');
            const goodFoo = intent('intent', [en]);
            const matchFoo = intent(null, [en], 0.9299999999999999);

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

            const winningIntent = intent(null, [{ entity: 'foo', score: 0.96, value: undefined }], 0.938);

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

        it('should cope with low score entities', () => {
            const rule = ai.preprocessRule(['intent', '@foo']);

            // @ts-ignore
            const fooEntity = entity('foo', 'value', 0.835);

            const fooIntent = intent('intent', [fooEntity], 0.9);
            const goodReq = fakeReq([fooIntent], [fooEntity]);
            const winningIntent = intent('intent', [fooEntity], 0.8699);

            const res = ai.match(goodReq, rule);
            assert.deepEqual(res, winningIntent);
        });

        it('should cope with low score entities but retains OK@0.8 I.', () => {
            const rule = ai.preprocessRule(['intent', '@foo']);

            // @ts-ignore
            const fooEntity = entity('foo', 'value', 0.835);
            const goodReq = fakeReq([intent('intent', [fooEntity], 0.8)], [fooEntity]);

            const res = ai.match(goodReq, rule);
            assert.ok(res, 'it should match');
            assert.ok(res.score > 0.8, 'it should match');
        });

        it('should cope with low score entities but retains OK@0.85 II.', () => {
            const rule = ai.preprocessRule(['intent', '@foo']);

            // @ts-ignore
            const fooEntity = entity('foo', 'value', 0.835);
            const goodReq = fakeReq([intent('intent', [fooEntity], 0.85)], [fooEntity]);

            const res = ai.match(goodReq, rule);
            assert.ok(res, 'it should match');
            assert.ok(res.score > 0.85, 'it should match');
        });

        it('should cope with low score entities not@0.85', () => {
            const rule = ai.preprocessRule(['intent', '@foo']);

            // @ts-ignore
            const fooEntity = entity('foo', 'value', 0.835);
            const goodReq = fakeReq([intent('intent', [fooEntity], 0.8)], [fooEntity]);

            const res = ai.match(goodReq, rule);
            assert.ok(res, 'it should match');
            assert.ok(res.score < 0.85, 'it should match');
        });

        it('should cope with low score entities and intents OK@0.85 III.', () => {
            const rule = ai.preprocessRule(['intent', '@foo']);

            // @ts-ignore
            const fooEntity = entity('foo', 'value', 0.85);
            const goodReq = fakeReq([intent('intent', [fooEntity], 0.85)], [fooEntity]);

            const res = ai.match(goodReq, rule);
            assert.ok(res, 'it should match');
            assert.ok(res.score >= 0.85, 'it should match');
        });

        it('should cope with bad entities and intents OK@0.79', () => {
            const rule = ai.preprocessRule(['intent', '@foo']);

            // @ts-ignore
            const fooEntity = entity('foo', 'value', 0.835);
            const goodReq = fakeReq([intent('intent', [fooEntity], 0.79)], [fooEntity]);

            const res = ai.match(goodReq, rule);
            assert.ok(res, 'it should match');
            assert.ok(res.score >= 0.79, 'it should match');
        });

        it('should cope with bad entities and intents not@0.79 ', () => {
            const rule = ai.preprocessRule(['intent', '@foo']);

            // @ts-ignore
            const fooEntity = entity('foo', 'value', 0.8);
            const goodReq = fakeReq([intent('intent', [fooEntity], 0.835)], [fooEntity]);

            const res = ai.match(goodReq, rule);
            assert.ok(res, 'it should match');
            assert.ok(res.score < 0.79, 'it should match');
        });

        it('lowers the entity score according to the text length', () => {
            const rule = ai.preprocessRule(['@foo']);
            const intentRule = ai.preprocessRule(['intent', '@foo']);

            // @ts-ignore
            const fooEntity = entity('foo', 'value', 1, 0, 10);
            const goodReq = fakeReq([], [fooEntity], '12345678901234567890');

            const intentGoodReq = fakeReq([intent('intent', [fooEntity], 1)], [fooEntity], '12345678901234567890');

            const res = ai.match(goodReq, rule);
            assert.ok(res, 'it should match');

            const threshold = (1 - (ai._ai.confidence + ai.redundantHandicap)) / 2;

            assert.strictEqual(res.score, (1 - threshold), 'it should match');

            const intentRes = ai.match(intentGoodReq, intentRule);

            assert.ok(intentRes, 'it should match');
            assert.strictEqual(intentRes.score, ai.multiMatchGain, 'it should match');
        });

        it('allow the NLP to beat local context entity 2', () => {
            const uznatelnyMena = ai.preprocessRule(['@meny=hotovost', 'int_uznatelny']);
            const dokumentacePojmy = ai.preprocessRule(['int_dokumentace', '@pojmy=předschválený příjem']);

            const req = fakeReq([
                {
                    intent: 'int_dokumentace',
                    score: 0.9983229239781698,
                    entities: [
                        {
                            entity: 'pojmy',
                            score: 1,
                            value: 'předschválený příjem'
                        }
                    ]
                },
                {
                    intent: 'int_uznatelny',
                    score: 0.9865056872367859,
                    entities: []
                }
            ], [
                {
                    entity: 'pojmy',
                    score: 1,
                    value: 'předschválený příjem'
                }
            ], 'sasa lele', {
                '@meny': 'hotovost'
            });

            const dokumetaceMenaRes = ai.match(req, dokumentacePojmy);
            const uznatelnyMenaRes = ai.match(req, uznatelnyMena); // 1.183806824684143

            assert.ok(dokumetaceMenaRes);
            assert.ok(uznatelnyMenaRes);
            assert.ok(dokumetaceMenaRes.score > (uznatelnyMenaRes.score + Ai.ai.localEnhancement));

            // console.log({ dokumetaceMenaRes, uznatelnyMenaRes });
        });

        it('allow the NLP to beat local context entity', () => {
            const uznatelnyMena = ai.preprocessRule(['@meny=hotovost', 'int_uznatelny']);
            const uznatelnyPojmy = ai.preprocessRule(['int_uznatelny', '@pojmy=předschválený příjem']);

            const req = fakeReq([
                {
                    intent: 'int_uznatelny',
                    score: 0.999998927116394,
                    entities: [
                        {
                            entity: 'pojmy',
                            score: 0.9995,
                            value: 'předschválený příjem'
                        }
                    ]
                }
                // {
                //     intent: 'int_uznatelny',
                //     score: 0.8934060611724854,
                //     entities: [
                //         {
                //             entity: 'pojmy',
                //             score: 0.9995,
                //             value: 'předschválený příjem'
                //         }
                //     ]
                // }
            ], [
                {
                    entity: 'pojmy',
                    score: 0.9995,
                    value: 'předschválený příjem'
                }
            ], 'sasa lele', {
                '@meny': 'hotovost'
            });

            const uznatelnyMenaRes = ai.match(req, uznatelnyMena);
            const uznatelnyPojmyRes = ai.match(req, uznatelnyPojmy);

            assert.ok(uznatelnyPojmyRes);
            assert.ok(uznatelnyMenaRes);

            assert.ok(uznatelnyPojmyRes.score > (uznatelnyMenaRes.score + Ai.ai.localEnhancement));
        });

    });

    describe('covering entities', () => {

        it('does not use handicaps for covering entities', () => {
            const coveringEntity = ai.preprocessRule(['@pojem=refinancování']);
            const contextIntent = ai.preprocessRule(['int_uznatelny', '@koupe=koupe']);
            const both = ai.preprocessRule(['covered_int', '@pojem=refinancování']);

            const req = fakeReq([
                {
                    intent: 'int_uznatelny',
                    score: 0.92,
                    entities: []
                },
                {
                    intent: 'covered_int',
                    score: 0.8133,
                    entities: [
                        {
                            entity: 'pojem',
                            score: 1,
                            value: 'refinancování',
                            start: 0,
                            end: 13
                        }
                    ]
                }
            ], [
                {
                    entity: 'pojem',
                    score: 1,
                    value: 'refinancování',
                    start: 0,
                    end: 13
                }
            ], 'refinancování', {
                '@koupe': 'koupe'
            });

            const coveringEntityRes = ai.match(req, coveringEntity);
            const contextIntentRes = ai.match(req, contextIntent);
            const bothRes = ai.match(req, both);

            assert.ok(coveringEntityRes);
            assert.ok(contextIntentRes);
            assert.ok(bothRes);

            assert.ok(coveringEntityRes.score > contextIntentRes.score);
            assert.strictEqual(coveringEntityRes.score, 1);
            assert.strictEqual(contextIntentRes.score, 0.9);
            assert.strictEqual(bothRes.score, 1);
        });

    });

});
