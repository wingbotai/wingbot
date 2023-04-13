/**
 * @author wingbot.ai
 */
'use strict';

const { compileWithState } = require('../../src/utils');

function personaPlugin (params) {

    function persona (req, res) {
        let name = compileWithState(req, res, params.name).trim();
        let img = compileWithState(req, res, params.img).trim();

        if (!name && !img) {
            res.setPersona(null);
            return;
        }

        if (name) {
            const foundPersona = res._findPersonaConfiguration(name) || {};
            if (!img) {
                img = foundPersona.profile_pic_url;
            }
            if (foundPersona.name) {
                name = foundPersona.name;
            }
        }

        res.setPersona({
            ...(img ? { profile_pic_url: img } : {}),
            ...(name ? { name } : {})
        });
    }

    return persona;
}

module.exports = personaPlugin;
