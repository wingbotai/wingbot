/**
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const LLMType = require('../src/LLMType');
const LLMSession = require('../src/LLMSession');
const LLMTool = require('../src/LLMTool');

describe('<LLMType>', () => {

    it('should build string schema with chainable methods', () => {
        const schema = LLMType.string()
            .description('Display name')
            .min(1)
            .max(32)
            .toJSON();

        assert.deepStrictEqual(schema, {
            type: 'string',
            description: 'Display name',
            minLength: 1,
            maxLength: 32
        });
    });

    it('should map min and max by type', () => {
        assert.deepStrictEqual(
            LLMType.number().min(0).max(10).toJSON(),
            {
                type: 'number',
                minimum: 0,
                maximum: 10
            }
        );

        assert.deepStrictEqual(
            LLMType.enum(['a', 'b']).min(1).max(5).toJSON(),
            {
                type: 'string',
                enum: ['a', 'b'],
                minLength: 1,
                maxLength: 5
            }
        );

        assert.deepStrictEqual(
            LLMType.array(LLMType.string()).min(1).max(3).toJSON(),
            {
                type: 'array',
                items: {
                    type: 'string'
                },
                minItems: 1,
                maxItems: 3
            }
        );

        assert.deepStrictEqual(
            LLMType.object({
                x: LLMType.string(),
                y: LLMType.number().optional()
            }).min(1).max(2).toJSON(),
            {
                type: 'object',
                properties: {
                    x: { type: 'string' },
                    y: { type: 'number' }
                },
                additionalProperties: false,
                required: ['x'],
                minProperties: 1,
                maxProperties: 2
            }
        );
    });

    it('should keep properties required by default and allow optional override', () => {
        const schema = LLMType.object({
            query: LLMType.string(),
            locale: LLMType.string().optional(),
            meta: LLMType.object({
                client: LLMType.string(),
                channel: LLMType.string().optional()
            })
        }).toJSON();

        assert.deepStrictEqual(schema.required, ['query', 'meta']);
        assert.deepStrictEqual(schema.properties.meta.required, ['client']);
    });

    it('should make optional no-op outside object context', () => {
        const schema = LLMType.string().optional().toJSON();

        assert.deepStrictEqual(schema, {
            type: 'string'
        });
    });

    it('should recursively render nested schemas', () => {
        const schema = LLMType.object({
            users: LLMType.array(
                LLMType.object({
                    id: LLMType.string().min(1),
                    age: LLMType.number().optional()
                })
            ).min(1)
        }).toJSON();

        assert.deepStrictEqual(schema, {
            type: 'object',
            properties: {
                users: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                minLength: 1
                            },
                            age: {
                                type: 'number'
                            }
                        },
                        additionalProperties: false,
                        required: ['id']
                    },
                    minItems: 1
                }
            },
            additionalProperties: false,
            required: ['users']
        });
    });

    it('should integrate with LLMSession tool schemas', () => {
        const session = new LLMSession(null);

        session.tool(LLMTool.create(function searchDocs () {
            return 'ok';
        }, {
            description: 'Searches docs',
            parameters: LLMType.object({
                query: LLMType.string(),
                limit: LLMType.number().optional()
            })
        }));

        assert.deepStrictEqual(session.tools, [
            {
                name: 'searchDocs',
                description: 'Searches docs',
                strict: true,
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string'
                        },
                        limit: {
                            type: 'number'
                        }
                    },
                    additionalProperties: false,
                    required: ['query']
                }
            }
        ]);
    });

});
