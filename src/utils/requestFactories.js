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

function createReferral (action, data = {}, timestamp = makeTimestamp()) {
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


function postBack (
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
            referral: createReferral(refAction, refData, timestamp)
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

function campaignPostBack (senderId, campaign, timestamp = makeTimestamp(), data = null) {
    const postback = postBack(
        senderId,
        campaign.action,
        data || campaign.data,
        null,
        {},
        timestamp
    );
    return Object.assign(postback, {
        campaign
    });
}

function textMessage (senderId, text, timestamp = makeTimestamp()) {
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

function passThread (senderId, newAppId, data = null, timestamp = makeTimestamp()) {
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

function intent (senderId, text, intentName, score = null, timestamp = makeTimestamp()) {
    const res = textMessage(senderId, text, timestamp);

    Object.assign(res, { intent: intentName, score });

    return res;
}

function quickReply (senderId, action, data = {}, timestamp = makeTimestamp()) {
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

function quickReplyText (senderId, text, payload, timestamp = makeTimestamp()) {
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

function location (senderId, lat, long, timestamp = makeTimestamp()) {
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

function referral (senderId, action, data = {}, timestamp = makeTimestamp()) {
    return {
        timestamp,
        sender: {
            id: senderId
        },
        referral: createReferral(action, data, timestamp)
    };
}

function optin (userRef, action, data = {}, timestamp = makeTimestamp()) {
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

function fileAttachment (senderId, url, type = 'file', timestamp = makeTimestamp()) {
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

function readEvent (senderId, watermark, timestamp = makeTimestamp()) {
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

function deliveryEvent (senderId, watermark, timestamp = makeTimestamp()) {
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

module.exports = {
    timestamp: makeTimestamp,
    postBack,
    campaignPostBack,
    text: textMessage,
    passThread,
    intent,
    quickReply,
    quickReplyText,
    location,
    referral,
    optin,
    fileAttachment,
    readEvent,
    deliveryEvent
};
