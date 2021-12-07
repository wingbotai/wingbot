/**
 * @author Vojtech Jedlicka
 */
'use strict';

const { message } = require('../../src/resolvers');
const Tester = require('../../src/Tester');

const defaultMessageParams = {
    "hasCondition": false,
    "replies": [],
    "speed": 2,
    "pitch": 2,
    "volume": 2,
    "voice": "voice",
    "style": null,
    "language": "language"
}

const ssmlText = [
        {
          "l": null,
          "t": [
            "voiceText",
            "<speak>ssml</speak>",
            "voiceOnly",
            "textOnly"
          ],
          "p": [
            null,
            "s",
            "v",
            "t"
          ]
        }
      ];

/**
 * 
 * @param {string[]} features - null, s, v, t
 */
function generateParams(features){

}

describe('<Message resolver>', () => {
    it('pass voice control', () => {
        const messageGenerator = message({
            text: [{ lang: 'cs', t: 'text' }],
            voice: [{ lang: 'cs', t: 'voice' }]
        }, {
            isLastIndex: true, isLastMessage: true, linksMap: null, allowForbiddenSnippetWords: null
        });

        const tester = new Tester();
        tester.allowEmptyResponse = true;
        tester.

        const ret = messageGenerator();
    });
});
