/*
 * @author David Menger
 */
'use strict';

const customFn = require('../utils/customFn');

function inlineCode (params, { isLastIndex, allowForbiddenSnippetWords }) {
    const fnToExecute = customFn(params.code, params.description, allowForbiddenSnippetWords);

    const defaultRet = isLastIndex ? null : true;

    return async (req, res, postBack, path, action) => {
        let ret = fnToExecute(req, res, postBack, path, action);

        if (typeof ret === 'object' && ret !== null) {
            ret = await ret;
        }

        if (typeof ret !== 'undefined') {
            return ret;
        }

        return defaultRet;
    };
}

module.exports = inlineCode;
