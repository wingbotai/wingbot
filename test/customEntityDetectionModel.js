/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const CustomEntityDetectionModel = require('../src/wingbot/CustomEntityDetectionModel');
const Router = require('../src/Router');
const Ai = require('../src/Ai');
const Tester = require('../src/Tester');

describe('customEntityDetectionModel', () => {

    describe('#resolveEntities()', () => {

        /** @type {CustomEntityDetectionModel} */
        let m;

        beforeEach(() => {
            m = new CustomEntityDetectionModel({});

            m.setEntityDetector('number', (text) => {
                const match = text.match(/[0-9]+/);

                if (!match) {
                    return null;
                }

                return {
                    text: match[0],
                    value: parseInt(match[0], 10)
                };
            });

            m.setEntityDetector('price', /@NUMBER\s*(k[čc]|korun)/)
                .setDetectorOptions('price', { anonymize: true });
            m.setEntityDetector('total', /celkem\s@PRICE/, { replaceDiacritics: true });

            m.setEntityDetector('parent', /[=]+/, { matchWholeWords: true });
            m.setEntityDetector('child', /@PARENT\s?lkko/);
        });

        it('works with word detectors', async () => {
            m.wordEntityDetector = (t) => (t === 'lele' ? [{
                entity: 'word',
                value: 'lele',
                text: 'lele',
                score: 1
            }] : []);

            m.maxWordCount = 2;

            const entities = await m.resolveEntities('sasa lele');

            assert.deepEqual(entities, [
                {
                    entity: 'word',
                    value: 'lele',
                    text: 'lele',
                    score: 1,
                    start: 5,
                    end: 9
                }
            ]);
        });

        it('should work well with optional entities', async () => {
            m.setEntityDetector('optional', /@PARENT?\s?sasalele/);

            const entities = await m.resolveEntities('sasalele');

            assert.deepEqual(entities, [
                {
                    entity: 'optional',
                    value: null,
                    text: 'sasalele',
                    score: 1,
                    start: 0,
                    end: 8
                }
            ]);
        });

        it('should work well with inconsistent optional entities', async () => {
            m.setEntityDetector('optional', /(@PARENT?\s?sasalele|foobar)/);

            const entities = await m.resolveEntities('foobar');

            assert.deepEqual(entities, [
                {
                    entity: 'optional',
                    value: null,
                    text: 'foobar',
                    score: 1,
                    start: 0,
                    end: 6
                }
            ]);
        });

        it('should resolve entities somehow', async () => {
            const entities = await m.resolveEntities('hello 123 456');

            assert.deepEqual(entities, [
                {
                    entity: 'number',
                    value: 123,
                    text: '123',
                    score: 1,
                    start: 6,
                    end: 9
                },
                {
                    entity: 'number',
                    value: 456,
                    text: '456',
                    score: 1,
                    start: 10,
                    end: 13
                }
            ]);
        });

        it('should special regexp entities', async () => {
            m.setEntityDetector('nodiacritics', /zlutoucky/, {
                replaceDiacritics: true,
                matchWholeWords: true
            });

            let entities = await m.resolveEntities('hojda:Žluťoučký.');

            assert.deepEqual(entities, [
                {
                    entity: 'nodiacritics',
                    value: 'zlutoucky',
                    text: 'Žluťoučký',
                    score: 1,
                    start: 6,
                    end: 15
                }
            ]);

            entities = await m.resolveEntities('Žluťoučkýř');

            assert.deepEqual(entities, []);
        });

        it('should resolve compound entities', async () => {

            const { entities, text } = await m.resolve('12 120 KčBlabla 34');

            // @ts-ignore
            assert.strictEqual(text, '12 @PRICEblabla 34');
            assert.deepEqual(entities, [
                {
                    entity: 'number',
                    value: 12,
                    text: '12',
                    score: 1,
                    start: 0,
                    end: 2
                },
                {
                    entity: 'price',
                    value: 120,
                    text: '120 Kč',
                    score: 1,
                    start: 3,
                    end: 9
                },
                {
                    entity: 'number',
                    value: 34,
                    text: '34',
                    score: 1,
                    start: 16,
                    end: 18
                }
            ]);

            const { entities: e2, text: t2 } = await m.resolve('celkem 120 Kč');

            // @ts-ignore
            assert.strictEqual(t2, 'celkem 120 kč');
            assert.deepEqual(e2, [
                {
                    entity: 'total',
                    value: 120,
                    text: 'celkem 120 Kč',
                    score: 1,
                    start: 0,
                    end: 13
                }
            ]);

            const { entities: e3, text: t3 } = await m.resolve('120Kč');

            // @ts-ignore
            assert.strictEqual(t3, '@PRICE');
            assert.deepEqual(e3, [
                {
                    entity: 'price',
                    value: 120,
                    text: '120Kč',
                    score: 1,
                    start: 0,
                    end: 5
                }
            ]);
        });

        it('uses first non-optional entity as value', async () => {
            m.setEntityDetector('eur', /€/, {
                matchWholeWords: true
            });
            m.setEntityDetector('x', /@EUR?@NUMBER/, {
                matchWholeWords: true
            });
            m.setEntityDetector('y', /(g|@NUMBER)?@EUR/, {
                matchWholeWords: true
            });

            let { entities, text } = await m.resolve('€1');

            // console.log({ entities, text });

            // @ts-ignore
            assert.strictEqual(text, '€1');
            assert.deepEqual(entities, [
                {
                    entity: 'x',
                    value: 1,
                    text,
                    score: 1,
                    start: 0,
                    end: 2
                }
            ]);

            ({ entities, text } = await m.resolve('1€'));

            // console.log({ entities, text });

            // @ts-ignore
            assert.strictEqual(text, '1€');
            assert.deepEqual(entities, [
                {
                    entity: 'y',
                    value: '€',
                    text,
                    score: 1,
                    start: 0,
                    end: 2
                }
            ]);
        });

        it('should resolve compound entities simply', async () => {
            m.setEntityDetector('eur', /€/, {
                matchWholeWords: true
            });
            m.setEntityDetector('x', /[$€]?@NUMBER\s?@EUR?/, {
                matchWholeWords: true
            });

            const { entities, text } = await m.resolve('1€');

            // console.log({ entities, text });

            // @ts-ignore
            assert.strictEqual(text, '1€');
            assert.deepEqual(entities, [
                {
                    entity: 'x',
                    value: 1,
                    text: '1€',
                    score: 1,
                    start: 0,
                    end: 2
                }
            ]);
        });

        it('copes with subword information', async () => {
            assert.strictEqual((await m.resolve('=sasalele')).entities.length, 0);
            assert.strictEqual((await m.resolve('=')).entities.length, 1);
            assert.strictEqual((await m.resolve('lkko')).entities.length, 0);

            const { entities } = await m.resolve('===lkko');

            assert.deepEqual(entities, [
                {
                    entity: 'child',
                    value: '===',
                    text: '===lkko',
                    score: 1,
                    start: 0,
                    end: 7
                }
            ]);
        });

    });

    describe('preference of context entities', () => {

        before(() => {
            const mod = new CustomEntityDetectionModel({});

            mod.setEntityDetector('foo', /[a-z][0-9]+/);
            mod.setEntityDetector('bar', /[0-9]+[a-z]/);

            Ai.ai.register(mod);
        });

        after(() => {
            Ai.ai.deregister();
        });

        it('prefers it', async () => {
            const bot = new Router();

            bot.use('bar', (req, res) => {
                res.text(req.entities.length === 1 ? req.entities[0].entity : 'none', [
                    { action: 'bar', title: 'bar', match: ['@bar'] }
                ]);
            });

            bot.use(Ai.ai.global('foo', ['@foo']), (req, res) => {
                res.text(req.entities.length === 1 ? req.entities[0].entity : 'fuck');
            });

            const t = new Tester(bot);

            await t.text('a10a');

            t.any().contains('foo');

            await t.postBack('bar');

            t.any().contains('none');

            await t.text('a10a');

            t.any().contains('bar');
        });

    });

    describe('#nonOverlapping()', () => {

        it('keeps two duplicate entities', () => {
            const m = new CustomEntityDetectionModel({});

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 5 },
                { entity: 'b', start: 2, end: 5 }
            ], []), [
                { entity: 'a', start: 2, end: 5 },
                { entity: 'b', start: 2, end: 5 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 5 },
                { entity: 'b', start: 2, end: 5 }
            ], ['a', 'b']), [
                { entity: 'a', start: 2, end: 5 },
                { entity: 'b', start: 2, end: 5 }
            ]);
        });

        it('keeps two duplicate entities', () => {
            const m = new CustomEntityDetectionModel({});

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 0, end: 2 },
                { entity: 'b', start: 0, end: 2 },
                { entity: 'b', start: 0, end: 5 },
                { entity: 'b', start: 3, end: 5 }
            ], []), [
                { entity: 'b', start: 0, end: 5 }
            ]);
        });

        it('keeps two duplicate entities of different names', () => {
            const m = new CustomEntityDetectionModel({});

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 5 },
                { entity: 'a', start: 2, end: 5 }
            ], ['a']), [
                { entity: 'a', start: 2, end: 5 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 5 },
                { entity: 'a', start: 2, end: 5 }
            ]), [
                { entity: 'a', start: 2, end: 5 }
            ]);
        });

        it('prefers expected duplicate entity', () => {
            const m = new CustomEntityDetectionModel({});

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 5 },
                { entity: 'b', start: 2, end: 5 }
            ], ['a']), [
                { entity: 'a', start: 2, end: 5 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 5 },
                { entity: 'b', start: 2, end: 5 }
            ], ['b']), [
                { entity: 'b', start: 2, end: 5 }
            ]);
        });

        it('keeps the longer entity', () => {
            const m = new CustomEntityDetectionModel({});

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 6 },
                { entity: 'b', start: 2, end: 5 }
            ], []), [
                { entity: 'a', start: 2, end: 6 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 5 },
                { entity: 'b', start: 2, end: 6 }
            ], []), [
                { entity: 'b', start: 2, end: 6 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 1, end: 5 },
                { entity: 'b', start: 2, end: 5 }
            ], []), [
                { entity: 'a', start: 1, end: 5 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 5 },
                { entity: 'b', start: 1, end: 5 }
            ], []), [
                { entity: 'b', start: 1, end: 5 }
            ]);
        });

        it('prefers shorter expected entity', () => {
            const m = new CustomEntityDetectionModel({});

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 6 },
                { entity: 'b', start: 2, end: 5 }
            ], ['b']), [
                { entity: 'b', start: 2, end: 5 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 5 },
                { entity: 'b', start: 2, end: 6 }
            ], ['a']), [
                { entity: 'a', start: 2, end: 5 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 1, end: 5 },
                { entity: 'b', start: 2, end: 5 }
            ], ['b']), [
                { entity: 'b', start: 2, end: 5 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 5 },
                { entity: 'b', start: 1, end: 5 }
            ], ['a']), [
                { entity: 'a', start: 2, end: 5 }
            ]);
        });

        it('makes coverage more important', () => {
            const m = new CustomEntityDetectionModel({});

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 4 },
                { entity: 'b', start: 3, end: 6 },
                { entity: 'c', start: 4, end: 8 }
            ], []), [
                { entity: 'a', start: 2, end: 4 },
                { entity: 'c', start: 4, end: 8 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 4 },
                { entity: 'b', start: 3, end: 9 },
                { entity: 'c', start: 8, end: 10 }
            ], []), [
                { entity: 'b', start: 3, end: 9 }
            ]);
        });

        it('coverage can be overriden with expectedEntity', () => {
            const m = new CustomEntityDetectionModel({});

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 4 },
                { entity: 'b', start: 3, end: 6 },
                { entity: 'c', start: 4, end: 8 },
                { entity: 'd', start: 20, end: 21 }
            ], ['b', 'd']), [
                { entity: 'b', start: 3, end: 6 },
                { entity: 'd', start: 20, end: 21 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 2, end: 4 },
                { entity: 'b', start: 3, end: 9 },
                { entity: 'c', start: 8, end: 10 },
                { entity: 'd', start: 20, end: 30 }
            ], ['a', 'd']), [
                { entity: 'a', start: 2, end: 4 },
                { entity: 'c', start: 8, end: 10 },
                { entity: 'd', start: 20, end: 30 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 1, end: 4 },
                { entity: 'b', start: 3, end: 9 },
                { entity: 'c', start: 8, end: 10 },
                { entity: 'd', start: 20, end: 21 }
            ], ['c']), [
                { entity: 'a', start: 1, end: 4 },
                { entity: 'c', start: 8, end: 10 },
                { entity: 'd', start: 20, end: 21 }
            ]);

            // @ts-ignore
            assert.deepStrictEqual(m.nonOverlapping([
                { entity: 'a', start: 3, end: 4 },
                { entity: 'b', start: 3, end: 9 },
                { entity: 'c', start: 8, end: 11 },
                { entity: 'd', start: 20, end: 30 }
            ], ['a']), [
                { entity: 'a', start: 3, end: 4 },
                { entity: 'c', start: 8, end: 11 },
                { entity: 'd', start: 20, end: 30 }
            ]);
        });

    });

});
