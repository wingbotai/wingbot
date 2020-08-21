/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 */
module.exports = async (req, res) => {
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
};
