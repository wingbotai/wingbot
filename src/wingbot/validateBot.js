/*
 * @author David Menger
 */
'use strict';

const Tester = require('../Tester');

/**
 * Test the bot configuration
 *
 * @param {BuildRouter} bot
 * @param {Object} validationRequestBody
 * @param {string} [postBackTestAction]
 * @param {string} [testText]
 */
async function validateBot (bot, validationRequestBody, postBackTestAction = 'start', testText = 'hello') {
    bot.buildWithSnapshot(validationRequestBody.blocks, Number.MAX_SAFE_INTEGER);

    const t = new Tester(bot);

    if (postBackTestAction) {
        try {
            await t.postBack(postBackTestAction);
        } catch (e) {
            throw new Error(`Postback failed: ${e.message}`);
        }
    }

    if (testText) {
        try {
            await t.postBack(testText);
        } catch (e) {
            throw new Error(`Text message failed: ${e.message}`);
        }
    }

    bot.resetRouter();
}

module.exports = validateBot;
