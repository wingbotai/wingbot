/* eslint-disable no-unused-vars */
/**
 * @author Vojtech Jedlicka
 */
'use strict';

const assert = require('assert');
const { Tester, BuildRouter, Router } = require('..');
const conditionsBot = require('./conditions-bot.json');
const getCondition = require('../src/utils/getCondition');
const {
    ConditionOperators, compare, isSimpleWord, isStringNumber, stringToNumber
} = require('../src/utils/customCondition');
const customCondition = require('../src/utils/customCondition');

const getParamsFromEditableCondition = (editableCondition) => ({
    editableCondition,
    hasCondition: true,
    hasEditableCondition: true,
    description: 'Editable condition'
});

// @ts-ignore
const setState = (variable) => (req, res) => {
    res.setState(variable);
};

// @ts-ignore
const respondWithText = (text) => (req, res) => {
    res.text(text);
};

const assertCondition = async (condition, state, result) => {
    const bot = new Router();
    const t = new Tester(bot);
    t.allowEmptyResponse = true;
    t.setState(state);

    bot.use('test', (req, res) => {
        const r = getCondition(getParamsFromEditableCondition([[condition]]))(req, res);
        res.text(r);
    });
    await t.postBack('test');
    await t.passedAction('test');
    assert(t.any().responses[0].message.text === result);
};

