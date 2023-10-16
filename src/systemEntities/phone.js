/**
 * @author wingbot.ai
 */
'use strict';

const { PHONE_REGEX } = require('./regexps');

/** @typedef {import('../wingbot/CustomEntityDetectionModel').EntityDetector} EntityDetector */
/** @typedef {import('../wingbot/CustomEntityDetectionModel').DetectorOptions} DetectorOptions */

/** @type {[string,EntityDetector|RegExp,DetectorOptions]} */
module.exports = [
    'phone',
    PHONE_REGEX,
    {
        anonymize: true,
        clearOverlaps: true,
        extractValue: (match) => {
            let [, internat,, number] = match;

            number = number.replace(/[-\s]+/g, '');

            if (!internat) {
                return number;
            }

            internat = internat
                .replace(/[^0-9]+|^00/g, '')
                .replace(/[-\s]+/g, '');

            return `+${internat}${number}`;
        }
    }
];
