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
}, { linksMap, isLastIndex, allowForbiddenSnippetWords }) {
    let action = staticAction;

    if (!action && routeId) {
        action = linksMap.get(routeId);

        if (action === '/') {
            action = './';
        }
    }

    let condition = null;

    if (hasCondition) {
        condition = customFn(conditionFn, '', allowForbiddenSnippetWords);
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

        const text = req.text();
        const request = {
            sender: { id: req.senderId },
            postback: {
                action: res.toAbsoluteAction(action),
                data: data || {}
            }
        };

        if (text) {
            Object.assign(request, { message: { text } });
        }

        postBack(request);

        return Router.END;
    };
}

module.exports = postback;
