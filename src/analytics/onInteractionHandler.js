/**
 * @author wingbot.ai
 */
'use strict';

const uaParserJs = require('@amplitude/ua-parser-js');
const { replaceDiacritics, webalize } = require('webalize');
const Ai = require('../Ai');
const {
    TrackingType, TrackingCategory, CATEGORY_LABELS, ResponseFlag
} = require('./consts');

/** @typedef {import('../Processor').InteractionEvent} InteractionEvent */
/** @typedef {import('../Processor').IInteractionHandler} IInteractionHandler */
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
 * @prop {TrackingType} type
 * @prop {TrackingCategory} [category]
 * @prop {string} [action]
 * @prop {string} [label]
 * @prop {number} [value]
 * @prop {string} [lang]
 * @prop {string|null} [pageCategory]
 */

/**
 * @typedef {object} ConversationEventExtension
 * @prop {string} [lastAction]
 * @prop {string} [skill]
 * @prop {string} [prevSkill]
 * @prop {string} [pathname]
 * @prop {string} [text]
 * @prop {string} [expected]
 * @prop {boolean} expectedTaken
 * @prop {boolean} isContextUpdate
 * @prop {boolean} isAttachment
 * @prop {boolean} isNotification
 * @prop {boolean} isQuickReply
 * @prop {boolean} isPassThread
 * @prop {boolean} isPostback
 * @prop {boolean} isText
 * @prop {boolean} didHandover
 * @prop {boolean} withUser
 * @prop {string} [userId]
 * @prop {number} [feedback]
 * @prop {string} [winnerAction]
 * @prop {string} [winnerIntent]
 * @prop {string[]|string} [winnerEntities]
 * @prop {number} [winnerScore]
 * @prop {boolean} [winnerTaken]
 * @prop {string} [intent]
 * @prop {number} [intentScore]
 * @prop {string[]|string} [entities]
 * @prop {string|null} [pagePath]
 * @prop {string|null} [pageCategory]
 * @prop {string[]|string} allActions
 * @prop {boolean} nonInteractive
 *
 * @typedef {Event & ConversationEventExtension} ConversationEvent
 */

/**
 * @typedef {object} PageViewEventExtension
 * @prop {string} [lastAction]
 * @prop {string} [prevAction]
 * @prop {string} [skill]
 * @prop {string[]|string} allActions
 * @prop {boolean} nonInteractive
 * @prop {boolean} isGoto
 * @prop {boolean} withUser
 *
 * @typedef {Event & PageViewEventExtension} PageViewEvent
 */

/**
 * @typedef {ConversationEvent | Event | PageViewEvent} TrackingEvent
 */

/**
 * @typedef {object} SessionMetadata
 * @prop {number} [sessionCount]
 * @prop {string} [lang]
 * @prop {string} [action]
 * @prop {string} [snapshot]
 * @prop {string} [botId]
 * @prop {boolean} [didHandover]
 * @prop {number|null} [feedback]
 * @prop {string} [timeZone]
 * @prop {number} [sessionStart]
 * @prop {number} [sessionDuration]
 * @prop {string[]} [responseTexts]
 * @prop {string|null} [pagePath]
 * @prop {string|null} [pageCategory]
 * @prop {string} [browserName]
 * @prop {string} [deviceType]
 * @prop {string} [osName]
 * @prop {string} [skill]
 * @prop {string} [prevSkill]
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
 * @param {TrackingEvent[]} events
 * @param {GAUser} [user]
 * @param {number} [ts]
 * @param {boolean} [nonInteractive]
 * @param {boolean} [sessionStarted]
 * @param {SessionMetadata} [metadata]
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
 * @prop {boolean} [supportsArrays]
 * @prop {boolean} [useDescriptiveCategories]
 * @prop {boolean} [useExtendedScalars]
 * @prop {boolean} [parallelSessionInsert]
 * @prop {Function} [preHeat]
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
 * @callback PathCategoryExtractor
 * @param {string} pathName
 * @returns {string}
 */

/**
 * @typedef {object} TrackingEvents
 * @prop {TrackingEvent[]} events
 */

/**
 * @typedef {object} IConfidenceProvider
 * @prop {number} confidence
 */

