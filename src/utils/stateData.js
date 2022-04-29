/**
 * @author David Menger
 */
'use strict';

module.exports = function stateData (req, res = null, configuration = null) {
    const c = configuration || req.configuration;
    return {
        ...req.state,
        ...(res ? res.newState : {}),
        ...req.actionData(),
        ...(res ? res.data : {}),
        c,
        configuration: c
    };
};
