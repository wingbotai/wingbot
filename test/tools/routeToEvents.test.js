/*
 * @author {David Menger}
 */
'use strict';

const { strict: assert } = require('assert');
const routeToEvents = require('../../src/tools/routeToEvents');

const PAGE_ID = 'page';
const SENDER_ID = 'sender';

describe('routeToEvents', () => {

    it('returns event list with timestamps', async () => {
        const events = await routeToEvents(PAGE_ID, SENDER_ID, { a: 1 }, [
            {
                type: 'botbuild.message',
                params: {
                    text: 'Hello {{a}}'
                }
            },
            {
                type: 'botbuild.postback',
                params: {
                    postBack: 'toBot'
                }
            },
            {
                type: 'botbuild.setState',
                params: {
                    setState: {
                        foo: 'bar',
                        _$subscribe: ['add'],
                        _$unsubscribe: ['remove']
                    }
                }
            }
        ]);

        assert.deepEqual(events, {
            events: [
                {
                    recipient: { id: SENDER_ID },
                    message: {
                        text: 'Hello 1'
                    },
                    messaging_type: 'RESPONSE'
                },
                {
                    sender: { id: SENDER_ID },
                    postback: {
                        payload: 'toBot'
                    }
                }
            ],
            setState: { foo: 'bar' },
            subscribe: ['add'],
            unsubscribe: ['remove']
        });

        // @todo setState, subscribe, ?
    });

});
