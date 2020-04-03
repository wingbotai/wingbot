/*
 * @author David Menger
 */
'use strict';

const Processor = require('./src/Processor');
const Router = require('./src/Router');
const Request = require('./src/Request');
const Responder = require('./src/Responder');
const ReducerWrapper = require('./src/ReducerWrapper');
const Tester = require('./src/Tester');
const Ai = require('./src/Ai');
const WingbotModel = require('./src/wingbot/WingbotModel');
const CachedModel = require('./src/wingbot/CachedModel');
const ConversationTester = require('./src/ConversationTester');
const { asserts } = require('./src/testTools');
const BuildRouter = require('./src/BuildRouter');
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
const { parseActionPayload } = require('./src/utils/pathUtils');
const { disambiguationQuickReply } = require('./src/utils/quickReplies');
const { getUpdate, getValue } = require('./src/utils/getUpdate');
const {
    bufferloader,
    MemoryStateStorage,
    Translate
} = require('./src/tools');
const flags = require('./src/flags');

module.exports = {
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
    parseActionPayload,
    getUpdate,
    getValue,
    disambiguationQuickReply,

    // Wingbot
    ai: Ai.ai,
    Plugins,
    BuildRouter,
    WingbotModel,

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
