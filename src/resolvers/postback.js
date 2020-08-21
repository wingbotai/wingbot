/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const customFn = require('../utils/customFn');
const { shouldExecuteResolver } = require('./resolverTags');

function postback (params, { linksMap, isLastIndex, allowForbiddenSnippetWords }) {
    const {
        routeId,
        postBack: staticAction,
        hasCondition,
        conditionFn
    } = params;
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
        if (!shouldExecuteResolver(req, params)) {
            return ret;
        }

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
