/**
 * @author David Menger
 */
'use strict';

/**
 * @param {import('../Request')} req
 * @param {import('../Responder')} res
 */
async function disambiguation (req, res) {
    let { min = '1', max = '3' } = req.params;
    min = parseInt(min, 10) || 1;

    if (req.hasAiActionsForDisambiguation(min)) {
        max = parseInt(max, 10) || 3;

        req.aiActionsForQuickReplies(max)
            .forEach((a) => res.addQuickReply(a, null, {}, false, true));

        await res.run('diambiguations');
        return null;
    }
    return true;
}

module.exports = disambiguation;
