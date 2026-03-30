/*
 * @author wingbot.ai
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const jsYaml = require('js-yaml');
const express = require('express');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

function createContext (functionName = null) {
    return {
        functionName,
        functionVersion: '1.0',
        invokedFunctionArn: '',
        memoryLimitInMB: 200,
        awsRequestId: Date.now(),
        identity: null,
        logGroupName: null,
        logStreamName: null,
        clientContext: {}
    };
}

// eslint-disable-next-line
function createEvent (req, body = null, connectionId = null) {
    let { path: usePath, query } = req;

    if (!usePath && !query) {
        const { pathname, searchParams } = new URL(
            req.url.match(/^http/)
                ? req.url
                : `https://fake.com${req.url}`
        );
        query = Array.from(searchParams.entries())
            .reduce((o, [k, v]) => ({ ...o, [k]: v }), {});
        usePath = pathname;
    }

    const method = `${req.method}`.toUpperCase();

    const ret = {
        body: body || (req.method === 'GET' ? null : req.body),
        httpMethod: method,
        stage: process.env.NODE_ENV || 'development',
        headers: req.headers,
        queryStringParameters: query,
        path: usePath,
        identity: null,
        stageVariables: {},
        pathParameters: req.params,
        requestContext: {
            http: {
                method,
                path: usePath
            }
        }
    };

    if (connectionId) {
        Object.assign(ret.requestContext, {
            connectionId
        });
    }

    return ret;
}

function createCallback (res) {
    return (error, data) => {
        if (data?.headers) {
            res.set(data.headers);
        }
        if (error) {
            res.status(error.statusCode || 500)
                .send(error.body || 'Server Error');
        } else {
            res.status(data.statusCode)
                .send(data.body);
        }
    };
}

function endpoint (handler, funcName) {
    return (req, res) => {
        const event = createEvent(req);
        const context = createContext(funcName);
        const callback = createCallback(res);

        handler(event, context)
            .then((r) => callback(null, r))
            .catch((e) => callback(e));
    };
}

function replaceParams (pathString) {
    return pathString.replace(/\{([a-z0-9]+)\}/ig, ':$1');
}

function createEndpoint (app, funcName, fn, method, pathString) {
    app[method](`/${replaceParams(pathString.replace(/^\//, ''))}`, endpoint(fn, funcName));
}

function extractHandler (fnPath) {
    const [file, ...fn] = fnPath.split('.');
    const fileRequire = path.posix.join('../', file);

    // @ts-ignore
    const handler = module.require(fileRequire);
    return fn.reduce((res, key) => res[key], handler);
}

async function serverlessToExpress (configFile) {
    const contents = await readFile(configFile, 'utf8');
    const data = jsYaml.load(contents);

    const app = express();
    app.disable('x-powered-by');

    app.locals.websocket = {};
    app.locals.iot = {};

    // process endpoints
    // @ts-ignore
    if (data.functions) {

        // @ts-ignore
        Object.keys(data.functions)
            .forEach((functionName) => {
                // @ts-ignore
                const lambda = data.functions[functionName];

                if (!Array.isArray(lambda.events)) {
                    return;
                }

                lambda.events.forEach((event) => {
                    if (event.iot) {
                        const fn = extractHandler(lambda.handler);
                        Object.assign(app.locals.iot, {
                            [functionName]: fn
                        });
                        return;
                    }
                    if (event.websocket) {
                        const { route } = event.websocket;
                        const fn = extractHandler(lambda.handler);
                        Object.assign(app.locals.websocket, {
                            [route]: fn
                        });
                        return;
                    }

                    if (!event.http && !event.httpApi) {
                        return;
                    }

                    let { http = event.httpApi } = event;

                    if (typeof http === 'string') {
                        const [method, httpPath] = http.split(' ');
                        http = {
                            method: method.toLowerCase(),
                            path: httpPath
                        };
                    }

                    const fn = extractHandler(lambda.handler);
                    createEndpoint(app, functionName, fn, http.method, http.path);
                });
            });
    }

    return app;
}

module.exports = {
    serverlessToExpress,
    createEvent,
    createContext
};
