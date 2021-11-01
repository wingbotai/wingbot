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

            m.setEntityDetector('price', /@NUMBER\s*(k[čc]|korun)/, { anonymize: true });
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
