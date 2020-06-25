/*
 * @author David Menger
 */
'use strict';

/**
 * If API call is authorized - use for own implementations of API endpoints
 *
 * @param {object} args - gql request
 * @param {{groups: string[], token: object}} ctx - request context
 * @param {string[]|null|Function} acl - custom acl settings
 * @returns {boolean}
 * @example
 * const { apiAuthorizer } = require('wingbot');
 *
 * function createApi (acl = null) {
 *     return {
 *          gqlEndpoint (args, ctx) {
 *              if (!apiAuthorizer(args, ctx, acl)) {
 *                  return null;
 *              }
 *          }
 *     }
 * }
 */
function apiAuthorizer (args, ctx, acl) {
    const { token = {}, groups } = ctx;
    const { groups: tokenGroups = [] } = token;

    if (typeof acl === 'function') {
        return acl(args, ctx);
    }

    let check = groups;
    if (Array.isArray(acl)) {
        check = [...groups, ...acl];
    }

    return tokenGroups.some((g) => check.includes(g.group));
}

module.exports = apiAuthorizer;
