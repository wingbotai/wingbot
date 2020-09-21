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
    * [new BuildRouter(block, plugins, context, [fetchFn])](#new_BuildRouter_new)
    * _instance_
        * [.keepConfigFor](#BuildRouter_keepConfigFor)
        * [.loadBot()](#BuildRouter_loadBot) ⇒ <code>Promise.&lt;object&gt;</code>
    * _static_
        * [.fromData(blocks, [plugins], [context])](#BuildRouter_fromData)

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter()
Build bot from Wingbot configuration file or snapshot url

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter(block, plugins, context, [fetchFn])
Create new router from configuration


| Param | Type | Description |
| --- | --- | --- |
| block | <code>object</code> |  |
| [block.botId] | <code>string</code> | the ID of bot |
| [block.snapshot] | <code>string</code> | snapshot stage of bot |
| [block.token] | <code>string</code> \| <code>Promise.&lt;string&gt;</code> | authorization token for bot |
| [block.url] | <code>string</code> | specify alternative configuration resource |
| plugins | [<code>Plugins</code>](#Plugins) | custom code blocks resource |
| context | <code>object</code> | the building context |
| [context.linksTranslator] | <code>object</code> | function, that translates links globally |
| [context.configStorage] | [<code>ConfigStorage</code>](#ConfigStorage) | function, that translates links globally |
| [context.allowForbiddenSnippetWords] | <code>boolean</code> | disable security rule |
| [fetchFn] | <code>fetch</code> | override a request function |

**Example**  
```js
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

### BuildRouter.fromData(blocks, [plugins], [context])
**Kind**: static method of [<code>BuildRouter</code>](#BuildRouter)  

| Param | Type | Description |
| --- | --- | --- |
| blocks | <code>Array.&lt;object&gt;</code> | blocks list |
| [plugins] | [<code>Plugins</code>](#Plugins) |  |
| [context] | <code>object</code> |  |

{% raw %}<div id="BuildRouter">&nbsp;</div>{% endraw %}

## BuildRouter
**Kind**: global class  

* [BuildRouter](#BuildRouter)
    * [new BuildRouter()](#new_BuildRouter_new)
    * [new BuildRouter(block, plugins, context, [fetchFn])](#new_BuildRouter_new)
    * _instance_
        * [.keepConfigFor](#BuildRouter_keepConfigFor)
        * [.loadBot()](#BuildRouter_loadBot) ⇒ <code>Promise.&lt;object&gt;</code>
    * _static_
        * [.fromData(blocks, [plugins], [context])](#BuildRouter_fromData)

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter()
Build bot from Wingbot configuration file or snapshot url

{% raw %}<div id="new_BuildRouter_new">&nbsp;</div>{% endraw %}

### new BuildRouter(block, plugins, context, [fetchFn])
Create new router from configuration


| Param | Type | Description |
| --- | --- | --- |
| block | <code>object</code> |  |
| [block.botId] | <code>string</code> | the ID of bot |
| [block.snapshot] | <code>string</code> | snapshot stage of bot |
| [block.token] | <code>string</code> \| <code>Promise.&lt;string&gt;</code> | authorization token for bot |
| [block.url] | <code>string</code> | specify alternative configuration resource |
| plugins | [<code>Plugins</code>](#Plugins) | custom code blocks resource |
| context | <code>object</code> | the building context |
| [context.linksTranslator] | <code>object</code> | function, that translates links globally |
| [context.configStorage] | [<code>ConfigStorage</code>](#ConfigStorage) | function, that translates links globally |
| [context.allowForbiddenSnippetWords] | <code>boolean</code> | disable security rule |
| [fetchFn] | <code>fetch</code> | override a request function |

**Example**  
```js
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

### BuildRouter.fromData(blocks, [plugins], [context])
**Kind**: static method of [<code>BuildRouter</code>](#BuildRouter)  

| Param | Type | Description |
| --- | --- | --- |
| blocks | <code>Array.&lt;object&gt;</code> | blocks list |
| [plugins] | [<code>Plugins</code>](#Plugins) |  |
| [context] | <code>object</code> |  |

{% raw %}<div id="Plugins">&nbsp;</div>{% endraw %}

## Plugins
Custom code plugins for BuildRouter and wingbot.ai

**Kind**: global class  

* [Plugins](#Plugins)
    * [.getWrappedPlugin(name, [paramsData], [items], [context])](#Plugins_getWrappedPlugin)
    * [.register(name, [plugin])](#Plugins_register)
    * [.registerFactory(name, pluginFactory)](#Plugins_registerFactory)

{% raw %}<div id="Plugins_getWrappedPlugin">&nbsp;</div>{% endraw %}

### plugins.getWrappedPlugin(name, [paramsData], [items], [context])
Get plugin for the router

**Kind**: instance method of [<code>Plugins</code>](#Plugins)  

| Param | Type |
| --- | --- |
| name | <code>string</code> | 
| [paramsData] | <code>object</code> | 
| [items] | <code>Map.&lt;string, Array.&lt;function()&gt;&gt;</code> | 
| [context] | <code>object</code> | 
| [context.isLastIndex] | <code>boolean</code> | 
| [context.router] | <code>Router</code> | 

**Example**  
```js
const { Router } = require('wingbot');

const bot = new Router();

// simply
bot.use('simple-route', plugins.getWrappedPlugin('myCoolPLugin'));

// fully
bot.use('full-plugin-route', plugins
 .getWrappedPlugin(
    'fancyPLugin',
    { param: 123 },
    new Map([
      ['onSuccess', [(req, res) => { res.text('yes, success'); }]]
    ])
));
```
{% raw %}<div id="Plugins_register">&nbsp;</div>{% endraw %}

### plugins.register(name, [plugin])
Register plugin

**Kind**: instance method of [<code>Plugins</code>](#Plugins)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> \| [<code>Plugins</code>](#Plugins) | plugin name or plugins object to include |
| [plugin] | [<code>Plugin</code>](#Plugin) \| <code>Router</code> | plugin - optional when including plugin object |

{% raw %}<div id="Plugins_registerFactory">&nbsp;</div>{% endraw %}

### plugins.registerFactory(name, pluginFactory)
Register plugin factory

**Kind**: instance method of [<code>Plugins</code>](#Plugins)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | plugin name or plugins object to include |
| pluginFactory | <code>function</code> | function, which returns a plugin |

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

| Param | Type |
| --- | --- |
| req | <code>Request</code> | 
| res | <code>Responder</code> | 
| [postBack] | <code>function</code> | 
| [context] | <code>Object</code> | 
| [paramsData] | <code>object</code> | 

