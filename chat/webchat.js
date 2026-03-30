/**
 * @author David Menger
 */
'use strict';

const {
    webchat,
    StaticConfigurator,
    Chat,
    WingbotChatbot
} = require('@wingbotai/wingbot-ai-orchestrator');
const mongodb = require('./mongodb');
const config = require('./config');
const bot = require('./bot');
const MemoryStateStorage = require('../src/tools/MemoryStateStorage');
const MemoryChatLogStorage = require('../src/tools/MemoryChatLogStorage');
const ChatGpt = require('../src/ChatGpt');
const MockAiModel = require('../src/MockAiModel');
const Processor = require('../src/Processor');
const BotApp = require('../src/BotApp');
const ReturnSender = require('../src/ReturnSender');

const stateStorage = new MemoryStateStorage();
const chatLogStorage = new MemoryChatLogStorage();

const provider = config.gptToken
    ? new ChatGpt({
        authorization: config.gptToken
    })
    : new MockAiModel({});

const botAdapter = new WingbotChatbot('my-bot', bot, {
    llm: {
        provider,
        model: 'gpt-5.1',
        presets: {
            routing: {
                model: ''
            }
        }
    },
    stateStorage,
    logger: chatLogStorage,
    secret: config.secret,
    Processor,
    BotApp,
    ReturnSender
});

const configurator = new StaticConfigurator();

configurator.addPage({
    wid: 'default',
    id: config.pageId,
    allowWeakAuth: false,
    channelName: Chat.CHANNEL_NAME,
    primaryAppId: config.appId
});

configurator.addApp({
    id: config.appId,
    channelName: 'my-bot',
    options: {
        secret: config.secret
    }
});

configurator.addAppToPage(
    config.appId,
    config.pageId,
    {
        messages: true,
        postbacks: true,
        contextUpdates: true,
        handovers: true
        // readAndDelivery: true
    }
);

const {
    socket,
    api
} = webchat(configurator, {
    appSecret: config.secret,
    db: {
        isCosmos: false
    },
    apiUrl: config.apiUrl,
    wsUrl: config.wsUrlm,
    cookieDomain: config.cookieDomain,
    chat: {}
}, mongodb, undefined, botAdapter);

module.exports = {
    socket, api
};
