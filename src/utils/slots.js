/**
 * @author {David Menger}
 */
'use strict';

const Router = require('../Router');
const Request = require('../Request'); // eslint-disable-line no-unused-vars

/** @typedef {import('../Responder')} Responder */

/**
 * @readonly
 * @enum {string}
 */
const StepType = {
    REQUIRED: 'req',
    MULTI: 'mul',
    ADDITIONAL: 'add'
};

/**
 * @readonly
 * @enum {string}
 */
const StepState = {
    INITIALIZED: 'i',
    FILLED: 'f',
    VALID: 'v'
};

/**
 * @typedef {object} SlotStep
 * @prop {string} entity
 * @prop {StepType} type
 * @prop {string} [validateAction]
 * @prop {string} askAction
 */

/**
 * @typedef {object} SlotState
 * @prop {string} e
 * @prop {StepState} s
 */

/**
 * @typedef {object} SlotBotState
 * @prop {SlotState[]} _slotState
 * @prop {SlotStep} [_slotStep]
 * @prop {SlotStep[]} [_slotSteps]
 * @prop {string} [_slotDone]
 */

/**
 * @typedef {object} SlotPluginConfig
 * @prop {SlotStep[]} steps
 * @prop {string} doneAction
 * @prop {string} intents
 */

/** @typedef {import('../Router').Resolver<SlotBotState>} SlotsResolver */
/** @typedef {Request<SlotBotState>} SlotsRequest */

/**
 * @param {Request<SlotBotState>} req
 * @param {Responder} res
 * @param {Function} postBack
 * @returns {Promise}
 */
async function getNextStep (req, res, postBack) {
    let invalid = null;
    const {
        _slotState: slotState, _slotSteps: steps, _slotDone: doneAction, ...rest
    } = { ...req.state, ...res.newState };

    for (const slot of slotState) {
        const step = steps.find((s) => s.entity === slot.e);
        if (step && slot.s === StepState.INITIALIZED && (
            (step.type !== StepType.MULTI && rest[slot.e])
            || (step.type === StepType.MULTI && rest[slot.e.replace(/^@/, '+')] && rest[slot.e.replace(/^@/, '+')].length))) {

            slot.s = StepState.FILLED;
        }

        if (slot.s === StepState.FILLED && step && step.validateAction) {
            await postBack(step.validateAction, {}, true);
            if (res.finalMessageSent) {
                invalid = step;
                break;
            }
            slot.s = StepState.VALID;
        } else if (slot.s === StepState.FILLED) {
            slot.s = StepState.VALID;
        }
    }

    res.setState({ _slotState: slotState });

    if (invalid) {
        res.setState({ _slotStep: invalid });
        return Router.END;
    }

    const nextStep = slotState.find((s) => s.s !== StepState.VALID);

    if (!nextStep) {
        postBack(doneAction);
        return Router.END;
    }
    const stepConfig = steps.find((s) => s.entity === nextStep.e);
    res.setState({ _slotStep: stepConfig });
    postBack(stepConfig.askAction);
    return Router.END;
}

module.exports = {
    getNextStep,
    StepState,
    StepType
};
