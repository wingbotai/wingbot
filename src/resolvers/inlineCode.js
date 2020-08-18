/*
 * @author David Menger
 */
'use strict';

const customFn = require('../utils/customFn');
const { shouldExecuteResolver } = require('./resolverTags');

function inlineCode (params, { isLastIndex, allowForbiddenSnippetWords }) {
    const fnToExecute = customFn(params.code, params.description, allowForbiddenSnippetWords);

    const defaultRet = isLastIndex ? null : true;

    const fn = async (req, res, postBack, path, action) => {
        if (!shouldExecuteResolver(req, params)) {
            return defaultRet;
        }

        let ret = fnToExecute(req, res, postBack, path, action);

        if (typeof ret === 'object' && ret !== null) {
            ret = await ret;
        }

        if (typeof ret !== 'undefined') {
            return ret;
        }

        return defaultRet;
    };

    if (params.resolverTag) {
        fn.globalIntentsMeta = {
            resolverTag: params.resolverTag
        };
    }

    return fn;
}

module.exports = inlineCode;
