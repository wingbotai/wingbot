const Router = require('../../src/Router');

/**
 *
 * @param {object} params
 * @param {'any'|'image'|'audio'|'video'|'file'} params.type
 * @param {string} params.variable
 * @param {'array'|'string'} params.datatype
 * @returns {import('../../src/Router').Middleware}
 */
module.exports = (params) => {

    /**
     * @param {import('../../src/Request')} req
     * @param {import('../../src/Responder')} res
     */
    const uploadPlugin = async (req, res) => {
        if (req.isAttachment()) {

            const typeOk = (!params.type || params.type === 'any')
                || req.attachments.every((a) => a.type === params.type);

            if (!typeOk) {
                await res.run('badType');
                return Router.NEXT;
            }

            const varName = `${params.variable || 'uploadUrl'}`.trim();

            if (params.datatype === 'array') {
                const curr = req.state[varName] || [];
                const urls = req.attachments.map((a) => a.payload.url)
                    .filter((u) => !!u);

                res.setState({
                    [varName]: [...curr, ...urls]
                });
            } else {
                const [first] = req.attachments;

                res.setState({
                    [varName]: first.payload.url || null
                });
            }
            await res.run('success');

        } else {
            await res.run('noAttachment');
        }
        return Router.NEXT;
    };

    return uploadPlugin;
};
