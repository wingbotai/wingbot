## Classes

<dl>
<dt><a href="#BotApp">BotApp</a></dt>
<dd><p>Adapter for Wingbot flight director</p>
</dd>
<dt><a href="#Processor">Processor</a></dt>
<dd><p>Messaging event processor</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#afterProcessMessage">afterProcessMessage(req, res)</a></dt>
<dd></dd>
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
<dt><a href="#TrackingEvent">TrackingEvent</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#TrackingObject">TrackingObject</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#InteractionEvent">InteractionEvent</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#ProcessorOptions">ProcessorOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#IntentAction">IntentAction</a> : <code>object</code></dt>
<dd></dd>
</dl>

<div id="BotApp">&nbsp;</div>

## BotApp
Adapter for Wingbot flight director

**Kind**: global class  

* [BotApp](#BotApp)
    * [new BotApp(bot, options)](#new_BotApp_new)
    * _instance_
        * [.processor](#BotApp_processor) ⇒ [<code>Processor</code>](#Processor)
        * [._processSenderResponses(sender, senderId, pageId, headers)](#BotApp__processSenderResponses)
        * ~~[.processMessage(message, senderId, pageId, data)](#BotApp_processMessage) ⇒ <code>Promise.&lt;{status:number}&gt;</code>~~
        * [.request(rawBody, rawHeaders)](#BotApp_request) ⇒ [<code>Promise.&lt;ApiResponse&gt;</code>](#ApiResponse)
    * _static_
        * [.signBody(body, secret, appId)](#BotApp_signBody) ⇒ <code>Promise.&lt;string&gt;</code>
        * [.plugin()](#BotApp_plugin) ⇒ [<code>Plugin</code>](#Plugin)

<div id="new_BotApp_new">&nbsp;</div>

### new BotApp(bot, options)

| Param | Type |
| --- | --- |
| bot | <code>ReducerWrapper</code> \| <code>Router</code> | 
| options | [<code>Options</code>](#Options) | 

<div id="BotApp_processor">&nbsp;</div>

### botApp.processor ⇒ [<code>Processor</code>](#Processor)
Get the processor instance

**Kind**: instance property of [<code>BotApp</code>](#BotApp)  
<div id="BotApp__processSenderResponses">&nbsp;</div>

### botApp.\_processSenderResponses(sender, senderId, pageId, headers)
**Kind**: instance method of [<code>BotApp</code>](#BotApp)  

| Param | Type |
| --- | --- |
| sender | <code>ReturnSender</code> | 
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| headers | <code>object</code> | 

<div id="BotApp_processMessage">&nbsp;</div>

### ~~botApp.processMessage(message, senderId, pageId, data) ⇒ <code>Promise.&lt;{status:number}&gt;</code>~~
***Deprecated***

Compatibility method for Notification engine

**Kind**: instance method of [<code>BotApp</code>](#BotApp)  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>object</code> | wingbot chat event |
| senderId | <code>string</code> | chat event sender identifier |
| pageId | <code>string</code> | channel/page identifier |
| data | <code>object</code> | contextual data (will be available in res.data) |
| [data.appId] | <code>string</code> | possibility to override appId |

<div id="BotApp_request">&nbsp;</div>

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
<div id="BotApp_signBody">&nbsp;</div>

### BotApp.signBody(body, secret, appId) ⇒ <code>Promise.&lt;string&gt;</code>
Get authorization token for wingbot orchestrator

**Kind**: static method of [<code>BotApp</code>](#BotApp)  

| Param | Type |
| --- | --- |
| body | <code>string</code> | 
| secret | <code>string</code> | 
| appId | <code>string</code> | 

<div id="BotApp_plugin">&nbsp;</div>

### BotApp.plugin() ⇒ [<code>Plugin</code>](#Plugin)
Returns processor plugin, which updates thread context automatically

**Kind**: static method of [<code>BotApp</code>](#BotApp)  
<div id="afterProcessMessage">&nbsp;</div>

## afterProcessMessage(req, res)
**Kind**: global function  

| Param | Type |
| --- | --- |
| req | <code>Request</code> | 
| res | <code>Responder</code> | 

<div id="Options">&nbsp;</div>

## Options : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| secret | <code>string</code> \| <code>Promise.&lt;string&gt;</code> |  |
| [appId] | <code>string</code> | for notifications |
| [apiUrl] | <code>string</code> |  |
| [fetch] | <code>function</code> |  |
| [chatLogStorage] | <code>ChatLogStorage</code> |  |
| [preferSynchronousResponse] | <code>boolean</code> |  |
| [auditLog] | <code>AuditLog</code> |  |
| [tls] | <code>TlsOptions</code> |  |

<div id="ApiResponse">&nbsp;</div>

## ApiResponse : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| statusCode | <code>number</code> | 
| body | <code>string</code> | 
| headers | <code>object</code> | 

<div id="AutoTypingConfig">&nbsp;</div>

## AutoTypingConfig : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| time | <code>number</code> | duration |
| perCharacters | <code>number</code> | number of characters |
| minTime | <code>number</code> | minimum writing time |
| maxTime | <code>number</code> | maximum writing time |

<div id="Plugin">&nbsp;</div>

## Plugin : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [processMessage] | <code>function</code> | 
| [beforeAiPreload] | <code>function</code> | 
| [beforeProcessMessage] | <code>function</code> | 
| [afterProcessMessage] | <code>function</code> | 

<div id="TrackingEvent">&nbsp;</div>

## TrackingEvent : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| type | <code>string</code> | 
| category | <code>string</code> | 
| action | <code>string</code> | 
| label | <code>string</code> | 
| value | <code>number</code> | 

<div id="TrackingObject">&nbsp;</div>

## TrackingObject : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| events | [<code>Array.&lt;TrackingEvent&gt;</code>](#TrackingEvent) | 

<div id="InteractionEvent">&nbsp;</div>

## InteractionEvent : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| req | <code>Request</code> | 
| actions | <code>Array.&lt;string&gt;</code> | 
| lastAction | <code>string</code> \| <code>null</code> | 
| state | <code>object</code> | 
| data | <code>object</code> | 
| skill | <code>string</code> \| <code>null</code> | 
| tracking | [<code>TrackingObject</code>](#TrackingObject) | 

<div id="ProcessorOptions">&nbsp;</div>

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
| [redirectLimit] | <code>number</code> | maximum number of redirects at single request |
| [secret] | <code>string</code> | Secret for calling orchestrator API |
| [apiUrl] | <code>string</code> | Url for calling orchestrator API |
| [fetch] | <code>function</code> | Fetch function for calling orchestrator API |

<div id="IntentAction">&nbsp;</div>

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

