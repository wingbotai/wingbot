/*
 * @author David Menger
 */
'use strict';

const Tester = require('../Tester');
const apiAuthorizer = require('./apiAuthorizer');

/**
 * @typedef {object} ValidateBotAPI
 * @prop {Function} validateBot
 */

/**
 *
 * @param {object} bot
 * @param {object} validationRequestBody
 * @param {string|Function} postBackTest
 * @param {string|Function} textTest
 */
async function validate (bot, validationRequestBody, postBackTest = null, textTest = null) {
    try {
        bot.buildWithSnapshot(validationRequestBody.blocks, Number.MAX_SAFE_INTEGER);
    } catch (e) {
        return { error: `Bot build failed: ${e.message}`, ok: false };
    }

    const t = new Tester(bot);

    if (postBackTest) {
        try {
            if (typeof postBackTest === 'function') {
                await Promise.resolve(postBackTest(t, bot));
            } else {
                await t.postBack(postBackTest);
            }
        } catch (e) {
            return { error: `Postback test failed: ${e.message}`, ok: false };
        }
    }

    if (textTest) {
        try {
            if (typeof textTest === 'function') {
                await Promise.resolve(textTest(t, bot));
            } else {
                await t.text(textTest);
            }
        } catch (e) {
            return { error: `Text message test failed: ${e.message}`, ok: false };
        }
    }

    bot.resetRouter();
    return { ok: true };
}

/**
 * Test the bot configuration
 *
 * @param {Function} botFactory - function, which returns a bot
 * @param {string|Function|null} [postBackTest] - postback action to test
 * @param {string|Function|null} [textTest] - random text to test
 * @param {string[]|Function} [acl] - limit api to array of groups or use auth function
 * @returns {ValidateBotAPI}
 * @example
 * const { GraphApi, validateBotApi, Tester } = require('wingbot');
 *
 * const api = new GraphApi([
 *     validateBotApi(botFactory, 'start', 'hello')
 * ], {
 *     token: 'wingbot-token'
 * })
 *
 * // OR WITH FUNCTION
 *
 * const api = new GraphApi([
 *     validateBotApi(botFactory, async (t, bot) => {
 *         const tester = new Tester(bot);
 *
 *         tester.postBack('start');
 *     })
 * ], {
 *     token: 'wingbot-token'
 * })
 */
function validateBotApi (botFactory, postBackTest = null, textTest = null, acl = null) {

    return {
        async validateBot (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            const validationRequestBody = args.bot;

            const bot = botFactory();

            return validate(bot, validationRequestBody, postBackTest, textTest);
        }
    };
}

module.exports = validateBotApi;
