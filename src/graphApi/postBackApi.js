/*
 * @author David Menger
 */
'use strict';

const apiAuthorizer = require('./apiAuthorizer');
const Request = require('../Request');

/**
 * @typedef {object} PostBackAPI
 * @prop {Function} postBack
 */

/**
 * Create a postback API
 *
 * @param {{processMessage:Function}} processor - running messaging channel, like Facebook
 * @param {string[]|Function} [acl] - limit api to array of groups or use auth function
 * @returns {PostBackAPI}
 * @example
 * const { GraphApi, postBackApi } = require('wingbot');
 *
 * const api = new GraphApi([
 *     postBackApi(channel)
 * ], {
 *     appToken: 'API-will-be-accessible-with-this-token-in-Authorization-header'
 * })
 */
function postBackApi (processor, acl) {
    return {
        async postBack (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            const event = Request.postBack(args.senderId, args.action, args.data);

            return processor.processMessage(event, args.senderId, args.pageId);
        }
    };
}

module.exports = postBackApi;
