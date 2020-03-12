/**
 * @author wingbot.ai
 */
'use strict';

/**
 * Disambiguation quick reply was selected
 */
const FLAG_DISAMBIGUATION_SELECTED = 'd';

/**
 * Disambiguation occured - user was asked to choose the right meaning
 */
const FLAG_DISAMBIGUATION_OFFERED = 'o';

/**
 * Do not log the event
 */
const FLAG_DO_NOT_LOG = '!';

module.exports = {
    FLAG_DISAMBIGUATION_SELECTED,
    FLAG_DISAMBIGUATION_OFFERED,
    FLAG_DO_NOT_LOG
};
