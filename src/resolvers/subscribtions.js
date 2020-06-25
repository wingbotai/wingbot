/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const customFn = require('../utils/customFn');

function subscribtions (params, { isLastIndex, allowForbiddenSnippetWords }) {
    const {
        tags = [],
        unsetTag = false,
        hasCondition = false,
        conditionFn = '() => true'
    } = params;

    let condition = null;

    if (hasCondition) {
        condition = customFn(conditionFn, '', allowForbiddenSnippetWords);
    }

    const ret = isLastIndex ? Router.END : Router.CONTINUE;
    const method = unsetTag ? 'unsubscribe' : 'subscribe';

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

        if (typeof res[method] !== 'function') {
            return ret;
        }

        if (tags.length === 0 && unsetTag) {
            res.unsubscribe();
        }

        tags.forEach((tag) => res[method](tag));

        return ret;
    };
}

module.exports = subscribtions;
