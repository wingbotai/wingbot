/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const CustomEntityDetectionModel = require('../src/wingbot/CustomEntityDetectionModel');

describe('customEntityDetectionModel', () => {

    describe('#_resolveEntities()', () => {

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
            const entities = await m._resolveEntities('hello 123 456');

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

        it('should resolve compound entities', async () => {

            const { entities, text } = await m.resolve('12 120 KčBlabla 34');

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

});
