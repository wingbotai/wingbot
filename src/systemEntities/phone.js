/**
 * @author wingbot.ai
 */
'use strict';

module.exports = [
    'phone',
    /((00|\+)[\s-]?[0-9]{1,4})?[\s-]?([0-9]{3,4}[\s-]?([0-9]{2,3}[\s-]?[0-9]{2}[\s-]?[0-9]{2,3}|[0-9]{3,4}[\s-]?[0-9]{3,4}))(?=(\s|$|[,!.?\-:]))/,
    {
        anonymize: true,
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
