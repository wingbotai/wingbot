/**
 * @author wingbot.ai
 */
'use strict';

const { replaceDiacritics } = require('webalize');
const Ai = require('../Ai');

/** @typedef {import('../Processor').InteractionEvent} InteractionEvent */
/** @typedef {import('../Request')} Request */

/**
 * @typedef {object} GAUser
 * @prop {string} [id]
 */

/**
 * @typedef IGALogger
 * @prop {Function} log
 * @prop {Function} error
 */

/**
 * @typedef {object} Event
 * @prop {'conversation'|'page_view'|string} type
 * @prop {string} [category]
 * @prop {string} [action]
 * @prop {string} [label]
 * @prop {number} [value]
 */

/**
 * @typedef {object} SessionMetadata
 * @prop {number} [sessionCount]
 * @prop {string} [lang]
 * @prop {string} [action]
 */

/**
 * @callback CreateUserSession
 * @param {string} pageId
 * @param {string} senderId
 * @param {string} sessionId
 * @param {SessionMetadata} [metadata]
 * @param {number} [ts]
 * @param {boolean} [nonInteractive]
 * @returns {Promise}
 */

/**
 * @callback StoreEvents
 * @param {string} pageId
 * @param {string} senderId
 * @param {string} sessionId
 * @param {Event[]} events
 * @param {GAUser} [user]
 * @param {number} [ts]
 * @param {boolean} [nonInteractive]
 * @param {boolean} [sessionStarted]
 * @returns {Promise}
 */

/**
 * @callback LoggerSetter
 * @param {IGALogger} logger
 */

/**
 * @typedef {object} IAnalyticsStorage
 * @prop {LoggerSetter} setDefaultLogger - console like logger
 * @prop {StoreEvents} storeEvents
 * @prop {CreateUserSession} createUserSession
 * @prop {boolean} [hasExtendedEvents]
 */

/**
 * @callback UserExtractor
 * @param {object} state
 * @returns {object & GAUser}
 */

/**
 * @callback Anonymizer
 * @param {string} text
 * @returns {string}
 */

/**
 * @typedef {object} TrackingEvents
 * @prop {Event[]} events
 */

/**
 * @typedef {object} IConfidenceProvider
 * @prop {number} confidence
 */

/**
 * @typedef {object} HandlerConfig
 * @prop {boolean} [enabled] - default true
 * @prop {boolean} [throwException] - default false
 * @prop {IGALogger} [log] - console like logger
 * @prop {Anonymizer} [anonymize] - text anonymization function
 * @prop {UserExtractor} [userExtractor] - text anonymization function
 */

/**
 * @callback IInteractionHandler
 * @param {InteractionEvent} params
 * @returns {Promise}
 */

/**
 * @typedef {object} Handlers
 * @prop {IInteractionHandler} onInteraction
 * @prop {OnEventHandler} onEvent
 */

/**
 * @callback OnEventHandler
 * @param {string} pageId
 * @param {string} senderId
 * @param {object} state
 * @param {Event} event
 * @param {number} [timestamp]
 * @param {boolean} [nonInteractive]
 * @returns {Promise}
 */

/**
 *
 * @param {HandlerConfig} config
 * @param {IAnalyticsStorage} analyticsStorage
 * @param {IConfidenceProvider} [ai]
 * @returns {Handlers}
 */
