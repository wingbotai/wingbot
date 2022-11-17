/**
 * @author wingbot.ai
 */
'use strict';

/** @typedef {import('../wingbot/CustomEntityDetectionModel').EntityDetector} EntityDetector */
/** @typedef {import('../wingbot/CustomEntityDetectionModel').DetectorOptions} DetectorOptions */

/** @type {[string,EntityDetector|RegExp,DetectorOptions]} */
module.exports = ['email', /(?<=(\s|^|:))[a-zA-Z0-9!#$%&'*+\-=?^_`{|}~"][^@:\s]*@[^.@\s]+\.[^@\s,]+/, {
    anonymize: true,
    clearOverlaps: true
}];
