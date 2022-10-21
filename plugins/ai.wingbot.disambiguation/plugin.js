/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 */
module.exports = async (req, res) => {
    let { min = '1', max = '3' } = req.params;
    min = parseInt(min, 10) || 1;
    const local = req.params.local === 'true';

    if (req.hasAiActionsForDisambiguation(min, local)) {
        max = parseInt(max, 10) || 3;
        const actions = req.aiActionsForQuickReplies(max, req.aiActions(local));
        actions.forEach((a) => res.quickReply(a));

        res.setData({ actions });

        await res.run('diambiguations');
        return null;
    }
    return true;
};
