/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const { getSetState } = require('../utils/getUpdate');
const customFn = require('../utils/customFn');

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

    return async (req, res) => {

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
}

module.exports = setState;
