/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const getUpdate = require('../utils/getUpdate');
const customFn = require('../utils/customFn');

const SCALAR_TYPES = ['string', 'number', 'boolean'];
const SUBSCRIBE = '_$subscribe';
const UNSUBSCRIBE = '_$unsubscribe';

function setState (params, { isLastIndex, allowForbiddenSnippetWords }) {
    const {
        hasCondition = false,
        conditionFn = '() => true'
    } = params;

    let condition = null;

    if (hasCondition) {
        condition = customFn(conditionFn, '', allowForbiddenSnippetWords);
    }

    const ret = isLastIndex ? Router.END : Router.CONTINUE;
    const keys = Object.keys(params.setState)
        .filter(k => k !== '_');

    return async (req, res) => {

        if (condition !== null) {
            let condRes = condition(req, res);

            if (condRes instanceof Promise) {
                condRes = await condRes;
            }

            if (!condRes) {
                return ret;
            }
        }

        let obj = {};
        let state = { ...req.state, ...res.newState };

        keys.forEach((k) => {
            const val = params.setState[k];
            let set;

            if (k === SUBSCRIBE && Array.isArray(val) && typeof res.subscribe === 'function') {
                val.forEach(v => res.subscribe(v));
            } else if (k === UNSUBSCRIBE && Array.isArray(val) && typeof res.unsubscribe === 'function') {
                val.forEach(v => res.unsubscribe(v));
            } else if (val && typeof val === 'object') {
                if (val._$textInput) {
                    set = req.text();
                } else if (val._$entity) {
                    set = req.entity(val._$entity);
                }
            } else if (val === null || SCALAR_TYPES.includes(typeof val)) {
                set = val;
            }

            if (typeof set !== 'undefined') {
                const up = getUpdate(k, set, state);
                obj = { ...obj, ...up };
                state = { ...state, ...up };
            }
        });


        res.setState(obj);

        return ret;
    };
}

module.exports = setState;
