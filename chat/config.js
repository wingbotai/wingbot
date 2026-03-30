/**
 * @author David Menger
 */
'use strict';

const config = {
    secret: 'foo',
    appId: 'bot',
    pageId: 'page',
    // where the assets or html views are stored
    appUrl: 'http://localhost:3000',

    // where the application API lays
    apiUrl: 'http://localhost:3000',

    // where chat websocket lays
    wsUrl: 'ws://localhost:3000',

    // chat cookie
    cookieDomain: undefined,

    allowCorsOrigin: '*',

    isProduction: false,

    environment: 'development',

    gptToken: null
};

try {
    // @ts-ignore
    const dev = module.require('./config.development.js');
    Object.assign(config, dev);
} catch (e) {
    // eslint-disable-next-line no-console
    console.log('* config.development.js was not loaded');
}

module.exports = config;
