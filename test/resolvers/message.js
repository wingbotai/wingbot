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
    volume: undefined,
    voice: 'voice',
    style: null,
    language: 'language'
};

const noVoiceMessageParams = {
    hasCondition: false,
    replies: [],
    style: null,
    speed: undefined
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

    describe('quick reply translation', () => {

        it('shows translated quick replies', async () => {
            const bot = new Router();

            bot.use('go', message({
                text: [
                    { l: 'cs', t: ['Czech text'] },
                    { l: 'en', t: ['English text'] }
                ],
                replies: [
                    {
                        targetRouteId: 'route-id',
                        title: [
                            { l: 'cs', t: 'Czech reply' },
                            { l: 'en', t: 'En reply' }
                        ]
                    }
                ]
            }, {
                isLastIndex: true,
                isLastMessage: true,
                allowForbiddenSnippetWords: false,
                linksMap: new Map([
                    ['route-id', '/some']
                ])
            }));

            const t = new Tester(bot);

            t.setState({ lang: 'en' });

            await t.postBack('go');

            t.any().contains('English text');
            t.any().quickReplyTextContains('En reply');
        });

    });

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

    // messages are correct based on selected language
    describe('correct multilingual messages', () => {
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
                        text: [
                            {
                                l: 'cs',
                                t: [
                                    'czech message'
                                ]
                            },
                            {
                                l: 'en',
                                t: [
                                    'english message'
                                ]
                            }
                        ],
                        hasCondition: false,
                        conditionFn: '(req, res) => {\n    return true;\n}',
                        replies: [],
                        speed: [
                            {
                                l: 'cs',
                                t: 1.01
                            },
                            {
                                l: 'en',
                                t: 1.05
                            }
                        ],
                        pitch: [
                            {
                                l: 'en',
                                t: 12
                            }
                        ],
                        volume: [
                            {
                                l: 'cs',
                                t: null
                            }
                        ]
                    },
                    {},
                    { isLastIndex: true }
                )
            );

            t = new Tester(bot);
        });

        it('should get proper control for czech', async () => {
            t.setState({ lang: 'cs' });
            t.setFeatures([FEATURE_TEXT, FEATURE_VOICE]);
            await t.postBack('messageResolver', null, null, null);
            const { text, voice } = t.lastRes().response.message;
            assert(text.includes('czech message'));
            assert.deepEqual(voice, {
                speed: 1.01
            });
        });

        it('should get proper control for english', async () => {
            t.setState({ lang: 'en' });
            t.setFeatures([FEATURE_TEXT, FEATURE_VOICE]);
            await t.postBack('messageResolver', null, null, null);
            const { text, voice } = t.lastRes().response.message;
            assert(text.includes('english message'));
            assert.deepEqual(voice, {
                speed: 1.05,
                pitch: 12
            });
        });
    });
});
