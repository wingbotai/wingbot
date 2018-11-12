/*
 * @author David Menger
 */
'use strict';

/**
 * If API call is authorized
 *
 * @param {Object} args - gql request
 * @param {{groups:string[],token:Object}} ctx - request context
 * @param {string[]|null|Function} acl - custom acl settings
 * @returns {boolean}
 */
function isAuthorized (args, ctx, acl) {
    const { token = {}, groups } = ctx;
    const { groups: tokenGroups = [] } = token;

    if (typeof acl === 'function') {
        return acl(args, ctx);
    }

    let check = groups;
    if (Array.isArray(acl)) {
        check = [...groups, ...acl];
    }

    return tokenGroups.some(g => check.includes(g.group));
}

module.exports = isAuthorized;
