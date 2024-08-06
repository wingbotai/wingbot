/**
 * @author David Menger
 */
'use strict';

const extractText = require('./extractText');

/**
 * @callback GetInteractions
 * @param {string} senderId
 * @param {string} pageId
 * @param {number} limit
 * @returns {Promise<object[]>}
 */

/**
 * @typedef {object} IChatStorage
 * @prop {GetInteractions} getInteractions
 */

/**
 * @typedef {object} Transcript
 * @prop {string} text
 * @prop {boolean} fromBot
 * @prop {number} [timestamp]
 */

/**
 *
 * @param {IChatStorage} chatLogStorage
 * @param {string} senderId
 * @param {string} pageId
 * @param {number} [limit]
 * @param {string} [onlyFlag]
 * @returns {Promise<Transcript[]>}
 */
async function transcriptFromHistory (
    chatLogStorage,
    senderId,
    pageId,
    limit = 20,
    onlyFlag = null
) {
    if (typeof chatLogStorage.getInteractions !== 'function') {
        return [];
    }
    let data = await chatLogStorage.getInteractions(senderId, pageId, limit);

    if (onlyFlag) {
        data = data.filter((h) => h.flag === onlyFlag);
    }

    return data
        .map((turn) => {
            let { timestamp } = turn;
            const { request, responses = [] } = turn;

            if (!timestamp) {
                timestamp = request.timestamp || null;
            }

            return [
                { fromBot: false, text: extractText(request), timestamp },
                ...responses
                    .map((response) => ({ fromBot: true, text: extractText(response), timestamp }))
            ];
        })
        .reduce((ret, arr) => [...ret, ...arr], [])
        .filter((ret) => !!ret.text);
}

module.exports = transcriptFromHistory;
