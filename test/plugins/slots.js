/**
 * @author David Menger
 */
'use strict';

const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');
const Tester = require('../../src/Tester');

describe('<slots>', () => {

    /** @type {Tester} */
    let t;

    const plugins = new Plugins();

    beforeEach(() => {
        const bot = new Router();

        bot.use('sasalele', plugins.getWrappedPlugin('ai.wingbot.slotsRegister', {
            doneAction: '/done',
            intents: 'intent',
            steps: [
                { entity: '@addA', type: 'add', askAction: '/blem' },
                {
                    entity: '@first', type: 'req', askAction: '/first', validateAction: '/valid-first'
                },
                { entity: '@second', type: 'mul', askAction: '/second' },
                { entity: '@addB', type: 'add', askAction: '/blem' }
            ]
        }));

        bot.use('first', (req, res) => {
            res.expectedIntent(['@first'], 'continue');
            res.text('give first', [
                {
                    title: 'two at once',
                    action: 'continue',
                    setState: {
                        '@first': 'foo',
                        '+second': { _$add: 'bar' }
                    }
                }
            ]);
        });

        bot.use('valid-first', (req, res) => {
            if (req.state['@first'] !== 'invalid') {
                return;
            }
            res.text('first invalid');
            res.expectedIntent(['@first'], 'continue');
            res.finalMessageSent = true;
        });

        bot.use('second', (req, res) => {
            res.text('give second');
            res.expectedIntent(['@second'], 'continue', {}, {
                '+second': { _$add: '{{[@second]}}' }
            });
        });

        bot.use('continue', plugins.getWrappedPlugin('ai.wingbot.slotsContinue'));

        bot.use('done', (req, res) => {
            res.text('done');
        });

        bot.use((req, res) => {
            res.text(`not found: ${req.action()}`);
        });

        t = new Tester(bot);
    });

    it('should work with a single entity', async () => {
        await t.intentWithEntity('intent', 'second', 'bar');

        t.passedAction('first');

        await t.entity('first', 'foo');

        t.passedAction('done');

        t.stateContains({
            '@first': 'foo',
            '+second': ['bar']
        });
    });

    it('should work with an intent', async () => {
        await t.intent('intent');

        t.passedAction('first');

        await t.entity('first', 'foo');

        t.debug();

        t.passedAction('second');

        await t.entity('second', 'bar');

        t.debug();
        t.passedAction('done');

        t.stateContains({
            '@first': 'foo',
            '+second': ['bar']
        });
    });

    it('should work with an intent', async () => {
        await t.intent('intent');

        t.passedAction('first');

        await t.quickReplyText('two at once');

        t.debug();
        t.passedAction('done');

        t.stateContains({
            '@first': 'foo',
            '+second': ['bar']
        });
    });

    it('should validate the entity', async () => {
        await t.intent('intent');

        t.passedAction('first');

        await t.entity('first', 'invalid');

        t.passedAction('valid-first');

        await t.entity('first', 'foo');

        t.passedAction('second');

        await t.entity('second', 'bar');

        t.debug();
        t.passedAction('done');

        t.stateContains({
            '@first': 'foo',
            '+second': ['bar']
        });
    });

    it('should validate the entity in the first intent', async () => {
        await t.intentWithEntity('intent', 'first', 'invalid');

        t.passedAction('valid-first');

        await t.entity('first', 'foo');

        t.passedAction('second');

        await t.entity('second', 'bar');

        t.debug();
        t.passedAction('done');

        t.stateContains({
            '@first': 'foo',
            '+second': ['bar']
        });
    });

    it('should work with optional entities', async () => {
        await t.intentWithEntity('intent', 'addA', 'sasalele');

        t.passedAction('first');

        await t.entity('first', 'foo');

        t.passedAction('second');

        await t.entity('second', 'bar');

        t.debug();
        t.passedAction('done');

        t.stateContains({
            '@first': 'foo',
            '@addA': 'sasalele',
            '+second': ['bar']
        });
    });

});
