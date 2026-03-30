/**
 * @author David Menger
 */
'use strict';

const assert = require('assert').strict;
const sinon = require('sinon');
const { ai } = require('../src/Ai');
const LLM = require('../src/LLM');
const LLMMockProvider = require('../src/LLMMockProvider');
const LLMSession = require('../src/LLMSession');

describe('<LLMSession>', () => {

    /** @type {LLM} */
    let llm;

    beforeEach(() => {
        llm = new LLM({
            provider: new LLMMockProvider()
        }, ai);
    });

    describe('#async behavior', () => {

        it('should be prone to catch sync exceptions', async () => {
            const s = new LLMSession(llm);

            assert.throws(() => {
                s.send();
            });
        });

        it('should be prone to catch async exceptions', async () => {
            const s = new LLMSession(llm);

            let thrown;

            try {
                await s.systemPrompt('THROW EXCEPTION')
                    .generate();
            } catch (e) {
                thrown = e;
            }

            assert.equal(thrown?.message, 'THROW EXCEPTION');
        });

    });

    describe('#tools', () => {

        it('processes info with tools', async () => {
            const spy = sinon.spy(() => 'fn return');
            // @ts-ignore
            const mock = (arg) => spy(arg);

            const res = await llm.session()
                .assistant('hello')
                .tool(mock)
                .user('CALL MOCK TOOL')
                .generate()
                .debug();

            assert.strictEqual(res.content, 'got tool call id');
        });

    });

});
