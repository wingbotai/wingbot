/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const customFn = require('../utils/customFn');

function subscribtions (params, { isLastIndex }) {
    const {
        tags = [],
        unsetTags = false,
        hasCondition = false,
        conditionFn = '() => true'
    } = params;

    let condition = null;

    if (hasCondition) {
        condition = customFn(conditionFn);
    }

    const ret = isLastIndex ? Router.END : Router.CONTINUE;
    const method = unsetTags ? 'unsubscribe' : 'subscribe';

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

        if (tags.length === 0 && unsetTags) {
            res.unsubscribe();
        }

        tags.forEach(tag => res[method](tag));

        return ret;
    };
}

module.exports = subscribtions;
