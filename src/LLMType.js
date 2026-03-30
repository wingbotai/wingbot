'use strict';

/**
 * Lightweight fluent builder for JSON Schema definitions used by LLM tools.
 *
 * @class LLMType
 */
class LLMType {

    /**
     * @param {'string'|'number'|'enum'|'boolean'|'array'|'object'} type
     * @param {object} [config]
     * @param {string[]} [config.values]
     * @param {LLMType} [config.items]
     * @param {{ [key: string]: LLMType }} [config.properties]
     * @param {string} [config.name]
     */
    constructor (type, {
        values = null,
        items = null,
        properties = null,
        name = null
    } = {}) {
        this._type = type;
        this._name = name;

        this._description = null;
        this._min = null;
        this._max = null;

        this._required = true;

        this._values = values;
        this._items = items;
        this._properties = properties;
    }

    /**
     * Creates a string schema.
     *
     * @example
     * const title = LLMType.string()
     *   .description('Short title')
     *   .min(1)
     *   .max(64);
     *
     * @returns {LLMType}
     */
    static string () {
        return new LLMType('string');
    }

    /**
     * Creates a number schema.
     *
     * @example
     * const temperature = LLMType.number()
     *   .description('Temperature in Celsius')
     *   .min(-40)
     *   .max(100);
     *
     * @returns {LLMType}
     */
    static number () {
        return new LLMType('number');
    }

    /**
     * Creates an enum schema.
     *
     * @example
     * const tone = LLMType.enum(['formal', 'casual'])
     *   .description('Response tone');
     *
     * @param {string[]} values
     * @returns {LLMType}
     */
    static enum (values) {
        if (!Array.isArray(values) || values.length === 0 || !values.every((v) => typeof v === 'string')) {
            throw new Error('LLMType.enum(values) expects a non-empty array of strings');
        }
        return new LLMType('enum', { values: [...values] });
    }

    /**
     * Creates a boolean schema.
     *
     * @example
     * const includeSummary = LLMType.boolean()
     *   .description('Whether summary should be included');
     *
     * @returns {LLMType}
     */
    static boolean () {
        return new LLMType('boolean');
    }

    /**
     * Creates an array schema with one item type.
     *
     * @example
     * const tags = LLMType.array(LLMType.string().min(1))
     *   .description('List of tags')
     *   .min(1)
     *   .max(20);
     *
     * @param {LLMType} itemType
     * @returns {LLMType}
     */
    static array (itemType) {
        if (!(itemType instanceof LLMType)) {
            throw new Error('LLMType.array(itemType) expects itemType to be LLMType');
        }
        return new LLMType('array', { items: itemType });
    }

    /**
     * Creates an object schema from named `LLMType` properties.
     * Properties are required by default unless `optional()` is called.
     *
     * @example
     * const user = LLMType.object({
     *   name: LLMType.string().description('User name'),
     *   age: LLMType.number().optional()
     * });
     *
     * @param {{ [key: string]: LLMType }} properties
     * @param {string} [name=null]
     * @returns {LLMType}
     */
    static object (properties = {}, name = null) {
        if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
            throw new Error('LLMType.object(properties) expects an object');
        }
        const entries = Object.entries(properties);
        for (const [key, value] of entries) {
            if (!(value instanceof LLMType)) {
                throw new Error(`LLMType.object(properties) expects property "${key}" to be LLMType`);
            }
        }
        return new LLMType('object', { properties: { ...properties }, name });
    }

    /**
     * Sets human-readable field description.
     *
     * @example
     * const schema = LLMType.string().description('Display name');
     *
     * @param {string} text
     * @returns {this}
     */
    description (text) {
        this._description = text;
        return this;
    }

    /**
     * Sets minimum boundary and maps it to a type-specific JSON Schema keyword.
     *
     * Mapping:
     * - string/enum -> `minLength`
     * - number -> `minimum`
     * - array -> `minItems`
     * - object -> `minProperties`
     *
     * @example
     * const schema = LLMType.array(LLMType.string()).min(2);
     *
     * @param {number} value
     * @returns {this}
     */
    min (value) {
        this._min = value;
        return this;
    }

    /**
     * Sets maximum boundary and maps it to a type-specific JSON Schema keyword.
     *
     * Mapping:
     * - string/enum -> `maxLength`
     * - number -> `maximum`
     * - array -> `maxItems`
     * - object -> `maxProperties`
     *
     * @example
     * const schema = LLMType.number().max(100);
     *
     * @param {number} value
     * @returns {this}
     */
    max (value) {
        this._max = value;
        return this;
    }

    /**
     * Marks field as optional when used as an object property.
     *
     * When used outside object-property context, it has no practical effect,
     * because requiredness is evaluated by parent object schemas.
     *
     * @example
     * const input = LLMType.object({
     *   query: LLMType.string(),
     *   locale: LLMType.string().optional()
     * });
     *
     * @returns {this}
     */
    optional () {
        this._required = false;
        return this;
    }

    /**
     * Returns JSON Schema representation.
     *
     * For object schemas, nested properties are resolved recursively by calling
     * `toJSON()` on each nested `LLMType` instance.
     *
     * @example
     * const schema = LLMType.object({
     *   query: LLMType.string().min(1),
     *   limit: LLMType.number().optional()
     * }).toJSON();
     *
     * @returns {object}
     */
    toJSON () {
        const schema = this._baseSchema();

        switch (this._type) {
            case 'enum':
                schema.type = 'string';
                schema.enum = this._values;
                break;

            case 'array':
                schema.type = 'array';
                schema.items = this._items.toJSON();
                break;

            case 'object': {
                const properties = {};
                const required = [];
                Object.entries(this._properties).forEach(([key, child]) => {
                    properties[key] = child.toJSON();
                    if (child._required) {
                        required.push(key);
                    }
                });

                schema.type = 'object';
                schema.properties = properties;
                schema.additionalProperties = false;
                if (required.length > 0) {
                    schema.required = required;
                }
                break;
            }

            default:
                schema.type = this._type;
        }

        this._applyMinMax(schema);
        return schema;
    }

    /**
     * @returns {object}
     */
    _baseSchema () {
        return /** @type {object} */ ({
            ...(this._description !== null && { description: this._description }),
            ...(this._name !== null && { name: this._name })
        });
    }

    /**
     * @param {object} schema
     */
    _applyMinMax (schema) {
        if (this._min === null && this._max === null) {
            return;
        }

        const target = schema;

        let minKey = null;
        let maxKey = null;

        switch (this._type) {
            case 'string':
            case 'enum':
                minKey = 'minLength';
                maxKey = 'maxLength';
                break;

            case 'number':
                minKey = 'minimum';
                maxKey = 'maximum';
                break;

            case 'array':
                minKey = 'minItems';
                maxKey = 'maxItems';
                break;

            case 'object':
                minKey = 'minProperties';
                maxKey = 'maxProperties';
                break;

            default:
                return;
        }

        if (this._min !== null) {
            target[minKey] = this._min;
        }
        if (this._max !== null) {
            target[maxKey] = this._max;
        }
    }

}

module.exports = LLMType;
