/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const { apiTextOutputFilter } = require('../../src/utils/deepMapTools');

// const assert = require('assert');

describe('deepMapTools', () => {

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
