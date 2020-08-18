/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const { getSetState } = require('../utils/getUpdate');
const customFn = require('../utils/customFn');
const { shouldExecuteResolver } = require('./resolverTags');

function setState (params, { isLastIndex, allowForbiddenSnippetWords }) {
    const {
        hasCondition = false,
        conditionFn = '() => true'
    } = params;

    let condition = null;

    if (hasCondition) {
        condition = customFn(conditionFn, '', allowForbiddenSnippetWords);
    }

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    const fn = async (req, res) => {
        if (!shouldExecuteResolver(req, params)) {
            return ret;
        }
        if (condition !== null) {
            let condRes = condition(req, res);

            if (condRes instanceof Promise) {
                condRes = await condRes;
            }

            if (!condRes) {
                return ret;
            }
        }

        const obj = getSetState(params.setState, req, res);
        res.setState(obj);

        return ret;
    };

    if (params.resolverTag) {
        fn.globalIntentsMeta = {
            resolverTag: params.resolverTag
        };
    }

    return fn;
}

module.exports = setState;
