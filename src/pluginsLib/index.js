/**
 * @author David Menger
 */
'use strict';

const disambiguation = require('./disambiguation');
const setState = require('./setState');
const setStateFromInput = require('./setStateFromInput');

const plugins = new Map();

plugins.set('ai.wingbot.disambiguation', disambiguation);
plugins.set('ai.wingbot.setState', setState);
plugins.set('ai.wingbot.setStateFromInput', setStateFromInput);

module.exports = plugins;
