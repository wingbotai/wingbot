/**
 * @author David Menger
 */
'use strict';

/**
 * @enum {string}
 */
const ResponseFlag = {
    /**
     * Disambiguation quick reply was selected
     */
    DISAMBIGUATION_SELECTED: 'd',

    /**
     * Disambiguation occured - user was asked to choose the right meaning
     */
    DISAMBIGUATION_OFFERED: 'o',

    /**
     * Do not log the event
     */
    DO_NOT_LOG: '!',

    /**
     * Handover occurred
     */
    HANDOVER: 'h'
};

/**
 * @enum {string}
 */
const TrackingType = { // max length 12
    CONVERSATION_EVENT: 'conversation',
    TRAINING: 'train',
    PAGE_VIEW: 'page_view',
    REPORT: 'report'
};

/**
 * @enum {string} TrackingCategory
 */
const TrackingCategory = { // max length 3
    // PAGE_VIEW: 'page_view'
    PAGE_VIEW_FIRST: 'pf',
    PAGE_VIEW_SUBSEQUENT: 'pp',

    // CONVERSATION_EVENT: 'conversation'
    STICKER: 'sti',
    IMAGE: 'img',
    LOCATION: 'loc',
    ATTACHMENT: 'att',
    TEXT: 'txt',
    QUICK_REPLY: 'qr',
    OPT_IN: 'oin',
    REFERRAL: 'ref',
    POSTBACK_BUTTON: 'btn',
    URL_LINK: 'url',
    OTHER: 'oth',
    HANDOVER_TO_BOT: 'bot',

    // TRAINING: 'train'
    INTENT_DETECTION: 'int',
    HANDOVER_OCCURRED: 'hum',
    DISAMBIGUATION_SELECTED: 'dis',
    DISAMBIGUATION_OFFERED: 'dio',

    // REPORT: 'report'
    REPORT_FEEDBACK: 'fdb'
};

/**
 * @type {Object<TrackingCategory,string>}
 */
const CATEGORY_LABELS = {
    // PAGE_VIEW: 'page_view'
    [TrackingCategory.PAGE_VIEW_FIRST]: 'Bot: Interaction',
    [TrackingCategory.PAGE_VIEW_SUBSEQUENT]: 'Bot: Sub-interaction',

    // CONVERSATION_EVENT: 'conversation'
    [TrackingCategory.STICKER]: 'User: Sticker',
    [TrackingCategory.IMAGE]: 'User: Image',
    [TrackingCategory.LOCATION]: 'User: Location',
    [TrackingCategory.ATTACHMENT]: 'User: Attachement', // yes, with typo
    [TrackingCategory.TEXT]: 'User: Text',
    [TrackingCategory.QUICK_REPLY]: 'User: Quick reply',
    [TrackingCategory.OPT_IN]: 'Entry: Optin',
    [TrackingCategory.REFERRAL]: 'Entry: Referral',
    [TrackingCategory.POSTBACK_BUTTON]: 'User: Button - bot',
    [TrackingCategory.URL_LINK]: 'User: Button - url',
    [TrackingCategory.OTHER]: 'User: Other',
    [TrackingCategory.HANDOVER_TO_BOT]: 'Entry: Handover in',

    // TRAINING: 'train'
    [TrackingCategory.INTENT_DETECTION]: 'Intent: Detection',
    [TrackingCategory.HANDOVER_OCCURRED]: 'Bot: Handover out',
    [TrackingCategory.DISAMBIGUATION_SELECTED]: 'Disambiguation: selected',
    [TrackingCategory.DISAMBIGUATION_OFFERED]: 'Disambiguation: offered',

    // REPORT: 'report'
    [TrackingCategory.REPORT_FEEDBACK]: 'User: Feedback'
};

module.exports = {
    CATEGORY_LABELS,
    TrackingType,
    TrackingCategory,
    ResponseFlag
};
