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
<dt><a href="#ConfigStorage">ConfigStorage</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Plugin">Plugin</a> : <code>function</code></dt>
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
        * [.loadBot()](#BuildRouter_loadBot) ⇒ <code>Promise.&lt;object&gt;</code>
    * _static_
        * [.fromData(blocks, plugins, [context])](#BuildRouter_fromData)

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter()
Build bot from Wingbot configuration file or snapshot url

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter(block, plugins, context, [request])
Create new router from configuration

**Params**

- block <code>object</code>
    - [.botId] <code>string</code> - the ID of bot
    - [.snapshot] <code>string</code> - snapshot stage of bot
    - [.token] <code>string</code> | <code>Promise.&lt;string&gt;</code> - authorization token for bot
    - [.url] <code>string</code> - specify alternative configuration resource
- plugins [<code>Plugins</code>](#Plugins) - custom code blocks resource
- context <code>object</code> - the building context
    - [.linksTranslator] <code>object</code> - function, that translates links globally
    - [.configStorage] [<code>ConfigStorage</code>](#ConfigStorage) - function, that translates links globally
    - [.allowForbiddenSnippetWords] <code>boolean</code> - disable security rule
- [request] <code>function</code> - the building context

**Example**  
```javascript
// usage of plugins

const { BuildRouter, Plugins } = require('wingbot');
const dynamoDb = require('./lib/dynamodb');
const config = require('./config');

const plugins = new Plugins();

plugins.register('exampleBlock', async (req, res, postBack) => {
    await res.run('responseBlockName');
});

const bot = new BuildRouter({
    botId: 'b7a71c27-c295-4ab0-b64e-6835b50a0db0',
    snapshot: 'master',
    token: 'adjsadlkadjj92n9u9'
}, plugins);

module.exports = bot;
```
{% raw %}<div id="BuildRouter_keepConfigFor">&nbsp;</div>{% endraw %}

### buildRouter.keepConfigFor
Timeout, when the router is not checking for new configuration

**Kind**: instance property of [<code>BuildRouter</code>](#BuildRouter)  
**Properties**

| Type |
| --- |
| <code>number</code> | 

{% raw %}<div id="BuildRouter_loadBot">&nbsp;</div>{% endraw %}

### buildRouter.loadBot() ⇒ <code>Promise.&lt;object&gt;</code>
Loads conversation configuration

**Kind**: instance method of [<code>BuildRouter</code>](#BuildRouter)  
{% raw %}<div id="BuildRouter_fromData">&nbsp;</div>{% endraw %}

### BuildRouter.fromData(blocks, plugins, [context])
**Kind**: static method of [<code>BuildRouter</code>](#BuildRouter)  
**Params**

- blocks <code>Array.&lt;object&gt;</code> - blocks list
- plugins [<code>Plugins</code>](#Plugins)
- [context] <code>object</code>

{% raw %}<div id="BuildRouter">&nbsp;</div>{% endraw %}

## BuildRouter
**Kind**: global class  

* [BuildRouter](#BuildRouter)
    * [new BuildRouter()](#new_BuildRouter_new)
    * [new BuildRouter(block, plugins, context, [request])](#new_BuildRouter_new)
    * _instance_
        * [.keepConfigFor](#BuildRouter_keepConfigFor)
        * [.loadBot()](#BuildRouter_loadBot) ⇒ <code>Promise.&lt;object&gt;</code>
    * _static_
        * [.fromData(blocks, plugins, [context])](#BuildRouter_fromData)

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter()
Build bot from Wingbot configuration file or snapshot url

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter(block, plugins, context, [request])
Create new router from configuration

**Params**

- block <code>object</code>
    - [.botId] <code>string</code> - the ID of bot
    - [.snapshot] <code>string</code> - snapshot stage of bot
    - [.token] <code>string</code> | <code>Promise.&lt;string&gt;</code> - authorization token for bot
    - [.url] <code>string</code> - specify alternative configuration resource
- plugins [<code>Plugins</code>](#Plugins) - custom code blocks resource
- context <code>object</code> - the building context
    - [.linksTranslator] <code>object</code> - function, that translates links globally
    - [.configStorage] [<code>ConfigStorage</code>](#ConfigStorage) - function, that translates links globally
    - [.allowForbiddenSnippetWords] <code>boolean</code> - disable security rule
- [request] <code>function</code> - the building context

**Example**  
```javascript
// usage of plugins

const { BuildRouter, Plugins } = require('wingbot');
const dynamoDb = require('./lib/dynamodb');
const config = require('./config');

const plugins = new Plugins();

plugins.register('exampleBlock', async (req, res, postBack) => {
    await res.run('responseBlockName');
});

const bot = new BuildRouter({
    botId: 'b7a71c27-c295-4ab0-b64e-6835b50a0db0',
    snapshot: 'master',
    token: 'adjsadlkadjj92n9u9'
}, plugins);

module.exports = bot;
```
{% raw %}<div id="BuildRouter_keepConfigFor">&nbsp;</div>{% endraw %}

### buildRouter.keepConfigFor
Timeout, when the router is not checking for new configuration

**Kind**: instance property of [<code>BuildRouter</code>](#BuildRouter)  
**Properties**

| Type |
| --- |
| <code>number</code> | 

{% raw %}<div id="BuildRouter_loadBot">&nbsp;</div>{% endraw %}

### buildRouter.loadBot() ⇒ <code>Promise.&lt;object&gt;</code>
Loads conversation configuration

**Kind**: instance method of [<code>BuildRouter</code>](#BuildRouter)  
{% raw %}<div id="BuildRouter_fromData">&nbsp;</div>{% endraw %}

### BuildRouter.fromData(blocks, plugins, [context])
**Kind**: static method of [<code>BuildRouter</code>](#BuildRouter)  
**Params**

- blocks <code>Array.&lt;object&gt;</code> - blocks list
- plugins [<code>Plugins</code>](#Plugins)
- [context] <code>object</code>

{% raw %}<div id="Plugins">&nbsp;</div>{% endraw %}

## Plugins
Custom code plugins for BuildRouter and wingbot.ai

**Kind**: global class  

* [Plugins](#Plugins)
    * [.register(name, [plugin])](#Plugins_register)
    * [.registerFactory(name, pluginFactory)](#Plugins_registerFactory)

{% raw %}<div id="Plugins_register">&nbsp;</div>{% endraw %}

### plugins.register(name, [plugin])
Register plugin

**Kind**: instance method of [<code>Plugins</code>](#Plugins)  
**Params**

- name <code>string</code> | [<code>Plugins</code>](#Plugins) - plugin name or plugins object to include
- [plugin] [<code>Plugin</code>](#Plugin) | <code>Router</code> - plugin - optional when including plugin object

{% raw %}<div id="Plugins_registerFactory">&nbsp;</div>{% endraw %}

### plugins.registerFactory(name, pluginFactory)
Register plugin factory

**Kind**: instance method of [<code>Plugins</code>](#Plugins)  
**Params**

- name <code>string</code> - plugin name or plugins object to include
- pluginFactory <code>function</code> - function, which returns a plugin

{% raw %}<div id="ConfigStorage">&nbsp;</div>{% endraw %}

## ConfigStorage : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| invalidateConfig | <code>Object</code> | 
| getConfigTimestamp | <code>Object</code> | 
| updateConfig | <code>Object</code> | 
| getConfig | <code>Object</code> | 

{% raw %}<div id="Plugin">&nbsp;</div>{% endraw %}

## Plugin : <code>function</code>
**Kind**: global typedef  
**Params**

- req <code>Request</code>
- res <code>Responder</code>
- [postBack] <code>function</code>
- [context] <code>Object</code>
- [paramsData] <code>object</code>

