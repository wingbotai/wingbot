const { getUpdate } = require('../../src/utils/getUpdate');

/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 */
module.exports = (req, res) => {
    const { attr = '', value = '' } = req.params;

    const currentState = { ...req.state, ...res.newState };
    res.setState(getUpdate(attr, value, currentState));
};
