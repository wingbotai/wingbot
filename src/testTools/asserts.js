/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const deepExtend = require('deep-extend');
const { actionMatches, parseActionPayload } = require('../utils');

/** @typedef {import('../LLM').PromptInfo} PromptInfo */
/** @typedef {import('../LLM').LLMMessage} LLMMessage */

/**
 * Format message
 *
 * @private
 * @param {any} text
 * @param {any} [actual=null]
 * @param {any} [expected=null]
 * @returns {string}
 */
function m (text, actual = null, expected = null) {
    if (text === false) {
        return '';
    }
    let result = '';
    if (expected !== null) {
        result = `. Expected: "${expected}", received: ${actual}`;
    } else if (actual !== null) {
        result = `. ${actual}`;
    }
    return `${text}${result}`;
}

function ex (message, expected, actual = null) {
    let actuals;
    if (Array.isArray(actual)) {
        actuals = actual;
    } else {
        actuals = actual === null ? [] : [actual];
    }

    const msg = `${message}\n  + expected: "${expected}"`;

    if (actuals.length === 0) {
        return msg;
    }

    return `${msg}\n  - actual:   ${actuals
        .map((a) => `"${a}"`).join('\n              ')}`;
}

function getText (response) {
    if (!response || !response.message) {
        return null;
    }
    const { message } = response;
    if (message.text) {
        return message.text;
    }
    if (message.attachment && message.attachment.payload) {
        return message.attachment.payload.title
            || message.attachment.payload.text;
    }
    return null;
}

function getQuickReplies (response) {
    return (response.message && response.message.quick_replies) || [];
}

function getAttachment (response) {
    return response.message && response.message.attachment;
}

/**
 * Checks attachment type
 *
 * @param {object} response
 * @param {string} type
 * @param {string|false} [message='Attachment type does not match'] - use false for no asserts
 * @returns {boolean}
 */
function attachmentType (response, type, message = 'Attachment type does not match') {
    const attachment = getAttachment(response);
    if (message === false && !attachment) {
        return false;
    }
    assert.ok(attachment, m(message, 'there is no attachment'));
    const matches = attachment.type === type;
    if (message === false) {
        return matches;
    }
    assert.ok(matches, m(message, attachment.type, type));
    return true;
}

/**
 * Checks, that response is a text
 *
 * @param {object} response
 * @param {string|false} [message='Should be a text'] - use false for no asserts
 * @returns {boolean}
 */
function isText (response, message = 'Should be a text') {
    const is = typeof getText(response) === 'string' && !response.message.quick_reply;
    if (message === false) {
        return is;
    }
    assert(is, message);
    return true;
}

function searchMatchesText (search, text) {
    let match = false;
    if (search instanceof RegExp) {
        match = text.match(search);
    } else {
        match = `${text}`.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) !== -1;
    }
    return match;
}

/**
 * Checks, that text contain a message
 *
 * @param {object} response
 * @param {string|object} search
 * @param {string|false} [message='Should contain a text'] - use false for no asserts
 * @returns {boolean}
 */
function contains (response, search, message = 'Should contain a text') {
    if (typeof search === 'object') {
        try {
            assert.deepEqual(
                response,
                deepExtend({}, response, search),
                'Event contains'
            );
            return true;
        } catch (e) {
            if (message === false) {
                return false;
            }
            throw e;
        }
    }
    const text = getText(response);
    const typeIsText = typeof text === 'string';
    if (message === false && !typeIsText) {
        return false;
    }
    assert.ok(typeIsText, m(message, search, 'not a message'));
    const match = searchMatchesText(search, text);
    if (message === false) {
        return match;
    }
    assert.ok(match, m(message, text, search));
    return true;
}

/**
 *
 * @param {LLMMessage} llmMsg
 * @param {string} search
 * @param {string|false} message
 */
function llmContains (llmMsg, search, message = 'Should contain a text') {
    const text = llmMsg.content;

    const typeIsText = typeof text === 'string';
    if (message === false && !typeIsText) {
        return false;
    }
    assert.ok(typeIsText, m(message, search, 'not a text message'));
    const match = searchMatchesText(search, text);
    if (message === false) {
        return match;
    }
    assert.ok(match, m(message, text, search));
    return true;
}

/**
 * Checks quick response action
 *
 * @param {object} response
 * @param {string} action
 * @param {string|false} [message='Should contain the action'] - use false for no asserts
 * @returns {boolean}
 */
function quickReplyAction (response, action, message = 'Should contain the action') {
    const replies = getQuickReplies(response);
    const hasItems = replies.length > 0;
    if (message === false && !hasItems) {
        return false;
    }
    assert.ok(hasItems, m(message, action, 'Theres no quick response'));
    const has = replies.some((reply) => {
        const { action: route } = parseActionPayload(reply, true);
        return actionMatches(route, action);
    });
    if (message === false) {
        return has;
    }
    assert.ok(has, m(message, action));
    return true;
}

