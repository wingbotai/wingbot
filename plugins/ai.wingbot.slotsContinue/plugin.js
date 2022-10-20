const { StepState, getNextStep } = require('../../src/utils/slots');

/** @typedef {import('../../src/Router').Resolver} Resolver */
/** @typedef {import('../../src/Responder')} Responder */
/** @typedef {import('../../src/utils/slots').SlotBotState} SlotBotState */
/** @typedef {import('../../src/utils/slots').SlotsResolver} SlotsResolver */
/** @typedef {import('../../src/utils/slots').SlotsRequest} SlotsRequest */

/**
 * @returns {SlotsResolver}
 */
function slotContinue () {

    /**
     * @param {SlotsRequest} req
     * @param {Responder} res
     * @param {Function} postBack
     * @returns {Promise}
     */
    async function slotContinuePlugin (req, res, postBack) {
        const state = { ...req.state, ...res.newState };

        const { _slotStep: step } = state;
        let { _slotState: slotState } = state;

        if (!step || !slotState) {
            const msg = 'ERROR: slot filling was not initialized (use the "continue" plugin after the "initialize")';
            res.text(msg);
            throw new Error(msg);
        }
        slotState = slotState.map((s) => (s.e === step.entity
            ? { ...s, s: StepState.FILLED }
            : s));

        res.setState({ _slotState: slotState });

        return getNextStep(req, res, postBack);
    }

    return slotContinuePlugin;
}

module.exports = slotContinue;
