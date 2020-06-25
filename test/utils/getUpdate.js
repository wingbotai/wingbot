/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const { getUpdate, getValue, getSetState } = require('../../src/utils/getUpdate');

describe('getSetState()', () => {

    it('works', () => {
        assert.deepEqual(getSetState({
            k: { _$inc: 2 }
        }, {
            state: {}
        }), {
            k: 2
        });

        assert.deepEqual(getSetState({
            k: { _$inc: '2' }
        }, {
            state: { k: 2, j: 3 }
        }), {
            k: 4
        });

        assert.deepEqual(getSetState({
            k: { _$inc: -2 },
            'a.b': 2,
            'n.p': null
        }, {
            state: { k: NaN, j: 3, n: { o: null, p: {} } }
        }), {
            k: -2,
            a: {
                b: 2
            },
            n: {
                o: null,
                p: null
            }
        });
    });

});

describe('getValue()', () => {

    it('works', () => {
        assert.strictEqual(getValue('foo.bar.deep', {
            foo: {
                bar: {
                    deep: 1
                }
            }
        }), 1);

        assert.strictEqual(getValue('foo.bar.deep.deeper', {
            foo: {
                bar: {
                    deep: 1
                }
            }
        }), undefined);

        assert.strictEqual(getValue('foo.bar.deep', {
            foo: {
                bar: null
            }
        }), undefined);

        assert.strictEqual(getValue('foo.bar', {
            foo: {
                bar: null
            }
        }), null);
    });

});

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
