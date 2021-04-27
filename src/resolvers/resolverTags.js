/**
 * @author David Menger
 */
'use strict';

const FAQ = 'faq';

/**
 *
 * @param {import('../Request')} req
 * @param {string} [tag]
 * @param {boolean} [isFallback]
 * @returns {boolean}
 */
function shouldExecuteResolver (req, tag = null, isFallback = false) {
    if (isFallback) {
        return true;
    }

    const { _resolverTag: actionResolverTag } = req.actionData();

    if (actionResolverTag === FAQ) {
        return tag === FAQ;
    }

    return true;
}

module.exports = {
    shouldExecuteResolver
};
