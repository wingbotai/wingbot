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
            const { request, responses = [] } = turn;

            return [
                { fromBot: false, text: extractText(request) },
                ...responses
                    .map((response) => ({ fromBot: true, text: extractText(response) }))
            ];
        })
        .reduce((ret, arr) => [...ret, ...arr], [])
        .filter((ret) => !!ret.text);
}

module.exports = transcriptFromHistory;
