/**
 * @author wingbot.ai
 */
'use strict';

const LEVEL_CRITICAL = 'Critical';
const LEVEL_IMPORTANT = 'Important';
const LEVEL_DEBUG = 'Debug';

const TYPE_ERROR = 'Error';
const TYPE_WARN = 'Warn';
const TYPE_INFO = 'Info';

/**
 * @typedef {object} TrackingEvent
 * @prop {string} [type='audit']
 * @prop {string} category
 * @prop {string} action
 * @prop {string} [label]
 * @prop {object} [payload]
 */

/**
 * @typedef {object} User
 * @prop {string} [id]
 * @prop {string} [senderId]
 * @prop {string} [pageId]
 * @prop {string} [jwt] - jwt to check the authorship
 */

/**
 * @typedef {object} Meta
 * @prop {string} [ip]
 * @prop {string} [ua]
 * @prop {string} [ro] - referrer || origin
 */

/**
 * @typedef {object} Logger
 * @prop {Function} log
 * @prop {Function} error
 */

/**
 * @typedef {object} AuditLogEntry
 * @prop {string} date - ISO date
 * @prop {string} [eventType='audit']
 * @prop {string} category
 * @prop {string} action
 * @prop {string} [label]
 * @prop {object} [payload]
 * @prop {string} level - (Critical|Important|Debug)
 * @prop {string} type - (Error|Warn|Info)
 * @prop {User} user
 * @prop {string} wid - workspace id
 * @prop {Meta} meta
 */

/**
 * Audit Log Callback
 *
 * @callback AuditLogCallback
 * @param {AuditLogEntry} entry
 * @returns {Promise}
 */

/**
 * Just a simple auditlog interface
 */
class CallbackAuditLog {

    /**
     *
     * @param {AuditLogCallback} callback
     * @param {Logger} log
     */
    constructor (callback = null, log = console) {
        /**
         * @type {Logger}
         * @ignore
         * @private
         */
        this._log = log;
        this.defaultWid = '0';

        this.LEVEL_CRITICAL = LEVEL_CRITICAL;
        this.LEVEL_IMPORTANT = LEVEL_IMPORTANT;
        this.LEVEL_DEBUG = LEVEL_DEBUG;

        this.TYPE_ERROR = TYPE_ERROR;
        this.TYPE_WARN = TYPE_WARN;
        this.TYPE_INFO = TYPE_INFO;

        /** @type {AuditLogCallback} */
        this.callback = callback || (async (e) => {
            const {
                category,
                action,
                ...rest
            } = e;
            log.log(`AuditLog: ${category} - ${action}`, rest);
        });
    }

    /**
     * Add a log
     *
     * @param {TrackingEvent} event
     * @param {User} user
     * @param {Meta} [meta]
     * @param {string} [wid] - workspace ID
     * @param {string} [type]
     * @param {string} [level]
     * @param {Date} [date]
     * @returns {Promise}
     */
    async log (
        event,
        user = {},
        meta = {},
        wid = this.defaultWid,
        type = TYPE_INFO,
        level = LEVEL_IMPORTANT,
        date = new Date()
    ) {
        const {
            type: eventType = 'audit',
            ...rest
        } = event;
        const entry = {
            date: date.toISOString(),
            eventType,
            ...rest,
            level,
            meta,
            type,
            user,
            wid
        };

        try {
            await this.callback(entry);
        } catch (e) {
            this._log.error('Failed to send AuditLog', e, entry);
        }
    }

}

module.exports = CallbackAuditLog;
