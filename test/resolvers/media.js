/**
 * @author Vojtěch Jedlička
 */
'use strict';

const assert = require('assert');
const { Router, Plugins } = require('../..');
const { media } = require('../../src/resolvers');
const Tester = require('../../src/Tester');
const { ConditionOperators } = require('../../src/utils/customCondition');

describe('Media', () => {
    describe('conditions', () => {

        /** @type {Tester} */
        let t;
        beforeEach(() => {
            const bot = new Router();
            const plugins = new Plugins();
            plugins.registerFactory('mediaResolverNoCondition', media);
            plugins.registerFactory('mediaResolverAlwaysPassing', media);
            plugins.registerFactory('mediaResolverNeverPassing', media);
            plugins.registerFactory('mediaResolverCustomCondition', media);
            bot.use(
                'mediaResolverNoCondition',
                plugins.getWrappedPlugin(
                    'mediaResolverNoCondition',
                    {
                        type: 'image'
                    },
                    {},
                    { isLastIndex: true }
                )
            );

            bot.use(
                'mediaResolverAlwaysPassing',
                plugins.getWrappedPlugin(
                    'mediaResolverAlwaysPassing',
                    {
                        type: 'image',
                        hasCondition: true,
                        conditionFn: '()=>true'
                    },
                    {},
                    { isLastIndex: true }
                )
            );

            bot.use(
                'mediaResolverNeverPassing',
                plugins.getWrappedPlugin(
                    'mediaResolverNeverPassing',
                    {
                        type: 'image',
                        hasCondition: true,
                        conditionFn: '()=>false'
                    },
                    {},
                    { isLastIndex: true }
                )
            );

            bot.use(
                'mediaResolverCustomCondition',
                plugins.getWrappedPlugin(
                    'mediaResolverCustomCondition',
                    {
                        type: 'image',
                        hasCondition: true,
                        hasEditableCondition: true,
                        // {{value:string, operator:string, variable:string}[][]}
                        editableCondition: [[{ value: 'thisHasToBeTrue', operator: ConditionOperators['=='], variable: 'var' }]]
                    },
                    {},
                    { isLastIndex: true }
                )
            );

            t = new Tester(bot);
            t.allowEmptyResponse = true;
        });

        it('should work without condition', async () => {
            await t.postBack('mediaResolverNoCondition', null, null, null);
            assert(t.lastRes().response.message.attachment.type === 'image');
        });

        it('should pass', async () => {
            await t.postBack('mediaResolverAlwaysPassing', null, null, null);
            assert(t.lastRes().response.message.attachment.type === 'image');
        });

        it('should never pass', async () => {
            await t.postBack('mediaResolverNeverPassing', null, null, null);
            assert(t.responses.length === 0);
        });

        it('should not pass the condition', async () => {
            t.setState({ someRandomVar: 'thisHasToBeTrue', var: 'thisHasToBeNotTrue' });
            await t.postBack('mediaResolverCustomCondition', null, null, null);
            assert(t.responses.length === 0);
        });

        it('should pass the condition', async () => {
            t.setState({ var: 'thisHasToBeTrue' });
            await t.postBack('mediaResolverCustomCondition', null, null, null);
            assert(t.responses.length === 1);
        });
    });
});
