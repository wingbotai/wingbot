/**
 * @author wingbot.ai
 */
'use strict';

const { EMAIL_REGEX } = require('./regexps');

/** @typedef {import('../wingbot/CustomEntityDetectionModel').EntityDetector} EntityDetector */
/** @typedef {import('../wingbot/CustomEntityDetectionModel').DetectorOptions} DetectorOptions */

/** @type {[string,EntityDetector|RegExp,DetectorOptions]} */
module.exports = [
    'email',
    EMAIL_REGEX,
    {
        anonymize: true,
        clearOverlaps: true
    }
];
