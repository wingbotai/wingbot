const { compileWithState } = require('../../src/utils');
const { StepState, getNextStep, StepType } = require('../../src/utils/slots');
const { vars } = require('../../src/utils/stateVariables');

/** @typedef {import('../../src/Router').Resolver} Resolver */
/** @typedef {import('../../src/Responder')} Responder */
/** @typedef {import('../../src/utils/slots').SlotBotState} SlotBotState */
/** @typedef {import('../../src/utils/slots').SlotsResolver} SlotsResolver */
/** @typedef {import('../../src/utils/slots').SlotsRequest} SlotsRequest */

/**
 * @param {object} params
 * @param {string} [params.skip]
 * @returns {SlotsResolver}
 */
function slotsContinue ({
    skip
}) {

    /**
     * @param {SlotsRequest} req
     * @param {Responder} res
     * @param {Function} postBack
     * @returns {Promise}
     */
    async function slotsContinuePlugin (req, res, postBack) {
        const state = { ...req.state, ...res.newState };

        const { _slotStep: step } = state;
        let { _slotState: slotState } = state;

        if (!step || !slotState) {
            const msg = 'ERROR: slot filling was not initialized (use the "continue" plugin after the "initialize")';
            res.text(msg);
            throw new Error(msg);
        }

        const skipEntities = compileWithState(req, res, skip)
            .split(',')
            .map((e) => e.trim());

        const clear = {};

        slotState = slotState.map((s) => {
            if (skipEntities.includes(s.e)) {
                if (s.t === StepType.MULTI) {
                    const entity = step.entity.replace(/^@/, '+');
                    Object.assign(clear, vars.dialogContext(entity, [], true));
                } else {
                    Object.assign(clear, vars.dialogContext(s.e, null, true));
                }
                return { ...s, s: StepState.INITIALIZED };
            }

            return s.e === step.entity
                ? { ...s, s: StepState.FILLED }
                : s;
        });

        res.setState({ ...clear, _slotState: slotState });

        return getNextStep(req, res, postBack);
    }

    return slotsContinuePlugin;
}

module.exports = slotsContinue;
