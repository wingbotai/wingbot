/**
 * @author wingbot.ai
 */
'use strict';

module.exports = ['email', /(?<=(\s|^|:))[a-zA-Z0-9!#$%&'*+\-=?^_`{|}~"][^@:\s]*@[^.@\s]+\.[^@\s,]+/, {
    anonymize: true
}];
