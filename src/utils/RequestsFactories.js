/*
 * @author David Menger
 */
'use strict';

const counter = {
    _t: 0,
    _d: 0
};

function makeTimestamp () {
    let now = Date.now();
    if (now > counter._d) {
        counter._t = 0;
    } else {
        now += ++counter._t;
    }
    counter._d = now;
    return now;
}

class RequestsFactories {

    static timestamp () {
        return makeTimestamp();
    }

    static createReferral (action, data = {}, timestamp = makeTimestamp()) {
        return {
            timestamp,
            ref: JSON.stringify({
                action,
                data
            }),
            source: 'SHORTLINK',
            type: 'OPEN_THREAD'
        };
    }


    static postBack (
        senderId,
        action,
        data = {},
        refAction = null,
        refData = {},
        timestamp = makeTimestamp()
    ) {
        const postback = {
            payload: {
                action,
                data
            }
        };
        if (refAction) {
            Object.assign(postback, {
                referral: RequestsFactories.createReferral(refAction, refData, timestamp)
            });
        }
        return {
            timestamp,
            sender: {
                id: senderId
            },
            postback
        };
    }

    static campaignPostBack (
        senderId,
        campaign,
        timestamp = makeTimestamp(),
        data = null,
        taskId = null
    ) {
        const postback = RequestsFactories.postBack(
            senderId,
            campaign.action,
            data || campaign.data,
            null,
            {},
            timestamp
        );
        return Object.assign(postback, {
            campaign,
            taskId
        });
    }

    static text (senderId, text, timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                text
            }
        };
    }

    static passThread (senderId, newAppId, data = null, timestamp = makeTimestamp()) {
        let metadata = data;
        if (data !== null && typeof data !== 'string') {
            metadata = JSON.stringify(data);
        }
        return {
            timestamp,
            sender: {
                id: senderId
            },
            pass_thread_control: {
                new_owner_app_id: newAppId,
                metadata
            }
        };
    }

    static intent (senderId, text, intentName, score = null, timestamp = makeTimestamp()) {
        const res = RequestsFactories.text(senderId, text, timestamp);

        Object.assign(res, { intent: intentName, score });

        return res;
    }

    static intentWithEntity (
        senderId,
        text,
        intentName,
        entity,
        value,
        score = null,
        timestamp = makeTimestamp()
    ) {
        const res = RequestsFactories.text(senderId, text, timestamp);

        Object.assign(res, {
            intent: intentName,
            entities: [
                { entity, value }
            ],
            score
        });

        return res;
    }

    static quickReply (senderId, action, data = {}, timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                text: action,
                quick_reply: {
                    payload: JSON.stringify({
                        action,
                        data
                    })
                }
            }
        };
    }

    static quickReplyText (senderId, text, payload, timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                text,
                quick_reply: {
                    payload
                }
            }
        };
    }

    static location (senderId, lat, long, timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                attachments: [{
                    type: 'location',
                    payload: {
                        coordinates: { lat, long }
                    }
                }]
            }
        };
    }

    static referral (senderId, action, data = {}, timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            referral: RequestsFactories.createReferral(action, data, timestamp)
        };
    }

    static optin (userRef, action, data = {}, timestamp = makeTimestamp()) {
        const ref = Buffer.from(JSON.stringify({
            action,
            data
        }));
        return {
            timestamp,
            optin: {
                ref: ref.toString('base64'),
                user_ref: userRef
            }
        };
    }

    static fileAttachment (senderId, url, type = 'file', timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                attachments: [{
                    type,
                    payload: {
                        url
                    }
                }]
            }
        };
    }

    static sticker (senderId, stickerId, url = '', timestamp = makeTimestamp()) {
        return {
            timestamp,
            sender: {
                id: senderId
            },
            message: {
                attachments: [{
                    type: 'image',
                    payload: {
                        url,
                        sticker_id: stickerId
                    }
                }]
            }
        };
    }

    static readEvent (senderId, watermark, timestamp = makeTimestamp()) {
        return {
            sender: {
                id: senderId
            },
            timestamp,
            read: {
                watermark
            }
        };
    }

    static deliveryEvent (senderId, watermark, timestamp = makeTimestamp()) {
        return {
            sender: {
                id: senderId
            },
            timestamp,
            delivery: {
                watermark
            }
        };
    }

}

module.exports = RequestsFactories;
