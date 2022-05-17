/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');

function expected ({ path, attachedRouter }, { isLastIndex }) {

    if (attachedRouter) {
        return (req, res, postBack) => postBack(path, {
            _useExpected: {
                action: res.toAbsoluteAction(path),
                data: {}
            }
        }, true);
    }

    return (req, res) => {
        res.expected(path);

        return isLastIndex ? Router.END : Router.CONTINUE;
    };
}

module.exports = expected;
