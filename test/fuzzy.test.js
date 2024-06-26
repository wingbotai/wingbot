/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const entitiesTestData = require('./entitiesTestData');
const { prepareFuzzyIndex, factoryFuzzySearch } = require('..');
const { multiwordLevenshtein, relativeLevenshtein } = require('../src/fuzzy/levenshtein');

describe('fuzzy search', () => {

    it('relativeLevenshtein', () => {
        assert.strictEqual(relativeLevenshtein('c1234', 'b1234'), 0.75);
        assert.strictEqual(relativeLevenshtein('c12', 'b12'), 0.5833333333333334);
        assert.strictEqual(relativeLevenshtein('c12', 'c123'), 0.6875);
    });

    it('relativeLevenshtein', async () => {
        assert.strictEqual(multiwordLevenshtein('budova u12', 'budova c12'), 0.5395833333333334);
    });

    it('should work', async () => {
        const data = prepareFuzzyIndex(entitiesTestData.entities);
        const search = factoryFuzzySearch(data);

        assert.deepStrictEqual(search.detector('brna'), [
            {
                entity: 'town',
                score: 0.88722,
                value: 'Brno',
                alternatives: [
                    {
                        entity: 'town',
                        score: 0.81342,
                        value: 'Brňany'
                    }
                ]
            }
        ]);
    });

    it('works more strictly with numbers', async () => {
        const data = await prepareFuzzyIndex(entitiesTestData.entities);
        const search = await factoryFuzzySearch(data);

        // 101.2, 'ax2'

        assert.deepStrictEqual(search.detector('509-102'), [
            {
                entity: 'nu',
                score: 1,
                value: '509-102'
            }
        ], 'exact 509-402');

        assert.deepStrictEqual(search.detector('509-103'), [
            {
                entity: 'nu',
                score: 0.8661,
                value: '509-102'
            }
        ], 'should be too different 509-448');

        assert.deepStrictEqual(search.detector('109.1'), [], '109.1 - should be different too');
    });

    it('should work', async () => {
        const data = await prepareFuzzyIndex(entitiesTestData.entities);
        const search = await factoryFuzzySearch(data);

        assert.deepStrictEqual(search.detector('1. světová válka'), [
            {
                entity: 'ww',
                score: 1,
                value: '1valka'
            }
        ]);
    });

    it('should with harry', async () => {
        const data = await prepareFuzzyIndex(entitiesTestData.entities);
        const search = await factoryFuzzySearch(data);

        assert.deepStrictEqual(search.detector('Harry Potter a Kámen mudrců'), [
            {
                entity: 'ti',
                score: 1,
                value: 'z378jqtr2'
            }
        ]);
    });

    it('should deal with capek', async () => {
        const data = await prepareFuzzyIndex(entitiesTestData.entities);
        const search = await factoryFuzzySearch(data);

        const res = search.detector('Čapek');

        assert.deepStrictEqual(res, [
            {
                entity: 'au',
                score: 0.9,
                value: 'karcap',
                alternatives: [
                    {
                        entity: 'au',
                        score: 0.9,
                        value: 'joscap'
                    }
                ]
            }
        ]);
    });

    it('should work with empty array', async () => {
        const data = await prepareFuzzyIndex([]);
        const search = await factoryFuzzySearch(data);

        assert.deepStrictEqual(search.detector('brna'), []);
    });

    it('supports identifiers', async () => {
        const data = await prepareFuzzyIndex([
            {
                entity: 'en',
                value: 'id',
                synonyms: ['foo', 'bar'],
                id: true
            },
            {
                entity: 'en',
                value: 123,
                synonyms: ['lele'],
                id: true
            }
        ]);
        const search = await factoryFuzzySearch(data);

        assert.deepStrictEqual(search.detector('id'), []);
        assert.deepStrictEqual(search.detector('123'), []);
        assert.deepStrictEqual(search.detector('foo'), [{
            entity: 'en',
            score: 1,
            value: 'id'
        }]);
        assert.deepStrictEqual(search.detector('lele'), [{
            entity: 'en',
            score: 1,
            value: 123
        }]);
    });

});
