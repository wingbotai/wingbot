/*
 * @author David Menger
 */
'use strict';

const Tester = require('../Tester');

/**
 * Test the bot configuration
 *
 * @param {Function} botFactory
 * @param {string} [postBackTestAction]
 * @param {string} [testText]
 */
async function validate (botFactory, postBackTestAction = 'start', testText = 'hello') {
    const bot = botFactory();

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
}

module.exports = validate;
