/*
 * @author wingbot.ai
 */
'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const { chatWs } = require('@wingbotai/wingbot-ai-orchestrator');
const { serverlessToExpress, createEvent, createContext } = require('./lib/serverlessToExpress');
const { watchTemplates, renderTemplates } = require('./lib/renderTemplates');
const config = require('./config');
const { socket } = require('./webchat');

const distPath = path.join(__dirname, '.', 'dist');
const viewsPath = path.join(__dirname, '.', 'views');

const app = express();

app.disable('x-powered-by');

const cfgFile = path.join(__dirname, '.', 'serverless.yml');

Promise.all([
    serverlessToExpress(cfgFile),
    renderTemplates(config, viewsPath, distPath)
]).then(([api]) => {

    app.use(express.text({ type: () => true, limit: '10mb' }), api);

    // @ts-ignore
    app.use((req, res, next) => {
        const allowCorsOrigin = config.allowCorsOrigin || config.appUrl;
        const useOrigin = allowCorsOrigin === '*'
            ? req.get('Origin')
            : allowCorsOrigin.replace(/\/$/, '');

        res.header('X-Frame-Options', 'DENY');
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        // eslint-disable-next-line quotes
        res.header('Content-Security-Policy', `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://chat.wingbot.ai; img-src 'self' https://wingbot.ai https://*.wingbot.ai ${config.apiUrl.replace(/^(https?:\/\/[^/?#]+).*$/, '$1')}; script-src-elem 'self' 'unsafe-eval' 'unsafe-inline' https://*.wingbot.ai; style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net https://*.wingbot.ai; font-src 'self' https://fonts.gstatic.com https://*.wingbot.ai; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; connect-src 'self' ${config.apiUrl.replace(/^(https?:\/\/[^/?#]+).*$/, '$1')} ${config.wsUrl.replace(/^(wss?:\/\/[^/?#]+).*$/, '$1')}`);

        res.header('Access-Control-Allow-Origin', useOrigin);
        res.header('Access-Control-Allow-Credentials', useOrigin === '*' ? 'false' : 'true');
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
        res.header('Access-Control-Expose-Headers', 'Content-Length');
        res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
        if (config.isProduction) {
            res.header('Strict-Transport-Security', 'max-age=2592000');
        }
        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Max-Age', '86400');
            res.header('Cache-Control', 'max-age=86400');
            return res.send(200);
        }
        res.header('Cache-Control', 'no-cache');
        res.header('Pragma', 'no-cache');
        return next();
    });

    app.use('/', express.static(distPath));

    const port = process.env.PORT || 3000;
    const server = http.createServer(app);

    chatWs(
        api,
        server,
        socket,
        (req, connectionId, eventType, body) => [
            createEvent(req, body, connectionId),
            createContext(eventType)
        ],
        {
            hideVerboseErrors: config.hideVerboseErrors
        }
    );

    server.listen(port, () => {
        console.log(`App listening on port ${port}!`); // eslint-disable-line no-console
        if (!config.isProduction) {
            watchTemplates(config, viewsPath, distPath);
        }
    });
})
    .catch((e) => {
        console.error(e, e.stack); // eslint-disable-line
        process.exit(1);
    });
