## Classes

<dl>
<dt><a href="#MemoryStateStorage">MemoryStateStorage</a></dt>
<dd><p>Memory conversation state storage for testing purposes</p>
</dd>
<dt><a href="#Translate">Translate</a></dt>
<dd></dd>
<dt><a href="#Translate">Translate</a></dt>
<dd></dd>
<dt><a href="#ReturnSender">ReturnSender</a></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#FLAG_DISAMBIGUATION_SELECTED">FLAG_DISAMBIGUATION_SELECTED</a></dt>
<dd><p>Disambiguation quick reply was selected</p>
</dd>
<dt><a href="#FLAG_DISAMBIGUATION_OFFERED">FLAG_DISAMBIGUATION_OFFERED</a></dt>
<dd><p>Disambiguation occured - user was asked to choose the right meaning</p>
</dd>
<dt><a href="#FLAG_DO_NOT_LOG">FLAG_DO_NOT_LOG</a></dt>
<dd><p>Do not log the event</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#bufferloader">bufferloader(url, [limit], [limitJustByBody], [redirCount])</a> ⇒ <code>Promise.&lt;Buffer&gt;</code></dt>
<dd><p>Downloads a file from url into a buffer. Supports size limits and redirects.</p>
</dd>
<dt><a href="#compileWithState">compileWithState(req, res, template)</a></dt>
<dd><p>Utility, which helps to render handlebars syntax with all variables within conversations state</p>
</dd>
<dt><a href="#disambiguationQuickReply">disambiguationQuickReply(title, likelyIntent, disambText, action, data)</a></dt>
<dd><p>Create a disambiguation quick reply</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#State">State</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#StateCondition">StateCondition</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#ChatLogStorage">ChatLogStorage</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#ReturnSenderOptions">ReturnSenderOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#textFilter">textFilter</a> ⇒ <code>string</code></dt>
<dd><p>Text filter function</p>
</dd>
</dl>

<div id="MemoryStateStorage">&nbsp;</div>

## MemoryStateStorage
Memory conversation state storage for testing purposes

**Kind**: global class  

