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
 * reducer.on('action', (senderId, processedAction, text, req, lastAction, skill, res) => {
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
        const act = res._trackAsAction || action || req.action();

        const expected = req.expected();
        const isExpectedAction = expected && act === expected.action;

        const shouldNotTrack = res._trackAsAction === false || doNotTrack;
        const trackingSkill = typeof res.newState._trackAsSkill === 'undefined'
            ? (req.state._trackAsSkill || null)
            : res.newState._trackAsSkill;

        res._trackAsAction = null;

        const params = [
            req.senderId,
            act,
            req.text(),
            req,
            lastAction,
            shouldNotTrack,
            trackingSkill,
            res
        ];

        let { lastInteraction = null } = req.state;
        let beforeLastInteraction;

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

        if (act && !shouldNotTrack && !isExpectedAction && typeof res._visitedInteraction === 'function') {
            res._visitedInteraction(act);
        }

        if (act && res.data) {
            const shouldDelayTrack = shouldNotTrack || isExpectedAction;
            const shouldSetLastInteraction = res.data._fromInitialEvent
                || res.data._fromUntrackedInitialEvent;

            if (shouldDelayTrack && shouldSetLastInteraction) {
                res.setData({ _initialEventWasntTracked: true });
            }
            // @todo _fromUntrackedInitialEvent should be removed with exists
            if (!shouldDelayTrack && shouldSetLastInteraction) {

                res.setState({
                    lastInteraction,
                    beforeLastInteraction
                });
                res.setData({
                    lastInteractionSet: lastInteraction
                });
            }
        }

        if (act && !shouldNotTrack) {
            res.setState({
                _lastAction: act,
                lastAction: act
            });
        }
        this.emit('_action', ...params);
        if (!shouldNotTrack) {
            process.nextTick(() => {
                this.emit('action', ...params);
            });
        }
    }

}

module.exports = ReducerWrapper;
