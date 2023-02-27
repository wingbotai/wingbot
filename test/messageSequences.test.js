/**
 * @author David Menger
 */
'use strict';

const Tester = require('../src/Tester');
const BuildRouter = require('../src/BuildRouter');
const testbot = require('./simple-testbot.json');

describe('<messageSequences>', () => {

    /** @type {Tester} */
    let t;

    beforeEach(() => {
        // @ts-ignore
        const bot = BuildRouter.fromData(testbot.blocks);

        t = new Tester(bot);
    });

    describe('#sequence messages', () => {

        it('should work', async () => {
            await t.postBack('sequence');

            t.any().contains('first');

            await t.postBack('sequence');

            t.any().contains('second');

            await t.postBack('sequence');

            t.any().contains('third');

            await t.postBack('sequence');

            t.any().contains('first');

            await t.postBack('clear-sequences');

            await t.postBack('sequence');

            t.any().contains('first');
        });

    });

    describe('#random start sequence messages', () => {

        it('should work', async () => {
            t.setExpandRandomTexts(true);

            await t.postBack('random-sequence');

            t.any().contains('second');

            await t.postBack('random-sequence');

            t.any().contains('third');

            await t.postBack('random-sequence');

            t.any().contains('first');

            await t.postBack('random-sequence');

            t.any().contains('second');
        });

    });

});
