/*
 * @author David Menger
 */
'use strict';

const apiAuthorizer = require('./apiAuthorizer');
const { postBack } = require('../utils/requestFactories');

function postBackApi (processor, acl) {
    return {
        async postBack (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            const event = postBack(args.senderId, args.action, args.data);

            return processor.processMessage(event, args.pageId);
        }
    };
}

module.exports = postBackApi;
