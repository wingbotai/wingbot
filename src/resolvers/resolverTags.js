/**
 * @author David Menger
 */
'use strict';

const FAQ = 'faq';

/**
 *
 * @param {import('../Request')} req
 * @param {{ resolverTag: string|null }} params
 * @returns {boolean}
 */
function shouldExecuteResolver (req, params) {
    const { _resolverTag: actionResolverTag } = req.actionData();
    const { resolverTag = null } = params;

    if (actionResolverTag === FAQ) {
        return resolverTag === FAQ;
    }

    return true;
}

module.exports = {
    shouldExecuteResolver
};
