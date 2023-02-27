/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 */
module.exports = async (req, res) => {
    [...Object.keys(req.state), ...Object.keys(res.newState)]
        .forEach((key) => {
            const match = key.match(/^_R_/);
            if (match && (req.state[key] || res.newState[key])) {
                res.setState({
                    [key]: null,
                    [`_~${key}`]: { t: 't', c: 1 }
                });
            }
        });
};
