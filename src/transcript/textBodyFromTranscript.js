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
function textBodyFromTranscript (transcript, userSide = 'User', botSide = 'Bot') {

    return transcript
        .map((msg, i) => `${msg.fromBot ? '  <' : `${i > 0 ? '\n' : ''}# >`} ${msg.fromBot ? botSide : userSide}: ${msg.text}`)
        .join('\n');
}

module.exports = textBodyFromTranscript;