/**
 * @typedef {object} HandlerConfig
 * @prop {string} [pagePathVar]
 * @prop {string} [userAgentVar]
 * @prop {string} [snapshot]
 * @prop {string} [botId]
 * @prop {string} [timeZone] - default UTC
 * @prop {boolean} [enabled] - default true
 * @prop {boolean} [throwException] - default false
 * @prop {IGALogger} [log] - console like logger
 * @prop {Anonymizer} [anonymize] - text anonymization function
 * @prop {UserExtractor} [userExtractor] - text anonymization function
 * @prop {PathCategoryExtractor} [pathCategoryExtractor]
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

function defaultPathExtractor (pathName) {
    if (!pathName) {
        return null;
    }

    const [firstElem] = pathName.split('/')
        .filter((e) => !!e);

    return firstElem || '/';
}

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
        snapshot,
        botId,
        timeZone = 'UTC',
        pagePathVar = '§pathname',
        userAgentVar = '§ua',
        pathCategoryExtractor = defaultPathExtractor,
        anonymize = (x) => x,
        userExtractor = (state) => null // eslint-disable-line no-unused-vars
    },
    analyticsStorage,
    ai = Ai.ai
) {
    const {
        supportsArrays = false,
        useExtendedScalars = false,
        hasExtendedEvents = false,
        useDescriptiveCategories = true,
        parallelSessionInsert = false
    } = analyticsStorage;

    const asArray = (data = []) => (supportsArrays ? data : data.join(','));
    const asCategory = (cat) => (useDescriptiveCategories && CATEGORY_LABELS[cat]) || cat;
    const noneAction = useExtendedScalars ? null : '(none)';
    const noneValue = useExtendedScalars ? null : 0;

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
        prevSkill,
        pathname,
        events,
        flag,
        nonInteractive,
        responseTexts,
        doNotTrack = false
    }) {
        if (!enabled) {
            return;
        }
        try {
            const {
                pageId,
                senderId,
                timestamp
            } = req;

            const {
                _snew: createSession,
                _sct: sessionCount,
                _sid: sessionId,
                _sst: sessionStart,
                _sts: sessionTs,
                lang,
                [pagePathVar]: pagePath,
                [userAgentVar]: userAgent
            } = req.state;

            const ua = uaParserJs(userAgent);

            const pageCategory = pathCategoryExtractor(pagePath);

            const trackEvents = [];

            const [action = noneAction, ...otherActions] = actions;

            const feedbackEvent = events.find((e) => e.type === TrackingType.REPORT
                && e.category === TrackingCategory.REPORT_FEEDBACK);
            const feedback = feedbackEvent
                ? feedbackEvent.value
                : noneValue;
            let didHandover = flag === ResponseFlag.HANDOVER;
            const hasHandoverEvent = events
                .some((e) => e.category === TrackingCategory.HANDOVER_OCCURRED);

            if (didHandover && !hasHandoverEvent) {
                trackEvents.push({
                    type: TrackingType.REPORT,
                    category: asCategory(TrackingCategory.HANDOVER_OCCURRED),
                    action: null,
                    label: null,
                    value: noneValue
                });
            } else if (hasHandoverEvent) {
                didHandover = true;
            }

            const useSkill = (skill && webalize(skill)) || noneAction;
            const usePrevSkill = (prevSkill && webalize(prevSkill)) || noneAction;

            const metadata = {
                sessionCount,
                lang,
                action,
                snapshot,
                botId,
                didHandover,
                feedback,
                timeZone,
                sessionStart,
                responseTexts,
                sessionDuration: sessionTs - sessionStart,
                pagePath,
                pageCategory,
                browserName: ua.browser.name || null,
                deviceType: ua.device.type || null,
                osName: ua.os.name || null,
                skill: useSkill,
                prevSkill: usePrevSkill
            };

            let sessionPromise;
            if (createSession) {
                sessionPromise = analyticsStorage.createUserSession(
                    pageId,
                    senderId,
                    sessionId,
                    metadata,
                    timestamp,
                    nonInteractive
                );

                if (!parallelSessionInsert) {
                    await sessionPromise;
                    sessionPromise = null;
                }
            }

            const [{
                intent = '',
                score = 0
            } = {}] = req.intents;

            const text = req.isConfidentInput() || doNotTrack
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
                    action: winnerAction = noneAction,
                    sort: winnerScore = 0,
                    intent: { intent: winnerIntent, entities: winnerEntities = [] }
                }] = winners;

                winnerTaken = action === winnerAction;
            }

            const expected = req.expected() ? req.expected().action : '';
            const user = userExtractor(req.state);

            const isContextUpdate = req.isSetContext();
            const isNotification = !!req.campaign;
            const isAttachment = req.isAttachment();
            const isQuickReply = req.isQuickReply();
            const isPassThread = !!req.event.pass_thread_control;
            const isText = !isQuickReply && req.isText();
            const isPostback = req.isPostBack();

            const allActions = asArray(actions);
            const requestAction = req.action();

            const langsExtension = hasExtendedEvents
                ? { lang }
                : { cd1: lang };

            const withUser = user !== null && !!user.id;

            const actionMeta = {
                requestAction: req.action() || noneAction,
                expected,
                expectedTaken: requestAction === expected,
                isContextUpdate,
                isAttachment,
                isNotification,
                isQuickReply,
                isPassThread,
                isText,
                isPostback,
                didHandover,
                withUser,
                feedback,
                skill: useSkill,
                prevSkill: usePrevSkill,
                pathname: pathname || noneAction,
                winnerAction,
                winnerIntent,
                winnerEntities: asArray(winnerEntities.map((e) => e.entity)),
                winnerScore,
                winnerTaken,
                intent,
                intentScore: score,
                entities: asArray(req.entities.map((e) => e.entity)),
                text,
                allActions,
                pagePath,
                pageCategory
            };

            const notHandled = actions.some((a) => a.match(/\*$/)) && !req.isQuickReply();
            const value = notHandled ? 1 : 0;

            if (!doNotTrack) {
                trackEvents.push({
                    type: TrackingType.PAGE_VIEW,
                    category: asCategory(TrackingCategory.PAGE_VIEW_FIRST),
                    action,
                    label: (isText || isQuickReply ? text : null),
                    value,
                    allActions,
                    nonInteractive,
                    lastAction,
                    // @ts-ignore
                    prevAction: lastAction,
                    skill: useSkill,
                    isGoto: false,
                    withUser,
                    ...langsExtension,
                    ...(hasExtendedEvents ? {} : actionMeta)
                });

                let prevAction = action;

                trackEvents.push(
                    ...otherActions.map((a) => {
                        const r = {
                            type: TrackingType.PAGE_VIEW,
                            category: asCategory(TrackingCategory.PAGE_VIEW_SUBSEQUENT),
                            action: a,
                            value: 0,
                            allActions,
                            nonInteractive: false,
                            lastAction,
                            prevAction,
                            skill: useSkill,
                            isGoto: true,
                            withUser,
                            ...langsExtension
                        };

                        prevAction = a;
                        return r;
                    })
                );
            }

            trackEvents.push(
                ...events.map(({
                    type, category, action: eventAction, label, value: eVal
                }) => ({
                    lastAction,
                    type,
                    category: asCategory(category),
                    action: eventAction,
                    label,
                    value: eVal,
                    ...langsExtension
                }))
            );

            if (!nonInteractive) {
                if (req.isText()) {
                    trackEvents.push({
                        type: TrackingType.TRAINING,
                        // @ts-ignore
                        lastAction,
                        category: asCategory(TrackingCategory.INTENT_DETECTION),
                        intent,
                        action,
                        label: text,
                        value: score >= ai.confidence ? 0 : 1,
                        ...langsExtension
                    });
                }

                let actionCategory;
                let label = noneAction;

                if (isPassThread) {
                    actionCategory = TrackingCategory.HANDOVER_TO_BOT;
                } else if (req.isSticker()) {
                    actionCategory = TrackingCategory.STICKER;
                    label = req.attachmentUrl(0);
                } else if (req.isImage()) {
                    actionCategory = TrackingCategory.IMAGE;
                    label = req.attachmentUrl(0);
                } else if (req.hasLocation()) {
                    actionCategory = TrackingCategory.LOCATION;
                    const { lat, long } = req.getLocation();
                    label = `${lat}, ${long}`;
                } else if (isAttachment) {
                    actionCategory = TrackingCategory.ATTACHMENT;
                    label = req.attachment(0).type;
                } else if (isText) {
                    actionCategory = TrackingCategory.TEXT;
                    label = text;
                } else if (isQuickReply) {
                    actionCategory = TrackingCategory.QUICK_REPLY;
                    label = text;
                } else if (req.isOptin()) {
                    actionCategory = TrackingCategory.OPT_IN;
                } else if (req.isReferral()) {
                    actionCategory = TrackingCategory.REFERRAL;
                } else if (isPostback) {
                    actionCategory = TrackingCategory.POSTBACK_BUTTON;
                    label = req.event.postback.title || (useExtendedScalars ? null : '(unknown)');
                } else {
                    actionCategory = TrackingCategory.OTHER;
                }

                trackEvents.push({
                    ...(analyticsStorage.hasExtendedEvents ? actionMeta : {}),
                    type: TrackingType.CONVERSATION_EVENT,
                    lastAction,
                    category: asCategory(actionCategory),
                    action,
                    label,
                    value,
                    pageCategory,
                    ...langsExtension
                });
            }

            await Promise.all([
                analyticsStorage.storeEvents(
                    pageId,
                    senderId,
                    sessionId,
                    // @ts-ignore
                    trackEvents,
                    user,
                    timestamp,
                    nonInteractive,
                    createSession,
                    metadata
                ),
                sessionPromise
            ]);
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
                    ...(hasExtendedEvents
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
