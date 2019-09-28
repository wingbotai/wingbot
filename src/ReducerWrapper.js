/*
 * @author David Menger
 */
'use strict';

const EventEmitter = require('events');

/**
 * Solution for catching events. This is useful for analytics.
 *
 * @class ReducerWrapper
 * @extends {EventEmitter}
 *
 * @fires ReducerWrapper#action
 *
 * @example
 * const reducer = new ReducerWrapper((req, res) => {
 *     res.text('Hello');
 * });
 *
 * reducer.on('action', (senderId, processedAction, text, req, lastAction) => {
 *     // log action
 * });
 */
class ReducerWrapper extends EventEmitter {

    /**
     * Creates an instance of ReducerWrapper.
     *
     * @param {Function} [reduce=o => o] - the handler function
     *
     * @memberOf ReducerWrapper
     */
    constructor (reduce = o => o) {
        super();

        this._reduce = reduce;

        this.processMessage = null;

        this.setMaxListeners(Infinity);
    }

    /**
     * Reducer function
     *
     * @param {Request} req
     * @param {Responder} res
     * @param {Function} postBack
     *
     * @memberOf ReducerWrapper
     */
    reduce (req, res, postBack) {
        this._reduce(req, res, postBack);
        this._emitAction(req, res);
    }

    _emitAction (req, res, action = null, doNotTrack = false) {
        const { _lastAction: lastAction = null } = req.state;
        const act = action || req.action();
        const params = [req.senderId, act, req.text(), req, lastAction];

        let { lastInteraction = null } = req.state;
        let beforeLastInteraction;

        const expected = req.expected();
        const isExpectedAction = expected && act === expected.action;

        if (typeof res.newState.lastInteraction !== 'undefined') {
            beforeLastInteraction = lastInteraction;
            ({ lastInteraction } = res.newState);
        } else if (act && !isExpectedAction) {
            beforeLastInteraction = lastInteraction;
            lastInteraction = act;
        }

        if (typeof res.newState.beforeLastInteraction !== 'undefined') {
            ({ beforeLastInteraction } = res.newState);
        }

        if (act && res.data && res.data._fromInitialEvent) {
            res.setState({
                lastInteraction,
                beforeLastInteraction
            });
        }

        if (act) {
            res.setState({
                _lastAction: act,
                lastAction: act
            });
        }
        this.emit('_action', ...params);
        if (!doNotTrack) {
            process.nextTick(() => {
                this.emit('action', ...params);
            });
        }
    }

}

module.exports = ReducerWrapper;
