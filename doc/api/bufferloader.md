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
<dt><a href="#textFilter">textFilter</a> ⇒ <code>string</code></dt>
<dd><p>Text filter function</p>
</dd>
</dl>

{% raw %}<div id="MemoryStateStorage">&nbsp;</div>{% endraw %}

## MemoryStateStorage
Memory conversation state storage for testing purposes

**Kind**: global class  

* [MemoryStateStorage](#MemoryStateStorage)
    * [.getState(senderId, pageId)](#MemoryStateStorage_getState) ⇒ <code>Promise.&lt;(State\|null)&gt;</code>
    * [.getOrCreateAndLock(senderId, pageId, defaultState, lockTimeout)](#MemoryStateStorage_getOrCreateAndLock) ⇒ [<code>Promise.&lt;State&gt;</code>](#State)
    * [.saveState(state)](#MemoryStateStorage_saveState) ⇒ <code>Promise</code>
    * [.getStates(condition, limit, lastKey)](#MemoryStateStorage_getStates) ⇒ <code>Promise.&lt;{Array.&lt;data:State&gt;, lastKey:string}&gt;</code>

{% raw %}<div id="MemoryStateStorage_getState">&nbsp;</div>{% endraw %}

### memoryStateStorage.getState(senderId, pageId) ⇒ <code>Promise.&lt;(State\|null)&gt;</code>
**Kind**: instance method of [<code>MemoryStateStorage</code>](#MemoryStateStorage)  
**Params**

- senderId <code>string</code>
- pageId <code>string</code>

{% raw %}<div id="MemoryStateStorage_getOrCreateAndLock">&nbsp;</div>{% endraw %}

### memoryStateStorage.getOrCreateAndLock(senderId, pageId, defaultState, lockTimeout) ⇒ [<code>Promise.&lt;State&gt;</code>](#State)
**Kind**: instance method of [<code>MemoryStateStorage</code>](#MemoryStateStorage)  
**Returns**: [<code>Promise.&lt;State&gt;</code>](#State) - - conversation state  
**Params**

- senderId <code>string</code> - sender identifier
- pageId <code>string</code> - page or channel identifier
- defaultState <code>object</code> - default state of the conversation
- lockTimeout <code>number</code> <code> = 300</code> - duration of lock

{% raw %}<div id="MemoryStateStorage_saveState">&nbsp;</div>{% endraw %}

### memoryStateStorage.saveState(state) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>MemoryStateStorage</code>](#MemoryStateStorage)  
**Params**

- state <code>object</code> - conversation state

{% raw %}<div id="MemoryStateStorage_getStates">&nbsp;</div>{% endraw %}

### memoryStateStorage.getStates(condition, limit, lastKey) ⇒ <code>Promise.&lt;{Array.&lt;data:State&gt;, lastKey:string}&gt;</code>
**Kind**: instance method of [<code>MemoryStateStorage</code>](#MemoryStateStorage)  
**Params**

- condition [<code>StateCondition</code>](#StateCondition)
- limit <code>number</code> <code> = 20</code>
- lastKey <code>string</code> <code> = null</code>

{% raw %}<div id="Translate">&nbsp;</div>{% endraw %}

## Translate
**Kind**: global class  

* [Translate](#Translate)
    * [new Translate()](#new_Translate_new)
    * [new Translate([options])](#new_Translate_new)
    * [.translator(languages)](#Translate_translator) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.middleware(languageResolver)](#Translate_middleware) ⇒ <code>function</code>

{% raw %}<div id="new_Translate_new">&nbsp;</div>{% endraw %}

### new Translate()
Tool for text translation

{% raw %}<div id="new_Translate_new">&nbsp;</div>{% endraw %}

### new Translate([options])
**Params**

- [options] <code>object</code>
    - [.sourcePath] <code>string</code> - optional source path of translation folder
    - [.fileSuffix] <code>string</code> - by default `.locale.po`

{% raw %}<div id="Translate_translator">&nbsp;</div>{% endraw %}

### translate.translator(languages) ⇒ <code>Promise.&lt;object&gt;</code>
Creates static translator for static settings

**Kind**: instance method of [<code>Translate</code>](#Translate)  
**Params**

- languages <code>Array.&lt;string&gt;</code> - list of required languages

**Example**  
```javascript
const { Translate } = require('wingbot');

const translate = new Translate({ sourcePath: __dirname });

const t = translate.translator(['cs', 'en']);

// czech
t.cs.t('requested text');

// english
t.en.t('requested text');
```
{% raw %}<div id="Translate_middleware">&nbsp;</div>{% endraw %}

### translate.middleware(languageResolver) ⇒ <code>function</code>
Bots middleware for text translations

- will be looking for `<lang>.locale.po` by default

**Kind**: instance method of [<code>Translate</code>](#Translate)  
**Params**

- languageResolver <code>function</code>

**Example**  
```javascript
const { Translate } = require('wingbot');

const translate = new Translate({ sourcePath: __dirname });

bot.use(translate.middleware((req, res) => 'cs'));

bot.use((req, res) => {
   res.text(res.t('Translated text'));
});
```
{% raw %}<div id="Translate">&nbsp;</div>{% endraw %}

## Translate
**Kind**: global class  

* [Translate](#Translate)
    * [new Translate()](#new_Translate_new)
    * [new Translate([options])](#new_Translate_new)
    * [.translator(languages)](#Translate_translator) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.middleware(languageResolver)](#Translate_middleware) ⇒ <code>function</code>

{% raw %}<div id="new_Translate_new">&nbsp;</div>{% endraw %}

### new Translate()
Tool for text translation

{% raw %}<div id="new_Translate_new">&nbsp;</div>{% endraw %}

### new Translate([options])
**Params**

- [options] <code>object</code>
    - [.sourcePath] <code>string</code> - optional source path of translation folder
    - [.fileSuffix] <code>string</code> - by default `.locale.po`

{% raw %}<div id="Translate_translator">&nbsp;</div>{% endraw %}

### translate.translator(languages) ⇒ <code>Promise.&lt;object&gt;</code>
Creates static translator for static settings

**Kind**: instance method of [<code>Translate</code>](#Translate)  
**Params**

- languages <code>Array.&lt;string&gt;</code> - list of required languages

**Example**  
```javascript
const { Translate } = require('wingbot');

const translate = new Translate({ sourcePath: __dirname });

const t = translate.translator(['cs', 'en']);

// czech
t.cs.t('requested text');

// english
t.en.t('requested text');
```
{% raw %}<div id="Translate_middleware">&nbsp;</div>{% endraw %}

### translate.middleware(languageResolver) ⇒ <code>function</code>
Bots middleware for text translations

- will be looking for `<lang>.locale.po` by default

**Kind**: instance method of [<code>Translate</code>](#Translate)  
**Params**

- languageResolver <code>function</code>

**Example**  
```javascript
const { Translate } = require('wingbot');

const translate = new Translate({ sourcePath: __dirname });

bot.use(translate.middleware((req, res) => 'cs'));

bot.use((req, res) => {
   res.text(res.t('Translated text'));
});
```
{% raw %}<div id="ReturnSender">&nbsp;</div>{% endraw %}

## ReturnSender
**Kind**: global class  

* [ReturnSender](#ReturnSender)
    * [new ReturnSender(options, userId, incommingMessage, logger)](#new_ReturnSender_new)
    * [.textFilter](#ReturnSender_textFilter) : [<code>textFilter</code>](#textFilter)
    * [.modifyStateAfterLoad()](#ReturnSender_modifyStateAfterLoad) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
    * [.modifyStateBeforeStore()](#ReturnSender_modifyStateBeforeStore) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>

{% raw %}<div id="new_ReturnSender_new">&nbsp;</div>{% endraw %}

### new ReturnSender(options, userId, incommingMessage, logger)
**Params**

- options <code>object</code>
    - [.textFilter] [<code>textFilter</code>](#textFilter) - filter for saving the texts
    - [.logStandbyEvents] <code>boolean</code> - log the standby events
    - [.confidentInputFilter] [<code>textFilter</code>](#textFilter) - filter for confident input (@CONFIDENT)
- userId <code>string</code>
- incommingMessage <code>object</code>
- logger <code>console</code> - console like logger

{% raw %}<div id="ReturnSender_textFilter">&nbsp;</div>{% endraw %}

### returnSender.textFilter : [<code>textFilter</code>](#textFilter)
Preprocess text for NLP
For example to remove any confidential data

**Kind**: instance property of [<code>ReturnSender</code>](#ReturnSender)  
**Params**

- text <code>string</code>

{% raw %}<div id="ReturnSender_modifyStateAfterLoad">&nbsp;</div>{% endraw %}

### returnSender.modifyStateAfterLoad() ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
**Kind**: instance method of [<code>ReturnSender</code>](#ReturnSender)  
{% raw %}<div id="ReturnSender_modifyStateBeforeStore">&nbsp;</div>{% endraw %}

### returnSender.modifyStateBeforeStore() ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
**Kind**: instance method of [<code>ReturnSender</code>](#ReturnSender)  
{% raw %}<div id="FLAG_DISAMBIGUATION_SELECTED">&nbsp;</div>{% endraw %}

## FLAG\_DISAMBIGUATION\_SELECTED
Disambiguation quick reply was selected

**Kind**: global constant  
{% raw %}<div id="FLAG_DISAMBIGUATION_OFFERED">&nbsp;</div>{% endraw %}

## FLAG\_DISAMBIGUATION\_OFFERED
Disambiguation occured - user was asked to choose the right meaning

**Kind**: global constant  
{% raw %}<div id="FLAG_DO_NOT_LOG">&nbsp;</div>{% endraw %}

## FLAG\_DO\_NOT\_LOG
Do not log the event

**Kind**: global constant  
{% raw %}<div id="bufferloader">&nbsp;</div>{% endraw %}

## bufferloader(url, [limit], [limitJustByBody], [redirCount]) ⇒ <code>Promise.&lt;Buffer&gt;</code>
Downloads a file from url into a buffer. Supports size limits and redirects.

**Kind**: global function  
**Params**

- url <code>string</code>
- [limit] <code>number</code> <code> = 0</code> - limit in bytes
- [limitJustByBody] <code>boolean</code> <code> = false</code> - when true, content size in header is ignored
- [redirCount] <code>number</code> <code> = 3</code> - maximmum amount of redirects

**Example**  
```javascript
router.use('*', (req, res, postBack) => {
    if (req.isFile()) {
        bufferloader(req.attachmentUrl())
            .then(buffer => postBack('downloaded', { data: buffer }))
            .catch(err => postBack('donwloaded', { err }))
    }
});
```
{% raw %}<div id="disambiguationQuickReply">&nbsp;</div>{% endraw %}

## disambiguationQuickReply(title, likelyIntent, disambText, action, data)
Create a disambiguation quick reply

**Kind**: global function  
**Params**

- title <code>string</code> - quick reply title
- likelyIntent <code>string</code> - possible intent
- disambText <code>string</code> - users text input
- action <code>string</code> - action to process the disambbiguation
- data <code>object</code> - optional data

{% raw %}<div id="State">&nbsp;</div>{% endraw %}

## State : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| state | <code>object</code> | 

{% raw %}<div id="StateCondition">&nbsp;</div>{% endraw %}

## StateCondition : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [search] | <code>string</code> | 

{% raw %}<div id="textFilter">&nbsp;</div>{% endraw %}

## textFilter ⇒ <code>string</code>
Text filter function

**Kind**: global typedef  
**Returns**: <code>string</code> - - filtered text  
**Params**

- text <code>string</code> - input text

