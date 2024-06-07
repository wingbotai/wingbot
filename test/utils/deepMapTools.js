/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const {
    apiTextOutputFilter, deepEqual, mapObject, defaultMapperFactory
} = require('../../src/utils/deepMapTools');

// const assert = require('assert');

describe('deepMapTools', () => {

    describe('deepEqual()', () => {

        it('works', () => {
            // @ts-ignore
            assert.strictEqual(deepEqual({ a: [{ b: 1 }] }, { a: [{ b: 1 }] }), true);
            // @ts-ignore
            assert.strictEqual(deepEqual('abc', 'abc'), true);
            // @ts-ignore
            assert.strictEqual(deepEqual(123, 123), true);
            // @ts-ignore
            assert.strictEqual(deepEqual(null, null), true);
            // @ts-ignore
            assert.strictEqual(deepEqual(false, false), true);
            // @ts-ignore
            assert.strictEqual(deepEqual(true, true), true);
            // @ts-ignore
            assert.strictEqual(deepEqual(undefined, undefined), true);

            // @ts-ignore
            assert.strictEqual(deepEqual({ a: [{ b: 1 }] }, { a: [{ b: 2 }] }), false);
            // @ts-ignore
            assert.strictEqual(deepEqual('abc', 'abcd'), false);
            // @ts-ignore
            assert.strictEqual(deepEqual(123, 1234), false);
            // @ts-ignore
            assert.strictEqual(deepEqual(null, false), false);
            // @ts-ignore
            assert.strictEqual(deepEqual(false, true), false);
            // @ts-ignore
            assert.strictEqual(deepEqual(true, 1), false);
            // @ts-ignore
            assert.strictEqual(deepEqual(undefined, null), false);

            // @ts-ignore
            assert.strictEqual(deepEqual({ a: [{ b: 1 }] }, null), false);
            // @ts-ignore
            assert.strictEqual(deepEqual('123', 123), false);
            // @ts-ignore
            assert.strictEqual(deepEqual(null, 0), false);
        });

    });

    describe('apiTextOutputFilter()', () => {

        it('filters all strings in object', function () {

            const o = {
                foo: ['a', 'b'],
                bar: [{
                    foo: 'c',
                    bar: 'd',
                    num: 12,
                    bool: true,
                    nil: null,
                    date: new Date('2020-08-21T13:49:32.438Z')
                }],
                baz: 'e'
            };

            const res = mapObject(o, defaultMapperFactory((k, v) => {
                switch (typeof v) {
                    case 'string':
                        return 'X';
                    default:
                        return v;
                }
            }));

            // @ts-ignore
            assert.deepStrictEqual(res, {
                foo: ['X', 'X'],
                bar: [{
                    foo: 'X',
                    bar: 'X',
                    num: 12,
                    bool: true,
                    nil: null,
                    date: 'X'
                }],
                baz: 'X'
            });

        });

    });

    describe('apiTextOutputFilter()', () => {

        it('filters all strings in object', function () {

            const o = {
                foo: ['a', 'b'],
                bar: [{
                    foo: 'c',
                    bar: 'd',
                    num: 12,
                    bool: true,
                    nil: null,
                    date: new Date('2020-08-21T13:49:32.438Z')
                }],
                baz: 'e'
            };

            const res = apiTextOutputFilter(o, () => 'X');

            // @ts-ignore
            assert.strictEqual(res, o);

            // @ts-ignore
            assert.deepStrictEqual(res, {
                foo: ['X', 'X'],
                bar: [{
                    foo: 'X',
                    bar: 'X',
                    num: 12,
                    bool: true,
                    nil: null,
                    date: '2020-08-21T13:49:32.438Z'
                }],
                baz: 'X'
            });

        });

    });

});
