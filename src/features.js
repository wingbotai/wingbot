/**
 * @author wingbot.ai
 */
'use strict';

/**
 * @constant {string} FEATURE_TEXT channel supports text communication
 */
const FEATURE_TEXT = 't';

/**
 * @constant {string} FEATURE_VOICE channel supports voice messages
 */
const FEATURE_VOICE = 'v';

/**
 * @constant {string} FEATURE_SSML channel supports SSML voice messages
 */
const FEATURE_SSML = 's';

/**
 * @constant {string} FEATURE_PHRASES channel supports expected phrases messages
 */
const FEATURE_PHRASES = 'p';

function getDefaultFeatureList () {
    return [FEATURE_TEXT];
}

module.exports = {
    FEATURE_TEXT,
    FEATURE_VOICE,
    FEATURE_SSML,
    FEATURE_PHRASES,
    getDefaultFeatureList
};
