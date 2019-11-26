/**
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const customFn = require('../utils/customFn');

function repliesResolver (params, {
    isLastIndex, linksMap, allowForbiddenSnippetWords, replies
}) {

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    const preprocessed = replies
        .filter(r => r.aiTags && r.aiTags.length !== 0)
        .map((r) => {
            const condition = r.hasCondition
                ? customFn(r.conditionFn, 'Reply condition', allowForbiddenSnippetWords)
                : () => true;

            const data = {};

            if (r.trackAsNegative) {
                Object.assign(data, { _trackAsNegative: true });
            }

            if (r.setState) {
                Object.assign(data, { _ss: r.setState });
            }

            const { aiTags } = r;
            let { action } = r;

            if (!action) {
                action = linksMap.get(r.targetRouteId);

                if (action === '/') {
                    action = './';
                }
            }

            return {
                condition,
                action,
                data,
                aiTags
            };
        });

    return (req, res) => {

        for (const reply of preprocessed) {
            if (!reply.condition(req, res)) {
                continue;
            }

            res.expectedIntent(reply.aiTags, reply.action, reply.data);
        }


        return ret;
    };
}

module.exports = repliesResolver;