function onInteractionHandler (
    {
        enabled = true,
        throwException = false,
        log = console,
        anonymize = (x) => x,
        userExtractor = (state) => null // eslint-disable-line no-unused-vars
    },
    analyticsStorage,
    ai = Ai.ai
) {

    /**
     * @param {InteractionEvent} params
     */
    async function onInteraction ({
        req,
        actions,
        lastAction,
        // state,
        // data,
        skill,
        tracking
    }) {
        if (!enabled) {
            return;
        }
        try {
            const nonInteractive = !!req.campaign;
            const {
                pageId,
                senderId,
                timestamp
            } = req;

            const {
                _snew: createSession,
                _sct: sessionCount,
                _sid: sessionId,
                lang
            } = req.state;

            const [action = '(none)', ...otherActions] = actions;

            if (createSession) {
                const metadata = {
                    sessionCount,
                    lang,
                    action
                };

                await analyticsStorage.createUserSession(
                    pageId,
                    senderId,
                    sessionId,
                    metadata,
                    timestamp,
                    nonInteractive
                );
            }

            const [{
                intent = '',
                score = 0
            } = {}] = req.intents;

            const text = req.isConfidentInput()
                ? '*****'
                : anonymize(
                    replaceDiacritics(req.text()).replace(/\s+/g, ' ').toLowerCase().trim()
                );

            let winnerAction = '';
            let winnerScore = 0;
            let winnerIntent = '';
            let winnerEntities = [];
            let winnerTaken = false;

            const winners = req.aiActions();

            if (winners.length > 0) {
                [{
                    action: winnerAction = '(none)',
                    sort: winnerScore = 0,
                    intent: { intent: winnerIntent, entities: winnerEntities = [] }
                }] = winners;

                winnerTaken = action === winnerAction;
            }

            const expected = req.expected() ? req.expected().action : '';

            const isContextUpdate = req.isSetContext();
            const isNotification = !!req.campaign;
            const isAttachment = req.isAttachment();
            const isQuickReply = req.isQuickReply();
            const isPassThread = !!req.event.pass_thread_control;
            const isText = !isQuickReply && req.isText();
            const isPostback = req.isPostBack();

            const allActions = actions.join(',');
            const requestAction = req.action();

            const events = [];

            const actionMeta = {
                requestAction: req.action() || '(none)',
                expected,
                expectedTaken: requestAction === expected,
                isContextUpdate,
                isAttachment,
                isNotification,
                isQuickReply,
                isPassThread,
                isText,
                isPostback,
                winnerAction,
                winnerIntent,
                winnerEntities: winnerEntities.map((e) => e.entity).join(','),
                winnerScore,
                winnerTaken,
                intent,
                intentScore: score,
                entities: req.entities.map((e) => e.entity).join(','),
                text,
                allActions
            };

            events.push({
                type: 'page_view',
                action,
                allActions,
                nonInteractive,
                lastAction,
                prevAction: lastAction,
                skill,
                lang,
                cd1: req.state.lang,
                ...(analyticsStorage.hasExtendedEvents ? {} : actionMeta)
            });

            let prevAction = action;

            events.push(
                ...otherActions.map((a) => {
                    const r = {
                        type: 'page_view',
                        action: a,
                        allActions,
                        nonInteractive: false,
                        lastAction,
                        prevAction,
                        skill,
                        isGoto: true,
                        ...(analyticsStorage.hasExtendedEvents
                            ? { lang }
                            : { cd1: lang })
                    };

                    prevAction = a;
                    return r;
                })
            );

            events.push(
                ...tracking.events.map(({
                    type, category, action: eventAction, label, value
                }) => ({
                    lastAction,
                    type,
                    category,
                    action: eventAction,
                    label,
                    value,
                    ...(analyticsStorage.hasExtendedEvents
                        ? { lang }
                        : { cd1: lang })
                }))
            );

            if (!nonInteractive) {

                if (req.isText()) {
                    events.push({
                        type: 'ai',
                        // @ts-ignore
                        lastAction,
                        category: 'Intent: Detection',
                        intent,
                        action,
                        label: text,
                        value: score >= ai.confidence ? 0 : 1,
                        ...(analyticsStorage.hasExtendedEvents
                            ? { lang }
                            : { cd1: lang })
                    });
                }

                const notHandled = actions.some((a) => a.match(/\*$/)) && !req.isQuickReply();

                let actionCategory = 'User: ';
                let label = '(none)';
                const value = notHandled ? 1 : 0;

                if (req.isSticker()) {
                    actionCategory += 'Sticker';
                    label = req.attachmentUrl(0);
                } else if (req.isImage()) {
                    actionCategory += 'Image';
                    label = req.attachmentUrl(0);
                } else if (req.hasLocation()) {
                    actionCategory += 'Location';
                    const { lat, long } = req.getLocation();
                    label = `${lat}, ${long}`;
                } else if (isAttachment) {
                    actionCategory += 'Attachement';
                    label = req.attachment(0).type;
                } else if (isText) {
                    actionCategory += 'Text';
                    label = text;
                } else if (isQuickReply) {
                    actionCategory += 'Quick reply';
                    label = text;
                } else if (req.isReferral() || req.isOptin()) {
                    actionCategory = req.isOptin()
                        ? 'Entry: Optin'
                        : 'Entry: Referral';
                } else if (isPostback) {
                    actionCategory += 'Button - bot';
                    label = req.data.postback.title || '(unknown)';
                } else {
                    actionCategory += 'Other';
                }

                events.push({
                    ...(analyticsStorage.hasExtendedEvents ? actionMeta : {}),
                    type: 'conversation',
                    // @ts-ignore
                    lastAction,
                    category: actionCategory,
                    action,
                    label,
                    value,
                    ...(analyticsStorage.hasExtendedEvents
                        ? { lang }
                        : { cd1: lang })
                });
            }

            const user = userExtractor(req.state);

            await analyticsStorage.storeEvents(
                pageId,
                senderId,
                sessionId,
                // @ts-ignore
                events,
                user,
                timestamp,
                nonInteractive,
                createSession
            );
        } catch (e) {
            if (throwException) {
                throw e;
            }
            log.error('failed sending logs', e);
        }
    }

    /**
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {object} state
     * @param {Event} event
     * @param {number} [timestamp]
     * @param {boolean} [nonInteractive]
     */
    const onEvent = async (
        pageId,
        senderId,
        state,
        event,
        timestamp = Date.now(),
        nonInteractive = false
    ) => {
        try {
            const {
                _sid: sessionId,
                lang,
                lastAction
            } = state;

            const user = userExtractor(state);

            await analyticsStorage.storeEvents(
                pageId,
                senderId,
                sessionId,
                [{
                    // @ts-ignore
                    lastAction,
                    ...(analyticsStorage.hasExtendedEvents
                        ? { lang }
                        : { cd1: lang }),
                    ...event
                }],
                user,
                timestamp,
                nonInteractive,
                false
            );
        } catch (e) {
            if (throwException) {
                throw e;
            }
            log.error('failed sending logs', e);
        }
    };

    return {
        onInteraction,
        onEvent
    };
}

module.exports = onInteractionHandler;
