/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../src/Tester');
const Router = require('../src/Router');
const { disambiguationQuickReply } = require('../src/utils/quickReplies');
const { FLAG_DISAMBIGUATION_OFFERED, FLAG_DISAMBIGUATION_SELECTED } = require('../src/flags');

function wait (ms) {
    return new Promise((r) => setTimeout(r, ms));
}

describe('senderMeta', () => {

    describe('tracking of disambiguation quick replies', () => {

        it('should just track', async () => {
            const bot = new Router();

            bot.use('next', (req, res) => {
                res.text('hoj');
            });

            bot.use((req, res) => {
                res.text('Disambiguation', [
                    disambiguationQuickReply('title', 'likely', req.text(), 'next')
                ]);
            });

            let trackedMeta;

            bot.on('action', (senderId, action, text, req, lastAction, doNotTrack, skill, res) => {
                trackedMeta = res.senderMeta;
            });

            const t = new Tester(bot);

            await t.text('disambiguate');

            await wait(5); // there is a next tick

            assert.deepEqual(trackedMeta, {
                flag: FLAG_DISAMBIGUATION_OFFERED,
                disambiguationIntents: ['likely']
            });

            await t.quickReply('next');

            await wait(5); // there is a next tick

            assert.deepEqual(trackedMeta, {
                flag: FLAG_DISAMBIGUATION_SELECTED,
                disambText: 'disambiguate',
                likelyIntent: 'likely'
            });
        });

    });

});
