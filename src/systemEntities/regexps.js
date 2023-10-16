/**
 * @author David Menger
 */
'use strict';

const PHONE_REGEX = /((00|\+)[\s-]?[0-9]{1,4}[\s-]?)?([0-9]{3,4}[\s-]?([0-9]{2,3}[\s-]?[0-9]{2}[\s-]?[0-9]{2,3}|[0-9]{3,4}[\s-]?[0-9]{3,4}))(?=(\s|$|[,!.?\-:]))/;
const EMAIL_REGEX = /(?<=(\s|^|:))[a-zA-Z0-9!#$%&'*+\-=?^_`{|}~"][^@:\s]*@[^.@\s]+\.[^@\s,]+/;

module.exports = {
    PHONE_REGEX,
    EMAIL_REGEX
};
