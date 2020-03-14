/**
 * @author David Menger
 */
'use strict';

const disambiguation = require('./disambiguation');
const setState = require('./setState');
const setStateFromInput = require('./setStateFromInput');
const passThreadToBotFactory = require('./passThreadToBot');
const oneTimeNotificationRequest = require('./oneTimeNotificationRequest');

const plugins = new Map();

plugins.set('ai.wingbot.disambiguation', disambiguation);
plugins.set('ai.wingbot.setState', setState);
plugins.set('ai.wingbot.oneTimeNotificationRequest', oneTimeNotificationRequest);
plugins.set('ai.wingbot.setStateFromInput', setStateFromInput);
plugins.set('ai.wingbot.passThreadToBot', { pluginFactory: passThreadToBotFactory });

module.exports = plugins;
