/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const getUpdate = require('../../src/utils/getUpdate');

describe('getUpdate()', () => {

    it('works', () => {
        assert.deepEqual(getUpdate('foo.bar.deep', 1, {}), {
            foo: {
                bar: {
                    deep: 1
                }
            }
        });

        assert.deepEqual(getUpdate('foo.bar', 1, {
            haha: 3,
            foo: {
                hoo: 2
            }
        }), {
            foo: {
                bar: 1,
                hoo: 2
            }
        });

        assert.deepEqual(getUpdate('foo', 1, {
            haha: 3,
            foo: {
                hoo: 2
            }
        }), {
            foo: 1
        });

        assert.deepEqual(getUpdate('', 1, {
            haha: 3,
            foo: {
                hoo: 2
            }
        }), {
            '': 1
        });

        assert.deepEqual(getUpdate(undefined, 1, {
            haha: 3,
            foo: {
                hoo: 2
            }
        }), {
            undefined: 1
        });

        assert.deepEqual(getUpdate(null, 1, {
            haha: 3,
            foo: {
                hoo: 2
            }
        }), {
            null: 1
        });
    });

});