/**
 * Checks quick response action
 *
 * @param {object} response
 * @param {string} search
 * @param {string|false} [message='Should contain the action'] - use false for no asserts
 * @returns {boolean}
 */
function quickReplyText (response, search, message = 'Should contain the text') {
    const replies = getQuickReplies(response);
    const hasItems = replies.length > 0;
    if (message === false && !hasItems) {
        return false;
    }
    assert.ok(hasItems, m(message, search, 'Theres no quick response'));
    const has = replies.some((reply) => {
        const { title = '' } = reply;
        return searchMatchesText(search, title);
    });
    if (message === false) {
        return has;
    }
    assert.ok(has, m(message, search));
    return true;
}

/**
 * Checks template type
 *
 * @param {object} response
 * @param {string} expectedType
 * @param {string|false} [message='Template type does not match'] - use false for no asserts
 * @returns {boolean}
 */
function templateType (response, expectedType, message = 'Template type does not match') {
    if (message === false && !attachmentType(response, 'template', message)) {
        return false;
    }
    const attachment = getAttachment(response);
    const actualType = attachment.payload && attachment.payload.template_type;
    const typeMatches = actualType === expectedType;
    if (message === false) {
        return typeMatches;
    }
    assert.ok(typeMatches, m(message, actualType, expectedType));
    return true;
}

/**
 * Looks for waiting message
 *
 * @param {object} response
 * @param {string|false} [message='Should be waiting placeholder'] - use false for no asserts
 * @returns {boolean}
 */
function waiting (response, message = 'Should be waiting placeholder') {
    const is = typeof response.wait === 'number';
    if (message === false) {
        return is;
    }
    assert.ok(is, m(message, 'Not a waiting response'));
    return true;
}

/**
 * Looks for pass thread control
 *
 * @param {object} response
 * @param {string} [appId] - look for specific app id
 * @param {string|false} [message='Should be waiting placeholder'] - use false for no asserts
 * @returns {boolean}
 */
function passThread (response, appId = null, message = 'Should pass control') {
    const is = typeof response === 'object' && response.target_app_id;
    const appMatches = appId === null || is === appId;
    if (message === false) {
        return is && appMatches;
    }
    assert.ok(is && appMatches, m(message, 'Not a pass thread response'));
    return true;
}

/**
 *
 * @param {object} response
 * @param {string|false} message
 * @returns {false|object[]}
 */
function buttonTemplateButtons (response, message = 'Button template should contain buttons') {
    const buttons = response.message.attachment
        && response.message.attachment.payload
        && response.message.attachment.payload.buttons;

    const hasItems = Array.isArray(buttons);

    if (!hasItems && message === false) {
        return false;
    }
    assert.ok(hasItems, m(message, 'Is not an array of buttons'));
    return buttons;
}

/**
 * Validates generic template
 *
 * @param {object} response
 * @param {string} search - look for string
 * @param {number} [count]
 * @param {string|false} message
 * @returns {boolean}
 */
function buttonTemplate (response, search, count = null, message = 'Should contain button template') {
    const isGeneric = templateType(response, 'button', message);
    if (!isGeneric) {
        return false;
    }

    const buttons = buttonTemplateButtons(response, message);

    if (!buttons) {
        return false;
    }

    const { text } = response.message.attachment.payload;

    const countMatches = count === null || buttons.length === count;
    const textMatches = searchMatchesText(search, text);

    if ((!countMatches || !textMatches) && message === false) {
        return false;
    }

    assert.ok(countMatches, m(message, buttons.length, count));
    assert.ok(textMatches, m(message, text, search));

    return true;
}

/**
 *
 * @param {object} response
 * @param {string|false} message
 * @returns {false|object[]}
 */
function genericTemplateItems (response, message = 'Generic template should contain items') {
    const elements = response.message.attachment
        && response.message.attachment.payload
        && response.message.attachment.payload.elements;

    const hasItems = Array.isArray(elements);

    if (!hasItems && message === false) {
        return false;
    }
    assert.ok(hasItems, m(message, 'Is not an array of items'));
    return elements;
}

/**
 * Validates generic template
 *
 * @param {object} response
 * @param {number} [count]
 * @param {string|false} message
 * @returns {boolean}
 */
function genericTemplate (response, count = null, message = 'Should contain generic template') {
    const isGeneric = templateType(response, 'generic', message);
    if (!isGeneric) {
        return false;
    }
    if (count === null) {
        return true;
    }
    const elements = genericTemplateItems(response, message);

    if (!elements) {
        return false;
    }

    const countMatches = elements.length === count;

    if (!countMatches && message === false) {
        return false;
    }
    assert.ok(countMatches, m(message, elements.length, count));
    return true;
}

module.exports = {
    contains,
    isText,
    quickReplyAction,
    templateType,
    attachmentType,
    waiting,
    getQuickReplies,
    passThread,
    genericTemplateItems,
    genericTemplate,
    buttonTemplate,
    quickReplyText,
    getText,
    parseActionPayload,
    ex,
    llmContains
};
