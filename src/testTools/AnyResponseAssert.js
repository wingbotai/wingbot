/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const asserts = require('./asserts');

const m = asserts.ex;

/**
 * Utility for searching among responses
 *
 * @class AnyResponseAssert
 */
class AnyResponseAssert {

    constructor (responses = []) {
        this.responses = responses;
    }

    /**
     * Checks, that response contains text
     *
     * @param {string} search
     * @returns {this}
     *
     * @memberOf ResponseAssert
     */
    contains (search) {
        const ok = this.responses
            .some((res) => asserts.contains(res, search, false));
        if (!ok) {
            const actual = this.responses
                .map((res) => asserts.getText(res))
                .filter((t) => !!t);
            assert.fail(m('No response contains required text', search, actual));
        }
        return this;
    }

    /**
     * Checks quick response action
     *
     * @param {string} action
     * @returns {this}
     *
     * @memberOf ResponseAssert
     */
    quickReplyAction (action) {
        const ok = this.responses
            .some((res) => asserts.quickReplyAction(res, action, false));
        if (!ok) {
            const actual = this.responses
                .map((res) => asserts.getQuickReplies(res))
                .filter((replies) => !!replies)
                .reduce((a, replies) => {
                    for (const reply of replies) {
                        const { action: route } = asserts.parseActionPayload(reply.payload) || {};
                        if (route) {
                            a.push(route);
                        }
                    }
                    return a;
                }, []);
            assert.fail(m('Quick reply action not found', action, actual));
        }
        return this;
    }

    /**
     * Checks quick response text
     *
     * @param {string} search
     * @returns {this}
     *
     * @memberOf ResponseAssert
     */
    quickReplyTextContains (search) {
        const ok = this.responses
            .some((res) => asserts.quickReplyText(res, search, false));
        if (!ok) {
            const actual = this.responses
                .map((res) => asserts.getQuickReplies(res))
                .filter((replies) => !!replies)
                .reduce((a, replies) => {
                    for (const { title } of replies) {
                        if (title) {
                            a.push(title);
                        }
                    }
                    return a;
                }, []);
            assert.fail(m('Quick reply not found', search, actual));
        }
        return this;
    }

    /**
     * Checks template type
     *
     * @param {string} type
     * @returns {this}
     *
     * @memberOf ResponseAssert
     */
    templateType (type) {
        const ok = this.responses
            .some((res) => asserts.templateType(res, type, false));
        assert.ok(ok, `No response contains template type: "${type}"`);
        return this;
    }

    /**
     * Checks for generic template
     *
     * @param {number} itemCount - specified item count
     *
     * @memberOf ResponseAssert
     */
    genericTemplate (itemCount = null) {
        const ok = this.responses
            .some((res) => asserts.genericTemplate(res, itemCount, false));
        assert.ok(ok, 'No response contains valid generic template');
        return this;
    }

    /**
     * Checks for button template
     *
     * @param {string} search
     * @param {number} buttonCount - specified button count
     *
     * @memberOf ResponseAssert
     */
    buttonTemplate (search, buttonCount = null) {
        const ok = this.responses
            .some((res) => asserts.buttonTemplate(res, search, buttonCount, false));
        assert.ok(ok, 'No response contains valid button template');
        return this;
    }

    /**
     * Checks pass thread control
     *
     * @param {string} [appId]
     * @returns {this}
     *
     * @memberOf ResponseAssert
     */
    passThread (appId = null) {
        const ok = this.responses
            .some((res) => asserts.passThread(res, appId, false));
        assert.ok(ok, 'No response contains pass control or pass control app mismatch');
        return this;
    }

    /**
     * Checks attachment type
     *
     * @param {string} type
     * @returns {this}
     *
     * @memberOf ResponseAssert
     */
    attachmentType (type) {
        const ok = this.responses
            .some((res) => asserts.attachmentType(res, type, false));
        assert.ok(ok, `No response contains attachment type: "${type}"`);
        return this;
    }

}

module.exports = AnyResponseAssert;
