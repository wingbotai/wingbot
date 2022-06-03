/**
 * @author wingbot.ai
 */
'use strict';

/**
 * @constant {string} FEATURE_TEXT channel supports text communication
 */
const FEATURE_TEXT = 'text';

/**
 * @constant {string} FEATURE_VOICE channel supports voice messages
 */
const FEATURE_VOICE = 'voice';

/**
 * @constant {string} FEATURE_SSML channel supports SSML voice messages
 */
const FEATURE_SSML = 'ssml';

/**
 * @constant {string} FEATURE_PHRASES channel supports expected phrases messages
 */
const FEATURE_PHRASES = 'phrases';

/**
 * @constant {string} FEATURE_TRACKING channel supports tracking protocol
 */
const FEATURE_TRACKING = 'tracking';

function getDefaultFeatureList () {
    return [FEATURE_TEXT];
}

module.exports = {
    FEATURE_TEXT,
    FEATURE_VOICE,
    FEATURE_SSML,
    FEATURE_PHRASES,
    FEATURE_TRACKING,
    getDefaultFeatureList
};
