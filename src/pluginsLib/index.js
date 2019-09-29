/**
 * @author David Menger
 */
'use strict';

const disambiguation = require('./disambiguation');

const plugins = new Map();

plugins.set('ai.wingbot.disambiguation', disambiguation);

module.exports = plugins;
