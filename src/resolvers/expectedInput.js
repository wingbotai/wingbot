/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');

function expectedInput ({ type = null, confident = false }, { isLastIndex }) {

    return (req, res) => {
        if (confident) {
            res.expectedConfidentInput(type);
        } else if (type) {
            res.expectedInput(type);
        }

        return isLastIndex ? Router.END : Router.CONTINUE;
    };
}

module.exports = expectedInput;
