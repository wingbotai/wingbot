/**
 * @author David Menger
 */
'use strict';

/** @typedef {import('./transcriptFromHistory').Transcript} Transcript */

/**
 * @typedef {object} Options
 * @prop {string} [timezone]
 * @prop {string} [locale]
 */

/**
 * @param {Transcript[]} transcript
 * @param {string} [userSide]
 * @param {string} [botSide]
 * @param {Options} [options]
 * @returns {string}
 */
function htmlBodyFromTranscript (transcript, userSide = 'User', botSide = 'Bot', options = {}) {

    let lastDate = null;
    let lastTime = null;
    const showDate = options.locale && options.timezone;

    return transcript
        .flatMap((msg) => {
            const line = `<b>${msg.fromBot ? botSide : userSide}:</b> ${msg.text}`;

            if (!showDate || !msg.timestamp) {
                return [line];
            }

            const d = new Date(msg.timestamp);

            const date = d.toLocaleDateString(options.locale, {
                year: 'numeric', month: 'numeric', day: 'numeric', timeZone: options.timezone
            });
            const time = d.toLocaleTimeString(options.locale, {
                hour: 'numeric', minute: 'numeric', timeZone: options.timezone
            });

            if (lastTime === time && lastDate === date) {
                return [line];
            }

            const timeLine = `<i><small>${lastTime ? '<br />' : ''}(${date} ${time})</small></i>`;
            lastDate = date;
            lastTime = time;

            return [timeLine, line];
        })
        .join('<br />');
}

module.exports = htmlBodyFromTranscript;
