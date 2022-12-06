/*
 * @author David Menger
 */
'use strict';

/** @typedef {import('./src/Processor').ProcessorOptions} ProcessorOptions */

const Processor = require('./src/Processor');
const Router = require('./src/Router');
const Request = require('./src/Request');
const Responder = require('./src/Responder');
const BotApp = require('./src/BotApp');
const ReducerWrapper = require('./src/ReducerWrapper');
const Tester = require('./src/Tester');
const Ai = require('./src/Ai');
const WingbotModel = require('./src/wingbot/WingbotModel');
const CachedModel = require('./src/wingbot/CachedModel');
const CustomEntityDetectionModel = require('./src/wingbot/CustomEntityDetectionModel');
const ConversationTester = require('./src/ConversationTester');
const { asserts } = require('./src/testTools');
const BuildRouter = require('./src/BuildRouter');
const MockAiModel = require('./src/MockAiModel');
const ReturnSender = require('./src/ReturnSender');
const CallbackAuditLog = require('./src/CallbackAuditLog');
const Plugins = require('./src/Plugins');
const NotificationsStorage = require('./src/notifications/NotificationsStorage');
const Notifications = require('./src/notifications/Notifications');
const MemoryBotConfigStorage = require('./src/tools/MemoryBotConfigStorage');
const routeToEvents = require('./src/tools/routeToEvents');
const GraphApi = require('./src/graphApi/GraphApi');
const validateBotApi = require('./src/graphApi/validateBotApi');
const postBackApi = require('./src/graphApi/postBackApi');
const conversationTestApi = require('./src/graphApi/conversationTestApi');
const apiAuthorizer = require('./src/graphApi/apiAuthorizer');
const conversationsApi = require('./src/graphApi/conversationsApi');
const AnyResponseAssert = require('./src/testTools/AnyResponseAssert');
const ResponseAssert = require('./src/testTools/ResponseAssert');
const ButtonTemplate = require('./src/templates/ButtonTemplate');
const GenericTemplate = require('./src/templates/GenericTemplate');
const BaseTemplate = require('./src/templates/BaseTemplate');
const OrchestratorClient = require('./src/OrchestratorClient');
const bounce = require('./src/resolvers/bounce');
const { parseActionPayload } = require('./src/utils/pathUtils');
const { disambiguationQuickReply, quickReplyAction } = require('./src/utils/quickReplies');
const { getUpdate, getValue, getSetState } = require('./src/utils/getUpdate');
const { vars } = require('./src/utils/stateVariables');
const compileWithState = require('./src/utils/compileWithState');
const onInteractionHandler = require('./src/analytics/onInteractionHandler');
const GA4 = require('./src/analytics/GA4');
const plugins = require('./plugins/plugins.json');
const {
    bufferloader,
    MemoryStateStorage
} = require('./src/tools');
const {
    TrackingCategory,
    TrackingType,
    ResponseFlag
} = require('./src/analytics/consts');

const { version: wingbotVersion } = require('./package.json');

module.exports = {

    // orchestrator
    BotApp,
    OrchestratorClient,

    // basic functionality
    ReturnSender,
    Processor,
    Router,
    Request,
    Responder,
    ReducerWrapper,

    // utilities
    Tester,
    bufferloader,
    asserts,
    MemoryStateStorage,
    CallbackAuditLog,
    MemoryBotConfigStorage,
    CachedModel,
    CustomEntityDetectionModel,
    parseActionPayload,
    getUpdate,
    getValue,
    disambiguationQuickReply,
    quickReplyAction,
    getSetState,
    bounce,
    MockAiModel,
    compileWithState,

    // for orchestrators notifications
    routeToEvents,

    // Wingbot
    ai: Ai.ai,
    Plugins,
    BuildRouter,
    WingbotModel,
    plugins,
    vars,

    // Notifications
    Notifications,
    NotificationsStorage,

    // Api
    GraphApi,
    apiAuthorizer,
    validateBotApi,
    postBackApi,
    conversationsApi,
    conversationTestApi,

    // Other files
    AnyResponseAssert,
    ResponseAssert,
    ButtonTemplate,
    GenericTemplate,
    BaseTemplate,

    // tests
    ConversationTester,

    // flags & tracking
    TrackingCategory,
    TrackingType,
    ResponseFlag,

    wingbotVersion,

    // ANALYTICS
    onInteractionHandler,
    GA4
};
