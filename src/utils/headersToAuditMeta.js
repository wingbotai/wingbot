/**
 * @author wingbot.ai
 */
'use strict';

module.exports = function headersToAuditMeta (headers) {
    return {
        ua: headers['User-Agent'] || headers['user-agent'] || headers['User-agent'],
        ro: headers.Referer || headers.referer || headers.Origin || headers.origin,
        ip: headers['X-Forwarded-For'] || headers['x-forwarded-for'] || headers['X-Azure-ClientIP'] || headers['x-azure-clientip']
    };
};
