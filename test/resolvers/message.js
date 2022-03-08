/**
 * @author Vojtěch Jedlička
 */
'use strict';

const assert = require('assert');
const { Router, Plugins } = require('../..');
const { FEATURE_SSML, FEATURE_TEXT, FEATURE_VOICE } = require('../../src/features');
const { message } = require('../../src/resolvers');
const Tester = require('../../src/Tester');

const defaultMessageParams = {
    hasCondition: false,
    replies: [],
    speed: 2,
    pitch: 2,
    volume: 2,
    voice: 'voice',
    style: null,
    language: 'language'
};

const noVoiceMessageParams = {
    hasCondition: false,
    replies: []
};

const ssmlText = [
    {
        l: null,
        t: [
            'voiceText',
            '<speak>ssml</speak>',
            '<speak>ssml</speak>',
            'voiceOnly',
            'textOnly'
        ],
        p: [
            null,
            's',
            's',
            'v',
            't'
        ]
    }
];

describe('Message voice control', () => {
    describe('defaultMessageParams', () => {

        /** @type {Tester} */
        let t;
        beforeEach(() => {
            const bot = new Router();
            const plugins = new Plugins();
            plugins.registerFactory('messageResolver', message);
            bot.use(
                'messageResolver',
                plugins.getWrappedPlugin(
                    'messageResolver',
                    {
                        ...defaultMessageParams,
                        text: ssmlText
                    },
                    {},
                    { isLastIndex: true }
                )
            );

            t = new Tester(bot);
        });
        it('should return only SSML', async () => {
            t.setFeatures([FEATURE_SSML, FEATURE_VOICE]);
            await t.postBack('messageResolver', null, null, null);
            t.lastRes().contains('voice');
            assert(t.lastRes().response.message.voice.ssml.includes('<speak>'));
        });

        it('should return text, or voice text', async () => {
            t.setFeatures([FEATURE_TEXT]);
            await t.postBack('messageResolver', null, null, null);
            assert(!t.lastRes().response.message.voice);
            t.lastRes().contains('text');
        });

        it('should return voice or voice text', async () => {
            t.setFeatures([FEATURE_VOICE]);
            await t.postBack('messageResolver', null, null, null);
            const { voice } = t.lastRes().response.message;
            assert(voice);
            assert(voice.speed === defaultMessageParams.speed);
            assert(voice.pitch === defaultMessageParams.pitch);
            assert(voice.volume === defaultMessageParams.volume);
            assert(voice.voice === defaultMessageParams.voice);
            assert(voice.language === defaultMessageParams.language);
            t.lastRes().contains('voice');
        });

        it('should return from both voice & text alternatives with SSML in voice', async () => {
            t.setFeatures([FEATURE_TEXT, FEATURE_VOICE, FEATURE_SSML]);
            await t.postBack('messageResolver', null, null, null);
            const { text, voice } = t.lastRes().response.message;
            assert(text.includes('voice') || text.includes('text'));
            assert(voice.ssml.includes('<speak>'));
        });

        it('should return voice text', async () => {
            t.setFeatures([FEATURE_TEXT, FEATURE_VOICE]);
            await t.postBack('messageResolver', null, null, null);
            const { text, voice } = t.lastRes().response.message;
            assert(!!voice);
            assert(text.includes('voice') || text.includes('text'));
        });

        it('should return text or voicetext with no features', async () => {
            t.setFeatures(null);
            await t.postBack('messageResolver', null, null, null);
            const { text, voice } = t.lastRes().response.message;
            assert(!voice);
            assert(text.includes('voice') || text.includes('text'));
        });

    });

    describe('noVoiceParams', () => {

        /** @type {Tester} */
        let t;
        beforeEach(() => {
            const bot = new Router();
            const plugins = new Plugins();
            plugins.registerFactory('messageResolver', message);
            bot.use(
                'messageResolver',
                plugins.getWrappedPlugin(
                    'messageResolver',
                    {
                        ...noVoiceMessageParams,
                        text: ssmlText
                    },
                    {},
                    { isLastIndex: true }
                )
            );

            t = new Tester(bot);
        });
        it('should return only SSML', async () => {
            t.setFeatures([FEATURE_SSML, FEATURE_VOICE]);
            await t.postBack('messageResolver', null, null, null);
            t.lastRes().contains('voice');
            assert(t.lastRes().response.message.voice.ssml.includes('<speak>'));
        });

        it('should return text, or voice text', async () => {
            t.setFeatures([FEATURE_TEXT]);
            await t.postBack('messageResolver', null, null, null);
            assert(!t.lastRes().response.message.voice);
            t.lastRes().contains('text');
        });

        it('should return voice or voice text', async () => {
            t.setFeatures([FEATURE_VOICE]);
            await t.postBack('messageResolver');
            const { voice } = t.lastRes().response.message;
            assert(!voice);
            t.lastRes().contains('voice');
        });

        it('should return from both voice & text alternatives with SSML in voice', async () => {
            t.setFeatures([FEATURE_TEXT, FEATURE_VOICE, FEATURE_SSML]);
            await t.postBack('messageResolver', null, null, null);
            const { text, voice } = t.lastRes().response.message;
            assert(text.includes('voice') || text.includes('text'));
            assert(voice.ssml.includes('<speak>'));
        });

        it('should return voice text', async () => {
            t.setFeatures([FEATURE_TEXT, FEATURE_VOICE]);
            await t.postBack('messageResolver', null, null, null);
            const { text, voice } = t.lastRes().response.message;
            assert(!voice);
            assert(text.includes('voice') || text.includes('text'));
        });

        it('should return text or voicetext with no features', async () => {
            t.setFeatures(null);
            await t.postBack('messageResolver', null, null, null);
            const { text, voice } = t.lastRes().response.message;
            assert(!voice);
            assert(text.includes('voice') || text.includes('text'));
        });

    });
});
