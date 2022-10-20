/**
 * @author David Menger
 */
'use strict';

/**
 *
 * @param {Date} inputDate
 * @param {boolean} toZeroTimezone
 * @returns {string}
 */
function dateToISO8601String (inputDate, toZeroTimezone = false) {
    const padDigits = function padDigits (number, digits) {
        return Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
    };

    let d = inputDate;
    const offsetMinutes = d.getTimezoneOffset();
    const offsetHours = offsetMinutes / 60;
    let offset = 'Z';
    if (toZeroTimezone) {
        d = new Date(d.toISOString());
        d.setMinutes(d.getMinutes() + offsetMinutes);
    } else if (offsetHours < 0) {
        offset = `+${padDigits(`${offsetHours.toString().replace('-', '')}00`, 4)}`;
    } else if (offsetHours > 0) {
        offset = `-${padDigits(`${offsetHours}00`, 4)}`;
    }

    return `${d.getFullYear()
    }-${padDigits((d.getMonth() + 1), 2)
    }-${padDigits(d.getDate(), 2)
    }T${padDigits(d.getHours(), 2)
    }:${padDigits(d.getMinutes(), 2)
    }:${padDigits(d.getSeconds(), 2)
    }.${padDigits(d.getMilliseconds(), 2)
    }${offset}`;
}

/**
 * Make zero date
 *
 * @param {Date} d
 * @returns {Date}
 */
function zeroHourDate (d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, -d.getTimezoneOffset());
}

module.exports = { dateToISO8601String, zeroHourDate };
