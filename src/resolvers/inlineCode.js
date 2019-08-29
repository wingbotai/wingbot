/*
 * @author David Menger
 */
'use strict';

const customFn = require('../utils/customFn');

function inlineCode (params, { isLastIndex, allowForbiddenSnippetWords }) {
    const fn = customFn(params.code, params.description, allowForbiddenSnippetWords);

    return async function (req, res, postBack, path, action) {
        let ret = fn(req, res, postBack, path, action);

        if (typeof ret === 'object' && ret !== null) {
            ret = await ret;
        }

        if (typeof ret !== 'undefined') {
            return ret;
        }

        return isLastIndex ? null : true;
    };
}

module.exports = inlineCode;