describe('<Conditions>', function () {

    describe('utils', () => {
        it('isSimpleWord', () => {
            assert(isSimpleWord('aaeh'));
            assert(!isSimpleWord('=aaeh ae eg eg'));
        });

        it('isStringNumber', () => {
            assert(!isStringNumber('aefaef'));
            assert(!isStringNumber('1ae1faef1'));
            assert(isStringNumber('1,000.12'));
            assert(!isStringNumber('1.000.12'));
            assert(isStringNumber('1 000,12'));
            assert(isStringNumber('1,123'));
            assert(isStringNumber('1123'));
            assert(isStringNumber('1 123'));
            // @ts-ignore
            assert(!isStringNumber(0));
            assert(!isStringNumber(''));
            // @ts-ignore
            assert(!isStringNumber({ x: '5' }));
        });

        it('stringToNumber', () => {
            assert.throws(() => stringToNumber('1a'));
            assert.throws(() => stringToNumber('NaN'));
            assert(stringToNumber('123') === 123);
            assert(stringToNumber('123 5') === 1235);
            assert(stringToNumber('100,500.23') === 100500.23);
            assert(stringToNumber('100 , 500.23538') === 100500.23538);
            assert(stringToNumber('1000,500') === 1000.5);
            // @ts-ignore
            assert(stringToNumber(10) === 10);
        });

        it('toNumber', () => {

        });
    });

    describe('compare function', () => {

        it('is true', () => {
            assert(compare('x', ConditionOperators['is true']));
            assert(compare(1, ConditionOperators['is true']));
            assert(!compare(0, ConditionOperators['is true']));
            assert(!compare(false, ConditionOperators['is true']));
            assert(compare('1', ConditionOperators['is true']));
            assert(compare('false', ConditionOperators['is true']));
        });

        it('is false', () => {
            assert(!compare('x', ConditionOperators['is false']));
            assert(!compare(1, ConditionOperators['is false']));
            assert(compare(0, ConditionOperators['is false']));
            assert(compare(false, ConditionOperators['is false']));
            assert(!compare('1', ConditionOperators['is false']));
            assert(!compare('false', ConditionOperators['is false']));
        });

        it('==', () => {
            assert(compare('x', ConditionOperators['=='], 'x'));
            assert(compare(1, ConditionOperators['=='], '1'));
            assert(compare('1', ConditionOperators['=='], '1'));
            assert(compare([1, 2], ConditionOperators['>='], '2'));
            assert(compare([1, 2, 'x'], ConditionOperators['>='], '3'));
            assert(!compare('X', ConditionOperators['=='], 'x'));
        });

        it('!==', () => {
            assert(compare('x', ConditionOperators['!='], 'yx'));
            assert(compare(1, ConditionOperators['!='], '2'));
            assert(compare('2', ConditionOperators['!='], '1'));
            assert(compare('X', ConditionOperators['!='], 'x'));
        });

        it('contains', () => {
            assert(compare('x', ConditionOperators.contains, 'x'));
            assert(compare('aefaex', ConditionOperators.contains, 'x'));
            assert(compare('aefaex aegaeg', ConditionOperators.contains, 'x'));
            assert(!compare('aefae aegaeg', ConditionOperators.contains, 'x'));
            assert(compare(122, ConditionOperators.contains, 12));
            assert(compare([1, 2], ConditionOperators.contains, 2));
            assert(!compare([1, 2], ConditionOperators.contains, 3));
            assert(!compare('eafaef', ConditionOperators.contains, 'x'));
            assert(!compare('==54', ConditionOperators.contains, ','));
            assert(compare('==54', ConditionOperators.contains, '='));
        });

        it('not contains', () => {
            assert(compare('x', ConditionOperators['not contains'], 'y'));
            assert(compare(13589, ConditionOperators['not contains'], 2));
            assert(compare('aefaex', ConditionOperators['not contains'], 'z'));
            assert(!compare('eafaexf', ConditionOperators['not contains'], 'x'));
        });

        it('matches regexp', () => {
            assert(compare(474, ConditionOperators['matches regexp'], '[0-9]'));
            assert(compare('474x', ConditionOperators['matches regexp'], '[0-9]x'));
        });

        it('not matches regexp', () => {
            assert(compare(474, ConditionOperators['not matches regexp'], '[a-z]'));
            assert(compare('474x', ConditionOperators['not matches regexp'], '[5-9]x'));
        });

        it('<', () => {
            assert(!compare(500, ConditionOperators['<'], 500));
            assert(compare(474, ConditionOperators['<'], 500));
            assert(compare('474', ConditionOperators['<'], 500));
            assert(compare(474, ConditionOperators['<'], '500'));
            assert(compare('474', ConditionOperators['<'], '500'));
        });

        it('>', () => {
            assert(compare(-100, ConditionOperators['>'], -200));
            assert(!compare(-100, ConditionOperators['>'], -100));
            assert(compare('-100', ConditionOperators['>'], -200));
            assert(compare(-100, ConditionOperators['>'], '-200'));
            assert(compare('-100', ConditionOperators['>'], '-200'));
        });

        it('>=', () => {
            assert(compare(-100, ConditionOperators['>='], -200));
            assert(compare(-100, ConditionOperators['>='], -100));
            assert(compare('-100', ConditionOperators['>='], -200));
            assert(compare(-100, ConditionOperators['>='], '-200'));
            assert(compare('-100', ConditionOperators['>='], '-200'));
        });

        it('<=', () => {
            assert(compare(500, ConditionOperators['<='], 500));
            assert(compare(474, ConditionOperators['<='], 500));
            assert(compare('474', ConditionOperators['<='], 500));
            assert(compare(474, ConditionOperators['<='], '500'));
            assert(compare('474', ConditionOperators['<='], '500'));
        });

        it('properly handles array as a variable', () => {
            assert(compare([0, 0, 0, 1], ConditionOperators['is true']));
            assert(compare([0, 0, 0, 0], ConditionOperators['is false']));
            assert(compare([0, 0, 0, 0], ConditionOperators.contains, '0'));
            assert(compare([0, 0, 'efe', 0], ConditionOperators.contains, 'f'));
            assert(compare([{ isThisTrue: true, thisisFalse: false }, 0, 0, 0], ConditionOperators['is true']));
            assert(compare([{ isThisTrue: false, thisisFalse: false }, 0, 0, 0], ConditionOperators['is false']));
            assert(compare([{ isThisTrue: false, thisisFalse: false, moreNested: { val: true } }, 0, 0, 0], ConditionOperators['is true']));
            assert(compare([{ isThisTrue: false, thisisFalse: false, moreNested: { val: 0 } }, 0, 0, 0], ConditionOperators['is false']));
        });

        it('properly handles object as a variable', () => {
            assert(compare({ t: false, x: true }, ConditionOperators['is true']));
            assert(compare({ t: false, x: false }, ConditionOperators['is false']));
            assert(compare({ t: [0, 0, 0, 'false'], x: false }, ConditionOperators['is false']));
            assert(compare({ t: [0, 0, 0, 'true'], x: false }, ConditionOperators['is true']));
            assert(!compare({ t: { y: [0, 0, 0, 'true'] }, x: false }, ConditionOperators.contains, '1'));
            assert(compare({ t: [0, 'efefex', 0, 'false'], x: false }, ConditionOperators.contains, 'x'));
        });

        it('handles undefined', () => {
            assert(compare('undefined', ConditionOperators['is true']));
            assert(compare('5', ConditionOperators['>'], undefined));
            assert(compare('-5', ConditionOperators['<'], undefined));
        });

        it('throws on invalid operator', () => {
            assert.throws(() => compare({ t: false, x: true }, ConditionOperators['is truegeg']));

        });

    });

    it('should work from config', async function () {
        // setup
        const bot = BuildRouter.fromData(conditionsBot.blocks);
        const t = new Tester(bot);

        function containsCorrectQuickReplies () {
            t.any()
                .contains('Welcome')
                .quickReplyAction('snippet');
            t.any()
                .contains('Welcome')
                .quickReplyAction('editable');
        }

        async function restart () {
            await t.postBack('/start');
            t.passedAction('start');
            containsCorrectQuickReplies();
        }

        for (let i = 1; i < 6; i++) {
            await restart();

            // Snippet
            await t.quickReply('snippet');
            t.passedAction('snippet');
            if (i < 3) {
                t.any()
                    .contains('this is snippet < 3');
            } else {
                t.any()
                    .contains('this is snippet >= 3');
            }

            await restart();

            // Editable
            await t.quickReply('editable');
            t.passedAction('editable');
            if (i < 3) {
                t.any()
                    .contains('this is editable < 3');
            } else {
                t.any()
                    .contains('this is editable >= 3');
            }

        }

    });

    it('throws on invalid condition', async () => {
        assert.throws(() => customCondition(null));
    });

    it('handles weird values in handlebars', async () => {
        await assertCondition(
            {
                value: '{{{xyz}}}',
                operator: ConditionOperators['=='],
                variable: 'x.2.z'
            },
            {
                x: [
                    {}, {}, {
                        z: 'abcedfg'
                    }
                ],
                xyz: '\\"""'
            },
            false
        );
        await assertCondition(
            {
                value: '{{{xyz}}}',
                operator: ConditionOperators['=='],
                variable: 'x.2.z'
            },
            {
                x: [
                    {}, {}, {
                        z: '\\"""'
                    }
                ],
                xyz: '\\"""'
            },
            true
        );
    });

    it('handles handlebars', async () => {
        await assertCondition(
            {
                value: '{{variable}}',
                operator: ConditionOperators['=='],
                variable: 'x.2.z'
            },
            {
                x: [
                    {}, {}, {
                        z: 'matching'
                    }
                ],
                variable: 'matching'
            },
            true
        );
        await assertCondition(
            {
                value: '{{variable}}',
                operator: ConditionOperators['=='],
                variable: 'x.2.z'
            },
            {
                x: [
                    {}, {}, {
                        z: 'n0tmatching'
                    }
                ],
                variable: 'matching'
            },
            false
        );
    });

    it('handles object as variable', async () => {
        await assertCondition(
            {
                value: '[a-z]',
                operator: ConditionOperators['matches regexp'],
                variable: 'x.2.z'
            },
            {
                x: [
                    {}, {}, {
                        z: 'a'
                    }
                ],
                variable: 'a'
            },
            true
        );
        await assertCondition(
            {
                value: '[0-9]',
                operator: ConditionOperators['matches regexp'],
                variable: 'x.2.z'
            },
            {
                x: [
                    {}, {}, {
                        z: 'a'
                    }
                ]
            },
            false
        );
    });
});
