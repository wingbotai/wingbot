/**
 * @author David Menger
 */
'use strict';

/**
 * Extracts text from conversational event
 *
 * @param {object} payload
 * @returns {string|null}
 */
function extractText (payload) {

    // text message
    if (payload.message && payload.message.text) {
        return payload.message.text;
    }

    // button message
    if (payload.message && payload.message.attachment
        && payload.message.attachment.type === 'template'
        && payload.message.attachment.payload
        && payload.message.attachment.payload.text) {

        return payload.message.attachment.payload.text;
    }

    if (!payload.postback) {
        return null;
    }

    // postback with title
    if (payload.postback.title) {
        return payload.postback.title;
    }

    if (payload.postback.payload && payload.postback.payload.action) {
        return payload.postback.payload.action;
    }

    if (typeof payload.postback.payload !== 'string') {
        return null;
    }

    if (payload.postback.payload[0] === '{') {
        const pl = JSON.parse(payload.postback.payload);

        return pl.action;
    }

    return payload.postback.payload;
}

module.exports = extractText;
