/*
 * @author David Menger
 */
'use strict';

const Processor = require('./src/Processor');
const Router = require('./src/Router');
const Request = require('./src/Request');
const ReducerWrapper = require('./src/ReducerWrapper');
const Tester = require('./src/Tester');
const Ai = require('./src/Ai');
const { asserts } = require('./src/testTools');
const BuildRouter = require('./src/BuildRouter');
const { validateBot } = require('./src/wingbot');
const ReturnSender = require('./src/ReturnSender');
const Plugins = require('./src/Plugins');
const { callbackMiddleware, sustainCallback } = require('./src/middlewares/callback');

const {
    bufferloader,
    MemoryStateStorage,
    Translate
} = require('./src/tools');

module.exports = {
    // basic functionality
    ReturnSender,
    Processor,
    Router,
    Request,
    ReducerWrapper,

    // utilities
    Tester,
    bufferloader,
    asserts,
    MemoryStateStorage,
    Translate,

    // Wingbot
    ai: Ai.ai,
    Blocks: Plugins, // @deprecated
    Plugins,
    BuildRouter,
    validateBot,

    // middlewares
    callbackMiddleware,
    sustainCallback
};
