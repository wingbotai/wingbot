/**
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const hbs = require('../src/resolvers/hbs');

describe('<hbs>', () => {

    describe('{{lang}}', () => {

        it('should work', async () => {
            assert.strictEqual(hbs.compile('{{lang}}')({ lang: 'cz' }), 'cz');
            assert.strictEqual(hbs.compile('{{lang}}')({}), '');
            assert.strictEqual(hbs.compile('{{lang foo}}')({}), '');
            assert.strictEqual(hbs.compile('{{lang foo}}')({ foo: { en: 'en', cs: 'cesky' }, lang: 'cs', name: 'ahoj' }), 'cesky');
            assert.strictEqual(hbs.compile('{{lang foo}}')({ foo: { en: 'en', cs: 'cesky' }, lang: 'de', name: 'lang' }), 'en');
            assert.strictEqual(hbs.compile('{{lang foo}}')({
                foo: [{ l: 'en', t: 'eng' }, { l: 'cs', t: 'cesky' }], lang: 'cs', name: 'lang', loc: {}
            }), 'cesky');
            assert.strictEqual(hbs.compile('{{lang foo}}')({
                foo: [{ l: 'en', t: 'eng' }, { l: 'cs', t: 'cesky' }], lang: 'de', name: 'lang', loc: {}, data: {}
            }), 'eng');
            assert.strictEqual(hbs.compile('{{lang foo}}')({ foo: [{ lang: 'en', text: 'eng' }, { lang: 'cs', text: 'cesky' }], lang: 'de' }), 'eng');
            assert.strictEqual(hbs.compile('{{lang foo}}')({ foo: [{ lang: 'en', text: 'eng' }, { lang: 'cs', text: 'cesky' }] }), 'eng');
        });

    });

});
