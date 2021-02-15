/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../src/Tester');
const Router = require('../src/Router');
const Ai = require('../src/Ai');
const CustomEntityDetectionModel = require('../src/wingbot/CustomEntityDetectionModel');
const Request = require('../src/Request');

const { ai } = Ai;

describe('<Ai> entity context', () => {

    /** @type {Tester} */
    let t;

    before(() => {
        ai.register(new CustomEntityDetectionModel({}))
            .setEntityDetector('customentity', (text) => {
                const match = text.match(/youyou/);

                if (!match) {
                    return null;
                }
                return {
                    text: match[0],
                    value: 'detected'
                };
            })
            .setEntityDetector('fromEntity', (text) => {
                const match = text.match(/fromentity/);

                if (!match) {
                    return null;
                }
                return {
                    text: match[0],
                    value: 'detected'
                };
            })
            .setEntityDetector('toEntity', (text) => {
                const match = text.match(/toentity/);

                if (!match) {
                    return null;
                }
                return {
                    text: match[0],
                    value: 'detected'
                };
            });
    });

    beforeEach(() => {
        const bot = new Router();

        const first = new Router();

        first.use(ai.global('custom', ['@customentity']), (req, res) => {
            res.text(`e ${req.entity('customentity')}`);
        });

        first.use('chacha', (req, res) => {
            res.text(`X ${req.state['@customentity']}`);
        });

        first.use(ai.global('foo-with', ['foo', '@entity']), (req, res) => {
            res.text('foo with entity');
        });

        first.use(ai.global('persist-with', ['persist', '@entity']), (req, res) => {
            res.setState({ '@entity': 'persist' });
            res.text('persist with entity');
        });

        first.use(ai.global('bar-with', ['bar', '@entity']), (req, res) => {
            res.text('bar with entity')
                .text(`req.entity ${req.entity('entity')}`, [
                    { action: '/second/a', title: 'goto', match: ['@entity?'] }
                ]);
        });

        first.use(ai.global('bar-without', ['bar']), (req, res) => {
            res.text('bar without entity', [
                { action: 'bar-with', title: 'set en', match: ['@entity=value'] },
                {
                    action: 'bar-with',
                    title: 'setstate',
                    // match: ['@entity=value'],
                    setState: { '@entity': { x: 1 }, '@customentity': 'youyou' }
                },
                { action: 'chacha', match: ['@customentity'], title: 'try' },

                {
                    action: 'setStateToEntity',
                    match: ['@toEntity=toentity'],
                    setState: { here: { _$entity: 'toEntity' }, lele: { _$textInput: true } },
                    title: 'setStateToEntity'
                },

                {
                    action: 'setStateFromEntity',
                    match: ['@fromEntity'],
                    setState: { here: { _$entity: 'fromEntity' } },
                    title: 'setStateFromEntity'
                }
            ]);
        });

        first.use('setStateToEntity', (req, res) => {
            res.text(`en ${req.state.here} ${req.state['@toEntity']} ${req.state.lele}`);
        });

        first.use('setStateFromEntity', (req, res) => {
            res.text(`en ${req.state.here}`);
        });

        first.use(ai.global('first', ['first']), (req, res) => {
            res.text('first without entity')
                .text(`x ${req.state['@entity']}`);
        });

        const second = new Router();

        second.use(ai.global('baz-with', ['baz', '@entity']), (req, res) => {
            res.text('baz with entity');
        });

        second.use(ai.global('baz-without', ['baz', '@entity!=']), (req, res) => {
            res.text('baz without entity');
        });

        second.use(ai.global('second', ['second']), (req, res) => {
            res.text('second without entity');
        });

        second.use('a', (req, res) => {
            res.text(`A ${req.state['@entity']}`, { b: 'goto' });
        });

        second.use('b', (req, res) => {
            res.text(`B ${req.state['@entity']}`);
        });

        first.use('expect', (req, res) => {
            res.text('gimme').expected('next');
        });

        first.use('next', async (req, res, postBack) => {
            if (req.actionByAi()) {
                await postBack(req.actionByAi(), {}, true);
            }
            res.text('back here');
        });

        bot.use('start', (req, res) => {
            res.text('Welcome');
        });

        bot.use('same-entities', (req, res) => {
            res.text('test', [
                { action: 'a', match: ['@en=1'] },
                { action: 'b', match: ['@en', '@en'] }
            ]);
        });

        bot.use('a', (req, res) => { res.text('a'); });

        bot.use('b', (req, res) => { res.text('b'); });

        bot.use(ai.global('fakin', ['@entity']), (req, res) => {
            res.text('Fakin');
        });

        bot.use('first', first);
        bot.use('second', second);

        bot.use((req, res) => {
            res.text('fallback');
            if (req.state.mockKeepPreviousContext) {
                res.setState(req.expectedContext(false, true));
            }
        });

        t = new Tester(bot);
    });

    it('prefers the two entities instead of one', async () => {
        await t.postBack('same-entities');

        const e = Request.text(t.senderId, 'txt');

        Request.addIntentToRequest(e, 'intentttt', [
            { entity: 'en', value: '2', score: 1 },
            { entity: 'en', value: '1', score: 1 }
        ], 1);

        await t.processMessage(e);

        t.any().contains('b');
    });

    it('prefers the one entity in exact match', async () => {

        t.setState({
            '@en': '2'
        });

        await t.postBack('same-entities');

        const e = Request.text(t.senderId, 'txt');

        Request.addIntentToRequest(e, 'intentttt', [
            { entity: 'en', value: '1', score: 1 }
        ], 1);

        await t.processMessage(e);

        t.any().contains('a');
    });

    it('is able to set state from the entity condition in quick reply', async () => {
        // set some context
        await t.postBack('/first/bar-without');

        // run the quick reply with entity
        await t.text('setStateToEntity');

        // check it
        t.any().contains('en detected detected setStateToEntity');
    });

    it('is able to detect entity from quick reply', async () => {
        // set some context
        await t.postBack('/first/bar-without');

        // run the quick reply with entity
        await t.text('fromentity');

        // check it
        t.any().contains('en detected');
    });

    it('is able to keep whole entity context, when using req.expectedContext', async () => {
        t.setState({ mockKeepPreviousContext: true });

        // set some context
        await t.intentWithEntity('bar', 'entity', 'sasalele');

        // get into a fallback
        await t.text('nnnnnnnnnnn');

        // and back
        await t.intent('first');

        t.any().contains('first without entity');

        // ant try local intent
        await t.intent('bar');

        t.any().contains('bar with entity');

        // check, if its still there
        await t.intent('first');

        t.any().contains('x sasalele');
    });

    it('is able to keep the entity in context, when using req.expectedContext', async () => {
        t.setState({ mockKeepPreviousContext: true });

        // set some context
        await t.intentWithEntity('bar', 'entity', 'sasalele');

        // get into a fallback
        await t.text('nnnnnnnnnnn');

        // and back
        await t.intent('bar');

        t.any().contains('bar with entity');

        // ant try local intent again
        await t.intent('bar');

        t.any().contains('bar with entity');

        // check, if its still there
        await t.intent('first');

        t.any().contains('x sasalele');
    });

    it('optional entity in quick reply prolongs a context', async () => {
        await t.intentWithEntity('bar', 'entity', 'sasalele');

        t.passedAction('bar-with');

        await t.quickReplyText('goto');

        t.any().contains('A sasalele');

        await t.quickReplyText('goto');

        t.any().contains('B sasalele');
    });

    it('keeps the entity inside a context', async () => {
        await t.intentWithEntity('foo', 'entity', 'value');

        t.any().contains('foo with entity');

        await t.intent('first');

        t.any().contains('first without entity');

        await t.intent('bar');

        t.any().contains('bar with entity');
    });

    it('can override persisted entity', async () => {
        await t.intentWithEntity('persist', 'entity', 'value');

        t.any().contains('persist with entity');

        await t.intent('foo');

        t.any().contains('foo with entity');

        await t.intent('second');

        t.any().contains('second without entity');

        await t.intent('bar');

        t.any().contains('bar with entity');

        await t.intent('second');

        t.any().contains('second without entity');

        await t.intent('foo');

        t.any().contains('foo with entity');
    });

    it('keeps the entity when changing a dialogue', async () => {
        await t.intentWithEntity('foo', 'entity', 'value');

        t.any().contains('foo with entity');

        await t.intent('baz');

        t.any().contains('baz with entity');
    });

    it('keeps the entity when changing a dialogue just for the transmit', async () => {
        await t.intentWithEntity('foo', 'entity', 'value');

        t.any().contains('foo with entity');

        await t.intent('second');

        t.any().contains('second without entity');

        await t.intent('baz');

        t.any().contains('baz without entity');
    });

    it('ignores solo remembered entity', async () => {
        await t.intentWithEntity('foo', 'entity', 'value');

        t.any().contains('foo with entity');

        await t.intent('sasalele');

        t.any().contains('fallback');
    });

    it('keeps the entity while FAQ bounce (and bookmark)', async () => {
        await t.intentWithEntity('foo', 'entity', 'value');

        await t.postBack('/first/expect');

        await t.intent('second');

        t.any()
            .contains('second without entity')
            .contains('back here');

        await t.intent('bar');

        t.any().contains('bar with entity');
    });

    it('saves the entity from quick reply', async () => {
        await t.postBack('/first/bar-without');

        await t.quickReplyText('set en');

        t.any().contains('req.entity value');

        await t.intent('baz');

        t.any().contains('baz with entity');

        await t.intent('bar');

        t.any().contains('bar with entity');
    });

    it('saves the entity from quick reply for limited time', async () => {
        await t.postBack('/first/bar-without');

        await t.quickReplyText('set en');

        await t.intent('second');

        t.any().contains('second without entity');

        await t.intent('bar');

        t.any().contains('bar without entity');
    });

    it('passes the text through entity detector just once', async () => {
        await t.text('youyou');

        t.any().contains('e detected');

        // @ts-ignore
        assert.strictEqual(t.getState().state['@customentity'], 'detected');
    });

    it('passes the text through entity detector just once', async () => {
        await t.postBack('/first/bar-without');

        await t.text('youyou');

        t.any().contains('X detected');

        // @ts-ignore
        assert.strictEqual(t.getState().state['@customentity'], 'detected');
    });

    it('setstate from a quick reply is preferred', async () => {
        await t.postBack('/first/bar-without');

        await t.quickReplyText('setstate');

        // @ts-ignore
        assert.strictEqual(t.getState().state['@customentity'], 'detected');

        await t.intent('second');

        t.any().contains('second without entity');

        await t.intent('bar');

        t.any().contains('bar with entity');
    });

    it('saves the entity from expected keywords', async () => {
        await t.postBack('/first/bar-without');

        await t.intentWithEntity('any', 'entity', 'value');

        t.any().contains('req.entity value');

        await t.intentWithEntity('baz', 'totally', 'unrelated');

        t.any().contains('baz with entity');
    });

});
