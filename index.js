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
const Plugins = require('./src/Plugins');
const NotificationsStorage = require('./src/notifications/NotificationsStorage');
const Notifications = require('./src/notifications/Notifications');
const MemoryBotConfigStorage = require('./src/tools/MemoryBotConfigStorage');
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
const bounce = require('./src/resolvers/bounce');
const { parseActionPayload } = require('./src/utils/pathUtils');
const { disambiguationQuickReply, quickReplyAction } = require('./src/utils/quickReplies');
const { getUpdate, getValue, getSetState } = require('./src/utils/getUpdate');
const { vars } = require('./src/utils/stateVariables');
const plugins = require('./plugins/plugins.json');
const {
    bufferloader,
    MemoryStateStorage,
    Translate
} = require('./src/tools');
const flags = require('./src/flags');

module.exports = {
    // orchestrator
    BotApp,

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
    MemoryBotConfigStorage,
    Translate,
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

    // flags
    ...flags
};
