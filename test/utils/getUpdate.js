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

    it('supports array operators', () => {
        assert.deepEqual(getSetState({
            k: { _$push: 2 }
        }, {
            state: {},
            actionData: () => {}
        }), {
            k: [2]
        });

        assert.deepEqual(getSetState({
            k: { _$add: 'a' }
        }, {
            state: {
                k: 'x'
            },
            actionData: () => {}
        }), {
            k: ['x', 'a']
        });

        assert.deepEqual(getSetState({
            k: { _$add: 'y' }
        }, {
            state: {
                k: ['x', 'y']
            },
            actionData: () => {}
        }), {
            k: ['x', 'y']
        });

        assert.deepEqual(getSetState({
            k: { _$rem: 'x' }
        }, {
            state: {
                k: ['x', 'y']
            },
            actionData: () => {}
        }), {
            k: ['y']
        });

        assert.deepEqual(getSetState({
            k: { _$pop: true }
        }, {
            state: {
                k: ['x', 'y']
            },
            actionData: () => {}
        }), {
            k: ['x']
        });

        assert.deepEqual(getSetState({
            k: { _$shift: true }
        }, {
            state: {
                k: ['x', 'y']
            },
            actionData: () => {}
        }), {
            k: ['y']
        });

        assert.deepEqual(getSetState({
            k: { _$push: '{{l}}' }
        }, {
            state: {
                k: ['x', 'y'],
                l: ['a', 'b']
            },
            actionData: () => {}
        }), {
            k: ['x', 'y', 'a', 'b']
        });
    });

    it('knows entities when using array operators', () => {
        assert.deepEqual(getSetState({
            k: { _$push: '{{@entity}}' }
        }, {
            state: {
                k: null
            },
            entities: [
                { entity: 'entity', value: 'sasa' },
                { entity: 'entity', value: 'lele' },
                { entity: 'foo', value: 'bar' }
            ],
            actionData: () => {}
        }), {
            k: ['sasa', 'lele']
        });

        assert.deepEqual(getSetState({
            k: { _$push: '{{[@foo]}}' }
        }, {
            state: {
                k: ' '
            },
            entities: [
                { entity: 'entity', value: 'sasa' },
                { entity: 'entity', value: 'lele' },
                { entity: 'foo', value: 'bar' }
            ],
            actionData: () => {}
        }), {
            k: ['bar']
        });

        assert.deepEqual(getSetState({
            k: { _$set: '{{@bar}}' }
        }, {
            state: {
                k: ' ',
                '@bar': 'sasalele'
            },
            entities: [
                { entity: 'entity', value: 'sasa' },
                { entity: 'entity', value: 'lele' },
                { entity: 'foo', value: 'bar' }
            ],
            actionData: () => {}
        }), {
            k: []
        });

        assert.deepEqual(getSetState({
            k: { _$set: '{{[@bar]}}' }
        }, {
            state: {
                k: ' ',
                '@bar': 'sasalele'
            },
            entities: [
                { entity: 'entity', value: 'sasa' },
                { entity: 'entity', value: 'lele' },
                { entity: 'foo', value: 'bar' }
            ],
            actionData: () => {}
        }), {
            k: ['sasalele']
        });

        assert.deepEqual(getSetState({
            k: { _$set: '{{some.value}}' }
        }, {
            state: {
                k: ' ',
                '@bar': 'sasalele',
                some: { value: 'X' }
            },
            entities: [
                { entity: 'entity', value: 'sasa' },
                { entity: 'entity', value: 'lele' },
                { entity: 'foo', value: 'bar' }
            ],
            actionData: () => {}
        }), {
            k: ['X']
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
