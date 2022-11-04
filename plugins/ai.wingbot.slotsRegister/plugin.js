const { webalize } = require('webalize');
const { ai } = require('../../src/Ai');
const Router = require('../../src/Router');
const { StepState, StepType, getNextStep } = require('../../src/utils/slots');
const { vars } = require('../../src/utils/stateVariables');

/** @typedef {import('../../src/utils/slots').SlotsResolver} SlotsResolver */
/** @typedef {import('../../src/utils/slots').SlotPluginConfig} SlotPluginConfig */
/** @typedef {import('../../src/utils/slots').SlotBotState} SlotBotState */
/** @typedef {import('../../src/utils/slots').SlotState} SlotState */

/**
 *
 * @param {SlotPluginConfig} params
 * @returns {Router<SlotBotState>}
 */
function slotsRegister ({
    steps = [],
    doneAction,
    intents = ''
}) {

    const useIntents = intents.split(',')
        .map((i) => i.trim());

    /** @type {Router<SlotBotState>} */
    const bot = new Router();

    const setEntities = [];

    /** @type {SlotsResolver} */
    const handler = async (req, res, postBack) => {
        // offer rooms or (does'nt matter)

        /** @type {SlotState[]} */
        const slotState = steps.map((step) => {
            const entity = step.entity.replace(/^@/, '');
            const entities = req.entities.filter((e) => e.entity === entity)
                .map((e) => e.value);

            if (entities.length === 0) {
                return {
                    t: step.type,
                    e: step.entity,
                    s: step.type === StepType.ADDITIONAL
                        ? StepState.FILLED
                        : StepState.INITIALIZED
                };
            }

            if (step.type === StepType.MULTI) {
                setEntities.push(vars.dialogContext(`+${entity}`, entities, true));
            } else {
                setEntities.push(vars.dialogContext(step.entity, entities[0], true));
            }

            return {
                t: step.type,
                e: step.entity,
                s: step.validateAction ? StepState.FILLED : StepState.VALID
            };
        });

        res.setState({
            _slotState: slotState,
            _slotSteps: steps,
            _slotDone: doneAction,
            ...Object.fromEntries(
                steps.map(({ entity, type }) => (type === StepType.MULTI
                    ? [entity.replace(/^@/, '+'), []]
                    : [entity, null]))
            ),
            ...setEntities.reduce((o, r) => Object.assign(o, r), {})
        });

        return getNextStep(req, res, postBack);
    };

    bot.use(ai.global('/', useIntents), handler);

    for (const step of steps) {
        bot.use(
            ai.global(webalize(step.entity), [...useIntents, step.entity]),
            handler
        );
    }

    return bot;
}

module.exports = slotsRegister;