* [MemoryStateStorage](#MemoryStateStorage)
    * [.getState(senderId, pageId)](#MemoryStateStorage_getState) ⇒ <code>Promise.&lt;(State\|null)&gt;</code>
    * [.getOrCreateAndLock(senderId, pageId, defaultState, lockTimeout)](#MemoryStateStorage_getOrCreateAndLock) ⇒ [<code>Promise.&lt;State&gt;</code>](#State)
    * [.saveState(state)](#MemoryStateStorage_saveState) ⇒ <code>Promise</code>
    * [.getStates(condition, limit, lastKey)](#MemoryStateStorage_getStates) ⇒ <code>Promise.&lt;{Array.&lt;data:State&gt;, lastKey:string}&gt;</code>

<div id="MemoryStateStorage_getState">&nbsp;</div>

### memoryStateStorage.getState(senderId, pageId) ⇒ <code>Promise.&lt;(State\|null)&gt;</code>
**Kind**: instance method of [<code>MemoryStateStorage</code>](#MemoryStateStorage)  

| Param | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 

<div id="MemoryStateStorage_getOrCreateAndLock">&nbsp;</div>

### memoryStateStorage.getOrCreateAndLock(senderId, pageId, defaultState, lockTimeout) ⇒ [<code>Promise.&lt;State&gt;</code>](#State)
**Kind**: instance method of [<code>MemoryStateStorage</code>](#MemoryStateStorage)  
**Returns**: [<code>Promise.&lt;State&gt;</code>](#State) - - conversation state  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| senderId | <code>string</code> |  | sender identifier |
| pageId | <code>string</code> |  | page or channel identifier |
| defaultState | <code>object</code> |  | default state of the conversation |
| lockTimeout | <code>number</code> | <code>300</code> | duration of lock |

<div id="MemoryStateStorage_saveState">&nbsp;</div>

### memoryStateStorage.saveState(state) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>MemoryStateStorage</code>](#MemoryStateStorage)  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>object</code> | conversation state |

<div id="MemoryStateStorage_getStates">&nbsp;</div>

### memoryStateStorage.getStates(condition, limit, lastKey) ⇒ <code>Promise.&lt;{Array.&lt;data:State&gt;, lastKey:string}&gt;</code>
**Kind**: instance method of [<code>MemoryStateStorage</code>](#MemoryStateStorage)  

| Param | Type | Default |
| --- | --- | --- |
| condition | [<code>StateCondition</code>](#StateCondition) |  | 
| limit | <code>number</code> | <code>20</code> | 
| lastKey | <code>string</code> | <code>null</code> | 

<div id="Translate">&nbsp;</div>

## Translate
**Kind**: global class  

* [Translate](#Translate)
    * [new Translate()](#new_Translate_new)
    * [new Translate([options])](#new_Translate_new)
    * [.translator(languages)](#Translate_translator) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.middleware(languageResolver)](#Translate_middleware) ⇒ <code>function</code>

<div id="new_Translate_new">&nbsp;</div>

### new Translate()
Tool for text translation

<div id="new_Translate_new">&nbsp;</div>

### new Translate([options])

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> |  |
| [options.sourcePath] | <code>string</code> | optional source path of translation folder |
| [options.fileSuffix] | <code>string</code> | by default `.locale.po` |

<div id="Translate_translator">&nbsp;</div>

### translate.translator(languages) ⇒ <code>Promise.&lt;object&gt;</code>
Creates static translator for static settings

**Kind**: instance method of [<code>Translate</code>](#Translate)  

| Param | Type | Description |
| --- | --- | --- |
| languages | <code>Array.&lt;string&gt;</code> | list of required languages |

**Example**  
```js
const { Translate } = require('wingbot');

const translate = new Translate({ sourcePath: __dirname });

const t = translate.translator(['cs', 'en']);

// czech
t.cs.t('requested text');

// english
t.en.t('requested text');
```
<div id="Translate_middleware">&nbsp;</div>

### translate.middleware(languageResolver) ⇒ <code>function</code>
Bots middleware for text translations

- will be looking for `<lang>.locale.po` by default

**Kind**: instance method of [<code>Translate</code>](#Translate)  

| Param | Type |
| --- | --- |
| languageResolver | <code>function</code> | 

**Example**  
```js
const { Translate } = require('wingbot');

const translate = new Translate({ sourcePath: __dirname });

bot.use(translate.middleware((req, res) => 'cs'));

bot.use((req, res) => {
   res.text(res.t('Translated text'));
});
```
<div id="Translate">&nbsp;</div>

## Translate
**Kind**: global class  

* [Translate](#Translate)
    * [new Translate()](#new_Translate_new)
    * [new Translate([options])](#new_Translate_new)
    * [.translator(languages)](#Translate_translator) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.middleware(languageResolver)](#Translate_middleware) ⇒ <code>function</code>

<div id="new_Translate_new">&nbsp;</div>

### new Translate()
Tool for text translation

<div id="new_Translate_new">&nbsp;</div>

### new Translate([options])

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> |  |
| [options.sourcePath] | <code>string</code> | optional source path of translation folder |
| [options.fileSuffix] | <code>string</code> | by default `.locale.po` |

<div id="Translate_translator">&nbsp;</div>

### translate.translator(languages) ⇒ <code>Promise.&lt;object&gt;</code>
Creates static translator for static settings

**Kind**: instance method of [<code>Translate</code>](#Translate)  

| Param | Type | Description |
| --- | --- | --- |
| languages | <code>Array.&lt;string&gt;</code> | list of required languages |

**Example**  
```js
const { Translate } = require('wingbot');

const translate = new Translate({ sourcePath: __dirname });

const t = translate.translator(['cs', 'en']);

// czech
t.cs.t('requested text');

// english
t.en.t('requested text');
```
<div id="Translate_middleware">&nbsp;</div>

### translate.middleware(languageResolver) ⇒ <code>function</code>
Bots middleware for text translations

- will be looking for `<lang>.locale.po` by default

**Kind**: instance method of [<code>Translate</code>](#Translate)  

| Param | Type |
| --- | --- |
| languageResolver | <code>function</code> | 

**Example**  
```js
const { Translate } = require('wingbot');

const translate = new Translate({ sourcePath: __dirname });

bot.use(translate.middleware((req, res) => 'cs'));

bot.use((req, res) => {
   res.text(res.t('Translated text'));
});
```
<div id="ReturnSender">&nbsp;</div>

## ReturnSender
**Kind**: global class  

* [ReturnSender](#ReturnSender)
    * [new ReturnSender(options, userId, incommingMessage, logger)](#new_ReturnSender_new)
    * [.responses](#ReturnSender_responses) : <code>Array.&lt;object&gt;</code>
    * [.waits](#ReturnSender_waits) : <code>boolean</code>
    * [.textFilter](#ReturnSender_textFilter) : [<code>textFilter</code>](#textFilter)
    * [.modifyStateAfterLoad()](#ReturnSender_modifyStateAfterLoad) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
    * [.modifyStateBeforeStore()](#ReturnSender_modifyStateBeforeStore) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>

<div id="new_ReturnSender_new">&nbsp;</div>

### new ReturnSender(options, userId, incommingMessage, logger)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | [<code>ReturnSenderOptions</code>](#ReturnSenderOptions) |  |  |
| userId | <code>string</code> |  |  |
| incommingMessage | <code>object</code> |  |  |
| logger | [<code>ChatLogStorage</code>](#ChatLogStorage) | <code></code> | console like logger |

<div id="ReturnSender_responses">&nbsp;</div>

### returnSender.responses : <code>Array.&lt;object&gt;</code>
**Kind**: instance property of [<code>ReturnSender</code>](#ReturnSender)  
<div id="ReturnSender_waits">&nbsp;</div>

### returnSender.waits : <code>boolean</code>
**Kind**: instance property of [<code>ReturnSender</code>](#ReturnSender)  
<div id="ReturnSender_textFilter">&nbsp;</div>

### returnSender.textFilter : [<code>textFilter</code>](#textFilter)
Preprocess text for NLP
For example to remove any confidential data

**Kind**: instance property of [<code>ReturnSender</code>](#ReturnSender)  

| Param | Type |
| --- | --- |
| text | <code>string</code> | 

<div id="ReturnSender_modifyStateAfterLoad">&nbsp;</div>

### returnSender.modifyStateAfterLoad() ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
**Kind**: instance method of [<code>ReturnSender</code>](#ReturnSender)  
<div id="ReturnSender_modifyStateBeforeStore">&nbsp;</div>

### returnSender.modifyStateBeforeStore() ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
**Kind**: instance method of [<code>ReturnSender</code>](#ReturnSender)  
<div id="FLAG_DISAMBIGUATION_SELECTED">&nbsp;</div>

## FLAG\_DISAMBIGUATION\_SELECTED
Disambiguation quick reply was selected

**Kind**: global constant  
<div id="FLAG_DISAMBIGUATION_OFFERED">&nbsp;</div>

## FLAG\_DISAMBIGUATION\_OFFERED
Disambiguation occured - user was asked to choose the right meaning

**Kind**: global constant  
<div id="FLAG_DO_NOT_LOG">&nbsp;</div>

## FLAG\_DO\_NOT\_LOG
Do not log the event

**Kind**: global constant  
<div id="bufferloader">&nbsp;</div>

## bufferloader(url, [limit], [limitJustByBody], [redirCount]) ⇒ <code>Promise.&lt;Buffer&gt;</code>
Downloads a file from url into a buffer. Supports size limits and redirects.

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>string</code> |  |  |
| [limit] | <code>number</code> | <code>0</code> | limit in bytes |
| [limitJustByBody] | <code>boolean</code> | <code>false</code> | when true, content size in header is ignored |
| [redirCount] | <code>number</code> | <code>3</code> | maximmum amount of redirects |

**Example**  
```js
router.use('*', (req, res, postBack) => {
    if (req.isFile()) {
        bufferloader(req.attachmentUrl())
            .then(buffer => postBack('downloaded', { data: buffer }))
            .catch(err => postBack('donwloaded', { err }))
    }
});
```
<div id="compileWithState">&nbsp;</div>

## compileWithState(req, res, template)
Utility, which helps to render handlebars syntax with all variables within conversations state

**Kind**: global function  

| Param | Type |
| --- | --- |
| req | <code>Request</code> | 
| res | <code>Responder</code> | 
| template | <code>string</code> | 

**Example**  
```js
const { compileWithState } = require('wingbot');

function myPluginFactory (params) {

    return (req, res) => {
        const text = compileWithState(req, res, params.text);
        res.text(text);
    };
}
```
<div id="disambiguationQuickReply">&nbsp;</div>

## disambiguationQuickReply(title, likelyIntent, disambText, action, data)
Create a disambiguation quick reply

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| title | <code>string</code> | quick reply title |
| likelyIntent | <code>string</code> | possible intent |
| disambText | <code>string</code> | users text input |
| action | <code>string</code> | action to process the disambbiguation |
| data | <code>object</code> | optional data |

<div id="State">&nbsp;</div>

## State : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| state | <code>object</code> | 

<div id="StateCondition">&nbsp;</div>

## StateCondition : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [search] | <code>string</code> | 

<div id="ChatLogStorage">&nbsp;</div>

## ChatLogStorage : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| log | <code>function</code> | 
| error | <code>function</code> | 

<div id="ReturnSenderOptions">&nbsp;</div>

## ReturnSenderOptions : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [textFilter] | [<code>textFilter</code>](#textFilter) | filter for saving the texts |
| [logStandbyEvents] | <code>boolean</code> | log the standby events |
| [confidentInputFilter] | [<code>textFilter</code>](#textFilter) | filter for confident input (@CONFIDENT) |

<div id="textFilter">&nbsp;</div>

## textFilter ⇒ <code>string</code>
Text filter function

**Kind**: global typedef  
**Returns**: <code>string</code> - - filtered text  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | input text |

