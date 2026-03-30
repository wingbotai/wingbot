/**
 * @author David Menger
 */
'use strict';

const { chatRoutes } = require('@wingbotai/wingbot-ai-orchestrator');
const config = require('./config');
const { api, socket } = require('./webchat');

module.exports = chatRoutes(config, api, socket);
