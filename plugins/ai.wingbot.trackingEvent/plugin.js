const { default: fetch } = require('node-fetch');
const { compileWithState } = require('../../src/utils');

function transformEvent (c, a, l, v, req, res) {
    switch (c) {
        case 'generate_lead':
            return {
                name: 'generate_lead',
                params: {
                    currency: l || 'USD',
                    value: v
                }
            };
        case 'view_item':
            return {
                name: 'view_item',
                params: {
                    currency: l || 'USD',
                    value: v,
                    items: [
                        {
                            item_name: res.currentAction(),
                            item_category: a || ''
                        }
                    ]
                }
            };
        case 'purchase':
            return {
                name: 'purchase',
                params: {
                    currency: l || 'USD',
                    transaction_id: `${req.pageId}.${req.senderId}.${req.timestamp}`,
                    value: v,
                    items: [
                        {
                            item_name: res.currentAction(),
                            item_category: a || ''
                        }
                    ]
                }
            };
        case 'tutorial_begin':
        case 'tutorial_complete':
        case 'sign_up':
        case 'share':
            return {
                name: c
            };
        default:
            return null;
    }
}

/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 */
async function trackingEvent (req, res) {
    const {
        category = '',
        action = '',
        label = '',
        value = '',
        type
    } = req.params;

    const c = compileWithState(req, res, category).trim();
    const a = compileWithState(req, res, action).trim();
    const l = compileWithState(req, res, label).trim();
    const v = parseFloat(compileWithState(req, res, value)
        .replace(/[^0-9.]+/, '')) || 0;

    const {
        '§gi': clientId,
        '§gc': gclid
    } = req.state;

    const {
        gaMeasurementId,
        gaApiSecret
    } = req.configuration;

    if (type === 'report' && clientId && gaMeasurementId && gaApiSecret) {

        const ev = transformEvent(c, a, l, v, req, res);

        const body = {
            client_id: clientId,
            timestamp_micros: req.timestamp * 1000,
            non_personalized_ads: false,
            ...(a ? {
                user_properties: {
                    [a]: {
                        value: v || 1
                    }
                }
            } : {}),
            events: ev ? [ev] : []
        };

        const params = {
            method: 'POST',
            body: JSON.stringify(body)
        };

        try {
            res.typingOn();
            const result = await fetch(`https://www.google-analytics.com/mp/collect?api_secret=${encodeURIComponent(gaApiSecret)}&measurement_id=${encodeURIComponent(gaMeasurementId)}`, params);

            // eslint-disable-next-line no-console
            console.log('GA RESPONSE', result.status, body);

        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('GA FAILED', e, body);
        }
    } else if (clientId) {
        // eslint-disable-next-line no-console
        console.error('GA MISSING', req.configuration);
    }

    res.trackEvent(type || 'report', c, a, l, v);
}

module.exports = trackingEvent;
