## Classes

<dl>
<dt><a href="#BotApp">BotApp</a></dt>
<dd><p>Adapter for Wingbot flight director</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Options">Options</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#ApiResponse">ApiResponse</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#AutoTypingConfig">AutoTypingConfig</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Plugin">Plugin</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#ProcessorOptions">ProcessorOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#IntentAction">IntentAction</a> : <code>object</code></dt>
<dd></dd>
</dl>

{% raw %}<div id="BotApp">&nbsp;</div>{% endraw %}

## BotApp
Adapter for Wingbot flight director

**Kind**: global class  

* [BotApp](#BotApp)
    * [new BotApp(bot, options)](#new_BotApp_new)
    * [.processor](#BotApp_processor) ⇒ <code>Processor</code>
    * [.request(rawBody, rawHeaders)](#BotApp_request) ⇒ [<code>Promise.&lt;ApiResponse&gt;</code>](#ApiResponse)

{% raw %}<div id="new_BotApp_new">&nbsp;</div>{% endraw %}

### new BotApp(bot, options)

| Param | Type |
| --- | --- |
| bot | <code>ReducerWrapper</code> \| <code>Router</code> | 
| options | [<code>Options</code>](#Options) | 

{% raw %}<div id="BotApp_processor">&nbsp;</div>{% endraw %}

### botApp.processor ⇒ <code>Processor</code>
Get the processor instance

**Kind**: instance property of [<code>BotApp</code>](#BotApp)  
{% raw %}<div id="BotApp_request">&nbsp;</div>{% endraw %}

### botApp.request(rawBody, rawHeaders) ⇒ [<code>Promise.&lt;ApiResponse&gt;</code>](#ApiResponse)
Process incomming API request from the orchestrator.

The response can be sent using an express, or you can directly return the response to

**Kind**: instance method of [<code>BotApp</code>](#BotApp)  

| Param | Type |
| --- | --- |
| rawBody | <code>string</code> \| <code>null</code> | 
| rawHeaders | <code>object</code> | 

**Example**  
```js
const express = require('express');
const { Router, BotApp } = require('express');
const app = express();

const bot = new Router();

bot.use((req, res) => { res.text('hello!'); });

const botApp = new BotApp(bot, {
    apiUrl: 'https://<url to orchestrator>',
    secret: '<application secret in orchestrator>'
});

app.get('/bot', express.text(), (req, res) => {
   botApp.request(req.body, req.headers)
       .then((response) => {
           const { body, statusCode, headers } = response;

           res.status(statusCode)
               .set(headers)
               .send(body);
       })
});
```
{% raw %}<div id="Options">&nbsp;</div>{% endraw %}

## Options : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| secret | <code>string</code> \| <code>Promise.&lt;string&gt;</code> | 
| [apiUrl] | <code>string</code> | 
| [fetch] | <code>function</code> | 
| [chatLogStorage] | <code>ChatLogStorage</code> | 

{% raw %}<div id="ApiResponse">&nbsp;</div>{% endraw %}

## ApiResponse : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| statusCode | <code>number</code> | 
| body | <code>string</code> | 
| headers | <code>object</code> | 

{% raw %}<div id="AutoTypingConfig">&nbsp;</div>{% endraw %}

## AutoTypingConfig : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| time | <code>number</code> | duration |
| perCharacters | <code>number</code> | number of characters |
| minTime | <code>number</code> | minimum writing time |
| maxTime | <code>number</code> | maximum writing time |

{% raw %}<div id="Plugin">&nbsp;</div>{% endraw %}

## Plugin : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [processMessage] | <code>function</code> | 
| [beforeAiPreload] | <code>function</code> | 
| [beforeProcessMessage] | <code>function</code> | 
| [afterProcessMessage] | <code>function</code> | 

{% raw %}<div id="ProcessorOptions">&nbsp;</div>{% endraw %}

## ProcessorOptions : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [appUrl] | <code>string</code> | url basepath for relative links |
| [stateStorage] | <code>object</code> | chatbot state storage |
| [tokenStorage] | <code>object</code> | frontend token storage |
| [translator] | <code>function</code> | text translate function |
| [timeout] | <code>number</code> | chat sesstion lock duration (30000) |
| [justUpdateTimeout] | <code>number</code> | simple read and write lock (1000) |
| [waitForLockedState] | <code>number</code> | wait when state is locked (12000) |
| [retriesWhenWaiting] | <code>number</code> | number of attampts (6) |
| [nameFromState] | <code>function</code> | override the name translator |
| [autoTyping] | <code>boolean</code> \| [<code>AutoTypingConfig</code>](#AutoTypingConfig) | enable or disable automatic typing |
| [log] | <code>function</code> | console like error logger |
| [defaultState] | <code>object</code> | default chat state |
| [autoSeen] | <code>boolean</code> | send seen automatically |
| [waitsForSender] | <code>boolean</code> | use 'false' resolve the processing promise  without waiting for message sender |
| [redirectLimit] | <code>number</code> | maximum number of redirects at single request |

{% raw %}<div id="IntentAction">&nbsp;</div>{% endraw %}

## IntentAction : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| action | <code>string</code> | 
| intent | <code>Intent</code> | 
| sort | <code>number</code> | 
| [score] | <code>number</code> | 
| local | <code>boolean</code> | 
| aboveConfidence | <code>boolean</code> | 
| [winner] | <code>boolean</code> | 
| meta | <code>object</code> | 
| title | <code>string</code> | 
| [meta.targetAppId] | <code>string</code> | 
| [meta.targetAction] | <code>string</code> \| <code>null</code> | 

