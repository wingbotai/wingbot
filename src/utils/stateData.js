/**
 * @author David Menger
 */
'use strict';

module.exports = function stateData (req, res = null) {
    return {
        ...req.state,
        ...(res ? res.newState : {}),
        ...req.actionData(),
        ...(res ? res.data : {})
    };
};
