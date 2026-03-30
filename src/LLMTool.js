/**
 * @author David Menger
 */
'use strict';

/** @typedef {import('./LLMSession').Tool} Tool */
/** @typedef {import('./LLMSession').ToolInput} ToolInput */
/** @typedef {import('./LLMSession').ObjectTool} ObjectTool */
/** @typedef {import('./LLMSession').ToolFunctionInput} ToolFunctionInput */
/** @typedef {import('./LLMSession').ToolFnCallback} ToolFnCallback */
/** @typedef {import('./LLMSession').ToolFunction} ToolFunction */
/** @typedef {import('./LLMSession').FnParamsObject} FnParamsObject */
/** @typedef {import('./LLMSession').SimpleJsonSchema} SimpleJsonSchema */

/** @typedef {string[]} Enum */

/**
 * @typedef {{}} SchemaDefinition
 */

/**
 * @class LLMTool
 */
class LLMTool {

    /**
     *
     * @param {ToolFnCallback} fn
     * @param {ToolFunctionInput} options
     * @returns {ObjectTool}
     */
    static create (fn, {
        name = fn.name,
        ...rest
    }) {
        let {
            parameters = {
                properties: {}
            }
        } = rest;

        if ('toJSON' in parameters && typeof parameters.toJSON === 'function') {
            parameters = parameters.toJSON();
        }

        return {
            fn,
            name,
            ...rest,
            parameters
        };
    }

}

module.exports = LLMTool;
