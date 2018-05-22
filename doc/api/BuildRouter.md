## Classes

<dl>
<dt><a href="#BuildRouter">BuildRouter</a></dt>
<dd></dd>
<dt><a href="#BuildRouter">BuildRouter</a></dt>
<dd></dd>
<dt><a href="#Plugins">Plugins</a></dt>
<dd><p>Custom code plugins for BuildRouter and wingbot.ai</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#ConfigStorage">ConfigStorage</a> : <code>Object</code></dt>
<dd></dd>
</dl>

{% raw %}<div id="BuildRouter">&nbsp;</div>{% endraw %}

## BuildRouter
**Kind**: global class  

* [BuildRouter](#BuildRouter)
    * [new BuildRouter()](#new_BuildRouter_new)
    * [new BuildRouter(block, plugins, context, [request])](#new_BuildRouter_new)
    * _instance_
        * [.keepConfigFor](#BuildRouter_keepConfigFor)
    * _static_
        * [.fromData(blocks, plugins)](#BuildRouter_fromData)

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter()
Build bot from Wingbot configuration file or snapshot url

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter(block, plugins, context, [request])
Create new router from configuration


| Param | Type | Description |
| --- | --- | --- |
| block | <code>Object</code> |  |
| [block.botId] | <code>string</code> | the ID of bot |
| [block.snapshot] | <code>string</code> | snapshot stage of bot |
| [block.token] | <code>string</code> | authorization token for bot |
| [block.routes] | <code>Object</code> | list of routes for direct bot build |
| [block.url] | <code>string</code> | specify alternative configuration resource |
| plugins | [<code>Plugins</code>](#Plugins) | custom code blocks resource |
| context | <code>Object</code> | the building context |
| [context.linksTranslator] | <code>Object</code> | function, that translates links globally |
| [context.configStorage] | [<code>ConfigStorage</code>](#ConfigStorage) | function, that translates links globally |
| [request] | <code>function</code> | the building context |

**Example**  
```javascript
// usage under serverless environment

const { Settings, BuildRouter, Blocks } = require(''wingbot');
const { createHandler, createProcessor } = require(''wingbot/serverlessAWS');
const dynamoDb = require('./lib/dynamodb');
const config = require('./config');

const blocks = new Blocks();

blocks.code('exampleBlock', async (req, res, postBack, context, params) => {
    await res.run('responseBlockName');
});

const bot = new BuildRouter({
    botId: 'b7a71c27-c295-4ab0-b64e-6835b50a0db0',
    snapshot: 'master',
    token: 'adjsadlkadjj92n9u9'
}, blocks);

const processor = createProcessor(bot, {
    appUrl: config.pageUrl,
    pageToken: config.facebook.pageToken,
    appSecret: config.facebook.appSecret,
    autoTyping: true,
    dynamo: {
        db: dynamoDb,
        tablePrefix: `${config.prefix}-`
    }
});

const settings = new Settings(config.facebook.pageToken, log);

if (config.isProduction) {
    settings.getStartedButton('/start');
    settings.whitelistDomain(config.pageUrl);
}

module.exports.handleRequest = createHandler(processor, config.facebook.botToken);
```
{% raw %}<div id="BuildRouter_keepConfigFor">&nbsp;</div>{% endraw %}

### buildRouter.keepConfigFor
Timeout, when the router is not checking for new configuration

**Kind**: instance property of [<code>BuildRouter</code>](#BuildRouter)  
**Properties**

| Type |
| --- |
| <code>number</code> | 

{% raw %}<div id="BuildRouter_fromData">&nbsp;</div>{% endraw %}

### BuildRouter.fromData(blocks, plugins)
**Kind**: static method of [<code>BuildRouter</code>](#BuildRouter)  

| Param | Type | Description |
| --- | --- | --- |
| blocks | <code>Array.&lt;Object&gt;</code> | blocks list |
| plugins | [<code>Plugins</code>](#Plugins) |  |

{% raw %}<div id="BuildRouter">&nbsp;</div>{% endraw %}

## BuildRouter
**Kind**: global class  

* [BuildRouter](#BuildRouter)
    * [new BuildRouter()](#new_BuildRouter_new)
    * [new BuildRouter(block, plugins, context, [request])](#new_BuildRouter_new)
    * _instance_
        * [.keepConfigFor](#BuildRouter_keepConfigFor)
    * _static_
        * [.fromData(blocks, plugins)](#BuildRouter_fromData)

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter()
Build bot from Wingbot configuration file or snapshot url

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter(block, plugins, context, [request])
Create new router from configuration


| Param | Type | Description |
| --- | --- | --- |
| block | <code>Object</code> |  |
| [block.botId] | <code>string</code> | the ID of bot |
| [block.snapshot] | <code>string</code> | snapshot stage of bot |
| [block.token] | <code>string</code> | authorization token for bot |
| [block.routes] | <code>Object</code> | list of routes for direct bot build |
| [block.url] | <code>string</code> | specify alternative configuration resource |
| plugins | [<code>Plugins</code>](#Plugins) | custom code blocks resource |
| context | <code>Object</code> | the building context |
| [context.linksTranslator] | <code>Object</code> | function, that translates links globally |
| [context.configStorage] | [<code>ConfigStorage</code>](#ConfigStorage) | function, that translates links globally |
| [request] | <code>function</code> | the building context |

**Example**  
```javascript
// usage under serverless environment

const { Settings, BuildRouter, Blocks } = require(''wingbot');
const { createHandler, createProcessor } = require(''wingbot/serverlessAWS');
const dynamoDb = require('./lib/dynamodb');
const config = require('./config');

const blocks = new Blocks();

blocks.code('exampleBlock', async (req, res, postBack, context, params) => {
    await res.run('responseBlockName');
});

const bot = new BuildRouter({
    botId: 'b7a71c27-c295-4ab0-b64e-6835b50a0db0',
    snapshot: 'master',
    token: 'adjsadlkadjj92n9u9'
}, blocks);

const processor = createProcessor(bot, {
    appUrl: config.pageUrl,
    pageToken: config.facebook.pageToken,
    appSecret: config.facebook.appSecret,
    autoTyping: true,
    dynamo: {
        db: dynamoDb,
        tablePrefix: `${config.prefix}-`
    }
});

const settings = new Settings(config.facebook.pageToken, log);

if (config.isProduction) {
    settings.getStartedButton('/start');
    settings.whitelistDomain(config.pageUrl);
}

module.exports.handleRequest = createHandler(processor, config.facebook.botToken);
```
{% raw %}<div id="BuildRouter_keepConfigFor">&nbsp;</div>{% endraw %}

### buildRouter.keepConfigFor
Timeout, when the router is not checking for new configuration

**Kind**: instance property of [<code>BuildRouter</code>](#BuildRouter)  
**Properties**

| Type |
| --- |
| <code>number</code> | 

{% raw %}<div id="BuildRouter_fromData">&nbsp;</div>{% endraw %}

### BuildRouter.fromData(blocks, plugins)
**Kind**: static method of [<code>BuildRouter</code>](#BuildRouter)  

| Param | Type | Description |
| --- | --- | --- |
| blocks | <code>Array.&lt;Object&gt;</code> | blocks list |
| plugins | [<code>Plugins</code>](#Plugins) |  |

{% raw %}<div id="Plugins">&nbsp;</div>{% endraw %}

## Plugins
Custom code plugins for BuildRouter and wingbot.ai

**Kind**: global class  
{% raw %}<div id="Plugins_register">&nbsp;</div>{% endraw %}

### plugins.register(name, [factoryFn])
Register plugin

**Kind**: instance method of [<code>Plugins</code>](#Plugins)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> \| [<code>Plugins</code>](#Plugins) | plugin name or plugins object to include |
| [factoryFn] | <code>function</code> | plugin factory - optional when including plugin object |

{% raw %}<div id="ConfigStorage">&nbsp;</div>{% endraw %}

## ConfigStorage : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| invalidateConfig | <code>Object</code> | 
| getConfigTimestamp | <code>Object</code> | 
| updateConfig | <code>Object</code> | 
| getConfig | <code>Object</code> | 

