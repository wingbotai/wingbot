/**
 * @author David Menger
 */
'use strict';

/** @typedef {import('./transcriptFromHistory').Transcript} Transcript */

/**
 * @param {Transcript[]} transcript
 * @param {string} [userSide]
 * @param {string} [botSide]
 * @returns {string}
 */
function htmlBodyFromTranscript (transcript, userSide = 'User', botSide = 'Bot') {

    return transcript
        .map((msg) => `<b>${msg.fromBot ? botSide : userSide}:</b> ${msg.text}`)
        .join('<br />');
}

module.exports = htmlBodyFromTranscript;
