/**
 * @author David Menger
 */
'use strict';

const fetch = require('node-fetch').default;

/** @typedef {import('./onInteractionHandler').Event} Event */
/** @typedef {import('./onInteractionHandler').IAnalyticsStorage} IAnalyticsStorage */
/** @typedef {import('./onInteractionHandler').GAUser} GAUser */
/** @typedef {import('./onInteractionHandler').SessionMetadata} SessionMetadata */
/** @typedef {import('./onInteractionHandler').IGALogger} IGALogger */

/** @typedef {import('node-fetch').RequestInit} RequestInit */

/**
 * @typedef {object} FetchResult
 * @param {number} status
 * @param {string} [statusText]
 * @param {Promise<object>} json
 */

/**
 * @callback MockFetch
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<FetchResult>}
 */

/**
 * @typedef {object} GAOptions
 * @prop {string} measurementId
 * @prop {string} apiSecret
 * @prop {boolean} [debug]
 * @prop {IGALogger} [log]
 * @prop {MockFetch} [fetch]
 */
/**
 * @class GA4
 * @implements {IAnalyticsStorage}
 */
class GA4 {

    /**
     *
     * @param {GAOptions} options
     */
    constructor (options) {
        this._options = options;

        /** @type {IGALogger} */
        this._logger = options.log || console;

        this._urlQuery = `measurement_id=${encodeURIComponent(options.measurementId)}&api_secret=${encodeURIComponent(options.apiSecret)}`;
        this._url = `https://www.google-analytics.com/mp/collect?${this._urlQuery}`;

        this.hasExtendedEvents = true;

        this._fetch = options.fetch || fetch;
    }

    /**
     * @param {IGALogger} logger
     */
    setDefaultLogger (logger) {
        if (this._logger === console) {
            this._logger = logger;
        }
    }

    /**
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {string} sessionId
     * @param {SessionMetadata} [metadata]
     * @param {number} [ts]
     * @param {boolean} [nonInteractive]
     * @returns {Promise}
     */
    async createUserSession (
        pageId,
        senderId,
        sessionId,
        metadata = {},
        ts = Date.now(),
        nonInteractive = false
    ) {
        const uafvl = 'wingbot';

        const { lang = '', sessionCount = 1, action = '/' } = metadata;

        const event = {
            v: 2,
            tid: this._options.measurementId,
            _p: Math.round(2147483647 * Math.random()),
            sr: '1x1',
            _dbg: this._options.debug ? 1 : 0,
            ul: lang, // language
            cid: this._conversationId(pageId, senderId),

            // dl: 'https://wingbot-web-staging.flyto.cloud/dp',
            dp: action,
            dr: '', // referral (url)
            dt: action === '/' ? '(none)' : action.replace(/-/g, ' '),

            // en: 'page_view', // event name
            en: 'scroll',
            'epn.percent_scrolled': 100,

            uafvl, // must have

            sct: sessionCount, // session count (int)
            seg: nonInteractive ? 0 : 1, // session engagement (boolean)
            sid: sessionId, // session id (string)

            // this was sent during the first visit
            _fv: sessionCount === 1, // first visit (bool)
            _nsi: 1, // new session id (bool)
            _ss: 1, // session start (bool)

            _ee: 1, // ? page_view event parameter (??? event engagement ??)

            _s: 1, // session hit count (was 1 every request),
            _et: ts // event time (number)
        };

        if (this._options.debug) {
            this._logger.log('GA4: starting session', event);
        }

        const query = Object.entries(event)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');

        // const url = 'https://region1.google-analytics.com/g/collect';
        const url = 'https://www.google-analytics.com/g/collect';

        const res = await this._fetch(`${url}?${query}`, {
            method: 'POST',
            headers: {
                'user-agent': uafvl
            }
        });

        if (res.status >= 400) {
            this._logger.error('GA4: failed to create session', {
                url,
                query,
                status: res.status
            });
        }
    }

    _conversationId (pageId, senderId) {
        return `${pageId}.${senderId}`;
    }

    /**
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {string} sessionId
     * @param {Event[]} events
     * @param {GAUser} [user]
     * @param {number} [ts]
     * @returns {Promise}
     */
    async storeEvents (
        pageId,
        senderId,
        sessionId,
        events,
        user = null,
        ts = Date.now()
    ) {
        if (events.length === 0) {
            return;
        }

        const body = {
            client_id: this._conversationId(pageId, senderId),
            timestamp_micros: ts * 1000,
            non_personalized_ads: false,
            events: events.map((e) => {
                const { type: name, ...params } = e;
                Object.entries(params)
                    .forEach(([k, v]) => {
                        if (v === null) {
                            params[k] = '(none)';
                        }
                    });
                // Object.assign(params, { session_id: sessionId });
                switch (name) {
                    case 'page_view':
                        return {
                            name,
                            params: {
                                page_path: e.action,
                                page_title: e.action
                                    .replace(/^\/+/, '')
                                    .replace(/[-]+/g, ' ')
                                    .replace(/[/]+/g, ' - '),
                                ...params
                            }
                        };
                    default:
                        return { name, params };
                }
            })
        };

        if (user) {
            const { id, ...other } = user;

            Object.assign(body, {
                user_id: id,
                user_properties: Object.fromEntries(
                    Object.entries(other)
                        .map(([key, value]) => [key, { value }])
                )
            });
        }

        const params = {
            method: 'POST',
            body: JSON.stringify(body)
        };

        let err;
        let res;
        try {
            res = await this._fetch(this._url, params);

            if (res.status >= 400) {
                throw new Error(`${res.statusText} [${res.status}]`);
            }
            if (!this._options.debug) {
                return;
            }
        } catch (e) {
            err = e;
        }

        let { message = 'GENERIC FAIL' } = err || { message: null };
        let validationMessages = [];
        try {
            const dbg = await this._fetch(`https://www.google-analytics.com/debug/mp/collect?${this._urlQuery}`, params);

            if (dbg.status >= 300) {
                throw new Error(`${dbg.statusText} [${dbg.status}]`);
            }

            ({ validationMessages = [] } = await dbg.json());

            message = (validationMessages[0] || { description: message }).description;
        } catch (e) {
            this._logger.log('GA4 debug failed', e);
            message += ` +(${e.message})`;
        }

        if (validationMessages.length || message) {
            this._logger.log('GA4: validationMessages', validationMessages);
            this._logger.error(`GA4: fail: ${message} [${res ? res.status : 0}]`, params.body);
        } else {
            this._logger.log(`GA4: debug [${res ? res.status : 0}]`, params.body);
        }
    }

}

module.exports = GA4;
