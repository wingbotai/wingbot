/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const customFn = require('../utils/customFn');

function postback ({
    routeId,
    postBack: staticAction,
    hasCondition,
    conditionFn
}, { linksMap, isLastIndex }) {
    let action = staticAction;

    if (!action && routeId) {
        action = linksMap.get(routeId);

        if (action === '/') {
            action = './';
        }
    }

    let condition = null;

    if (hasCondition) {
        condition = customFn(conditionFn);
    }

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    return (req, res, postBack) => {
        let data = {};

        if (condition !== null) {
            const condRes = condition(req, res);

            if (!condRes) {
                return ret;
            }

            if (condRes instanceof Promise || typeof condRes === 'object') {
                data = condRes;
            }
        }

        postBack(action, data);

        return Router.END;
    };
}

module.exports = postback;
