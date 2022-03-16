## Classes

<dl>
<dt><a href="#Request">Request</a></dt>
<dd><p>Instance of {Request} class is passed as first parameter of handler (req)</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#FEATURE_VOICE">FEATURE_VOICE</a> : <code>string</code></dt>
<dd><p>channel supports voice messages</p>
</dd>
<dt><a href="#FEATURE_SSML">FEATURE_SSML</a> : <code>string</code></dt>
<dd><p>channel supports SSML voice messages</p>
</dd>
<dt><a href="#FEATURE_PHRASES">FEATURE_PHRASES</a> : <code>string</code></dt>
<dd><p>channel supports expected phrases messages</p>
</dd>
<dt><a href="#FEATURE_TEXT">FEATURE_TEXT</a> : <code>string</code></dt>
<dd><p>channel supports text communication</p>
</dd>
<dt><a href="#FEATURE_VOICE">FEATURE_VOICE</a> : <code>string</code></dt>
<dd><p>channel supports voice messages</p>
</dd>
<dt><a href="#FEATURE_SSML">FEATURE_SSML</a> : <code>string</code></dt>
<dd><p>channel supports SSML voice messages</p>
</dd>
<dt><a href="#FEATURE_PHRASES">FEATURE_PHRASES</a> : <code>string</code></dt>
<dd><p>channel supports expected phrases messages</p>
</dd>
<dt><a href="#FEATURE_TEXT">FEATURE_TEXT</a> : <code>string</code></dt>
<dd><p>channel supports text communication</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Entity">Entity</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Intent">Intent</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Action">Action</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#IntentAction">IntentAction</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#QuickReply">QuickReply</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#QuickReplyDisambiguation">QuickReplyDisambiguation</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#RequestOrchestratorOptions">RequestOrchestratorOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#TextAlternative">TextAlternative</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#AiSetStateOption">AiSetStateOption</a> : <code>number</code></dt>
<dd></dd>
</dl>

<div id="Request">&nbsp;</div>

## Request
Instance of {Request} class is passed as first parameter of handler (req)

**Kind**: global class  

* [Request](#Request)
    * [new Request(event, state, pageId, globalIntents, [orchestratorOptions])](#new_Request_new)
    * [.params](#Request_params)
    * [.timestamp](#Request_timestamp)
    * [.senderId](#Request_senderId)
    * [.recipientId](#Request_recipientId)
    * [.pageId](#Request_pageId)
    * [.state](#Request_state)
    * [.features](#Request_features)
    * [.subscribtions](#Request_subscribtions)
    * [.entities](#Request_entities)
    * [.intents](#Request_intents)
    * [._orchestratorClientOptions](#Request__orchestratorClientOptions) : <code>OrchestratorClientOptions</code>
    * [.event](#Request_event) : <code>object</code>
    * [.AI_SETSTATE](#Request_AI_SETSTATE) : <code>enum</code>
    * [.supportsFeature(feature)](#Request_supportsFeature) ⇒ <code>boolean</code>
    * [.isStandby()](#Request_isStandby) ⇒ <code>boolean</code>
    * [.aiActions([local])](#Request_aiActions) ⇒ [<code>Array.&lt;IntentAction&gt;</code>](#IntentAction)
    * [.aiActionsForQuickReplies([limit], [aiActions], [overrideAction])](#Request_aiActionsForQuickReplies) ⇒ [<code>Array.&lt;QuickReplyDisambiguation&gt;</code>](#QuickReplyDisambiguation)
    * [.hasAiActionsForDisambiguation(minimum, [local])](#Request_hasAiActionsForDisambiguation) ⇒ <code>boolean</code>
    * [.intent(getDataOrScore)](#Request_intent) ⇒ <code>null</code> \| <code>string</code> \| [<code>Intent</code>](#Intent)
    * [.entity(name, [sequence])](#Request_entity) ⇒ <code>number</code> \| <code>string</code> \| <code>null</code>
    * [.isAttachment()](#Request_isAttachment) ⇒ <code>boolean</code>
    * [.isSetContext(varsToCheck)](#Request_isSetContext)
    * [.getSetContext([includeContextSync])](#Request_getSetContext) ⇒ <code>object</code>
    * [.isImage([attachmentIndex], [includingStickers])](#Request_isImage) ⇒ <code>boolean</code>
    * [.isFile([attachmentIndex])](#Request_isFile) ⇒ <code>boolean</code>
    * [.hasLocation()](#Request_hasLocation) ⇒ <code>boolean</code>
    * [.getLocation()](#Request_getLocation) ⇒ <code>null</code> \| <code>Object</code>
    * [.attachment([attachmentIndex])](#Request_attachment) ⇒ <code>object</code> \| <code>null</code>
    * [.attachmentUrl([attachmentIndex])](#Request_attachmentUrl) ⇒ <code>string</code> \| <code>null</code>
    * [.isMessage()](#Request_isMessage) ⇒ <code>boolean</code>
    * [.isQuickReply()](#Request_isQuickReply) ⇒ <code>boolean</code>
    * [.isText()](#Request_isText) ⇒ <code>boolean</code>
    * [.isSticker([includeToTextStickers])](#Request_isSticker) ⇒ <code>boolean</code>
    * [.text([tokenized])](#Request_text) ⇒ <code>string</code>
    * [.textAlternatives()](#Request_textAlternatives) ⇒ [<code>Array.&lt;TextAlternative&gt;</code>](#TextAlternative)
    * [.expected()](#Request_expected) ⇒ [<code>Action</code>](#Action) \| <code>null</code>
    * [.expectedKeywords([justOnce])](#Request_expectedKeywords)
    * [.expectedContext([justOnce], [includeKeywords])](#Request_expectedContext) ⇒ <code>object</code>
    * [.quickReply([getData])](#Request_quickReply) ⇒ <code>null</code> \| <code>string</code> \| <code>object</code>
    * [.isPostBack()](#Request_isPostBack) ⇒ <code>boolean</code>
    * [.isReferral()](#Request_isReferral) ⇒ <code>boolean</code>
    * [.isOptin()](#Request_isOptin) ⇒ <code>boolean</code>
    * [.setAction(action, [data])](#Request_setAction) ⇒ [<code>Action</code>](#Action) \| <code>null</code> \| <code>undefined</code>
    * [.action([getData])](#Request_action) ⇒ <code>null</code> \| <code>string</code>
    * [.actionData()](#Request_actionData) ⇒ <code>object</code>
    * [.getSetState(keysFromAi)](#Request_getSetState) ⇒ <code>object</code>
    * [.isConfidentInput()](#Request_isConfidentInput) ⇒ <code>boolean</code>
    * [.actionByAi()](#Request_actionByAi) ⇒ <code>string</code> \| <code>null</code>
    * [.aiActionsWinner()](#Request_aiActionsWinner) ⇒ [<code>IntentAction</code>](#IntentAction) \| <code>null</code>
    * [.postBack([getData])](#Request_postBack) ⇒ <code>null</code> \| <code>string</code> \| <code>object</code>
    * [.expectedEntities()](#Request_expectedEntities) ⇒ <code>Array.&lt;string&gt;</code>

<div id="new_Request_new">&nbsp;</div>

### new Request(event, state, pageId, globalIntents, [orchestratorOptions])

| Param | Type |
| --- | --- |
| event | <code>\*</code> | 
| state | <code>\*</code> | 
| pageId | <code>string</code> | 
| globalIntents | <code>Map</code> | 
| [orchestratorOptions] | [<code>RequestOrchestratorOptions</code>](#RequestOrchestratorOptions) | 

<div id="Request_params">&nbsp;</div>

### request.params
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | plugin configuration |

<div id="Request_timestamp">&nbsp;</div>

### request.timestamp
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type |
| --- | --- |
| timestamp | <code>number</code> \| <code>null</code> | 

<div id="Request_senderId">&nbsp;</div>

### request.senderId
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| senderId | <code>string</code> | sender.id from the event |

<div id="Request_recipientId">&nbsp;</div>

### request.recipientId
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| recipientId | <code>string</code> | recipient.id from the event |

<div id="Request_pageId">&nbsp;</div>

### request.pageId
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| pageId | <code>string</code> | page identifier from the event |

<div id="Request_state">&nbsp;</div>

### request.state
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| state | <code>object</code> | current state of the conversation |

<div id="Request_features">&nbsp;</div>

### request.features
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| features | <code>Array.&lt;string&gt;</code> | supported messaging features |

<div id="Request_subscribtions">&nbsp;</div>

### request.subscribtions
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| state | <code>Array.&lt;string&gt;</code> | list of subscribed tags |

<div id="Request_entities">&nbsp;</div>

### request.entities
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| entities | [<code>Array.&lt;Entity&gt;</code>](#Entity) | list of entities |

<div id="Request_intents">&nbsp;</div>

### request.intents
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| intents | [<code>Array.&lt;Intent&gt;</code>](#Intent) | list of resolved intents |

<div id="Request__orchestratorClientOptions">&nbsp;</div>

### request.\_orchestratorClientOptions : <code>OrchestratorClientOptions</code>
**Kind**: instance property of [<code>Request</code>](#Request)  
<div id="Request_event">&nbsp;</div>

### request.event : <code>object</code>
The original messaging event

**Kind**: instance property of [<code>Request</code>](#Request)  
<div id="Request_AI_SETSTATE">&nbsp;</div>

### request.AI\_SETSTATE : <code>enum</code>
**Kind**: instance enum of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Default |
| --- | --- | --- |
| ONLY | [<code>AiSetStateOption</code>](#AiSetStateOption) | <code>1</code> | 
| INCLUDE | [<code>AiSetStateOption</code>](#AiSetStateOption) | <code>0</code> | 
| EXCLUDE | [<code>AiSetStateOption</code>](#AiSetStateOption) | <code>-1</code> | 
| EXCLUDE_WITH_SET_ENTITIES | [<code>AiSetStateOption</code>](#AiSetStateOption) | <code>-2</code> | 
| EXCLUDE_WITHOUT_SET_ENTITIES | [<code>AiSetStateOption</code>](#AiSetStateOption) | <code>-3</code> | 

<div id="Request_supportsFeature">&nbsp;</div>

### request.supportsFeature(feature) ⇒ <code>boolean</code>
Returns true if a channel supports specified feature

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type |
| --- | --- |
| feature | <code>string</code> | 

<div id="Request_isStandby">&nbsp;</div>

### request.isStandby() ⇒ <code>boolean</code>
Returns true, if the incoming event is standby

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_aiActions">&nbsp;</div>

### request.aiActions([local]) ⇒ [<code>Array.&lt;IntentAction&gt;</code>](#IntentAction)
Get all matched actions from NLP intents

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default |
| --- | --- | --- |
| [local] | <code>boolean</code> | <code>false</code> | 

<div id="Request_aiActionsForQuickReplies">&nbsp;</div>

### request.aiActionsForQuickReplies([limit], [aiActions], [overrideAction]) ⇒ [<code>Array.&lt;QuickReplyDisambiguation&gt;</code>](#QuickReplyDisambiguation)
Covert all matched actions for disambiguation purposes

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default |
| --- | --- | --- |
| [limit] | <code>number</code> | <code>5</code> | 
| [aiActions] | [<code>Array.&lt;IntentAction&gt;</code>](#IntentAction) | <code></code> | 
| [overrideAction] | <code>string</code> | <code>null</code> | 

<div id="Request_hasAiActionsForDisambiguation">&nbsp;</div>

### request.hasAiActionsForDisambiguation(minimum, [local]) ⇒ <code>boolean</code>
Returns true, if there is an action for disambiguation

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default |
| --- | --- | --- |
| minimum | <code>number</code> | <code>1</code> | 
| [local] | <code>boolean</code> | <code>false</code> | 

<div id="Request_intent">&nbsp;</div>

### request.intent(getDataOrScore) ⇒ <code>null</code> \| <code>string</code> \| [<code>Intent</code>](#Intent)
Returns intent, when using AI

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| getDataOrScore | <code>boolean</code> \| <code>number</code> | <code>false</code> | score limit or true for getting intent data |

<div id="Request_entity">&nbsp;</div>

### request.entity(name, [sequence]) ⇒ <code>number</code> \| <code>string</code> \| <code>null</code>
Get matched entity value

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | name of requested entity |
| [sequence] | <code>number</code> | <code>0</code> | when there are more then one entity |

<div id="Request_isAttachment">&nbsp;</div>

### request.isAttachment() ⇒ <code>boolean</code>
Checks, when message contains an attachment (file, image or location)

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_isSetContext">&nbsp;</div>

### request.isSetContext(varsToCheck)
Orchestrator: check, if the request updates only $context variables

- when no variables to check provided,
  returns false when `set_context` is bundled within another conversational event

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Description |
| --- | --- | --- |
| varsToCheck | <code>Array.&lt;string&gt;</code> | list of variables to check |

<div id="Request_getSetContext">&nbsp;</div>

### request.getSetContext([includeContextSync]) ⇒ <code>object</code>
Orchestrator: get current thread context update

**Kind**: instance method of [<code>Request</code>](#Request)  
**Returns**: <code>object</code> - - with `§` prefixed keys  

| Param | Type | Default |
| --- | --- | --- |
| [includeContextSync] | <code>boolean</code> | <code>false</code> | 

<div id="Request_isImage">&nbsp;</div>

### request.isImage([attachmentIndex], [includingStickers]) ⇒ <code>boolean</code>
Checks, when the attachment is an image, but not a sticker

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [attachmentIndex] | <code>number</code> | <code>0</code> | use, when user sends more then one attachment |
| [includingStickers] | <code>boolean</code> | <code>false</code> | return true, when the image is also a sticker |

<div id="Request_isFile">&nbsp;</div>

### request.isFile([attachmentIndex]) ⇒ <code>boolean</code>
Checks, when the attachment is a file

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [attachmentIndex] | <code>number</code> | <code>0</code> | use, when user sends more then one attachment |

<div id="Request_hasLocation">&nbsp;</div>

### request.hasLocation() ⇒ <code>boolean</code>
Checks for location in attachments

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_getLocation">&nbsp;</div>

### request.getLocation() ⇒ <code>null</code> \| <code>Object</code>
Gets location coordinates from attachment, when exists

**Kind**: instance method of [<code>Request</code>](#Request)  
**Example**  
```js
const { Router } = require('wingbot');

const bot = new Router();

bot.use('start', (req, res) => {
    res.text('share location?', [
        // location share quick reply
        { action: 'locAction', title: 'Share location', isLocation: true }
    ]);
});

bot.use('locAction', (req, res) => {
    if (req.hasLocation()) {
        const { lat, long } = req.getLocation();
        res.text(`Got ${lat}, ${long}`);
    } else {
        res.text('No location received');
    }
});
```
<div id="Request_attachment">&nbsp;</div>

### request.attachment([attachmentIndex]) ⇒ <code>object</code> \| <code>null</code>
Returns whole attachment or null

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [attachmentIndex] | <code>number</code> | <code>0</code> | use, when user sends more then one attachment |

<div id="Request_attachmentUrl">&nbsp;</div>

### request.attachmentUrl([attachmentIndex]) ⇒ <code>string</code> \| <code>null</code>
Returns attachment URL

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [attachmentIndex] | <code>number</code> | <code>0</code> | use, when user sends more then one attachment |

<div id="Request_isMessage">&nbsp;</div>

### request.isMessage() ⇒ <code>boolean</code>
Returns true, when the request is text message, quick reply or attachment

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_isQuickReply">&nbsp;</div>

### request.isQuickReply() ⇒ <code>boolean</code>
Check, that message is a quick reply

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_isText">&nbsp;</div>

### request.isText() ⇒ <code>boolean</code>
Check, that message is PURE text

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_isSticker">&nbsp;</div>

### request.isSticker([includeToTextStickers]) ⇒ <code>boolean</code>
Returns true, when the attachment is a sticker

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [includeToTextStickers] | <code>boolean</code> | <code>false</code> | including strickers transformed into a text |

<div id="Request_text">&nbsp;</div>

### request.text([tokenized]) ⇒ <code>string</code>
Returns text of the message

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tokenized] | <code>boolean</code> | <code>false</code> | when true, message is normalized to lowercase with `-` |

**Example**  
```js
console.log(req.text(true)) // "can-you-help-me"
```
<div id="Request_textAlternatives">&nbsp;</div>

### request.textAlternatives() ⇒ [<code>Array.&lt;TextAlternative&gt;</code>](#TextAlternative)
Returns all text message alternatives including it's score

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_expected">&nbsp;</div>

### request.expected() ⇒ [<code>Action</code>](#Action) \| <code>null</code>
Returns the request expected handler in case have been set last response

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_expectedKeywords">&nbsp;</div>

### request.expectedKeywords([justOnce])
Returns all expected keywords for the next request (just expected keywords)

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [justOnce] | <code>boolean</code> | <code>false</code> | - don't return already retained items |

**Example**  
```js
bot.use('my-route', (req, res) => {
    res.setState(req.expectedKeywords());
});
```
<div id="Request_expectedContext">&nbsp;</div>

### request.expectedContext([justOnce], [includeKeywords]) ⇒ <code>object</code>
Returns current turn-around context (expected and expected keywords)

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [justOnce] | <code>boolean</code> | <code>false</code> | don't return already retained items |
| [includeKeywords] | <code>boolean</code> | <code>false</code> | keep intents from quick replies |

**Example**  
```js
bot.use('my-route', (req, res) => {
    res.setState(req.expectedContext());
});
```
<div id="Request_quickReply">&nbsp;</div>

### request.quickReply([getData]) ⇒ <code>null</code> \| <code>string</code> \| <code>object</code>
Returns action or data of quick reply
When `getData` is `true`, object will be returned. Otherwise string or null.

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default |
| --- | --- | --- |
| [getData] | <code>boolean</code> | <code>false</code> | 

**Example**  
```js
typeof res.quickReply() === 'string' || res.quickReply() === null;
typeof res.quickReply(true) === 'object';
```
<div id="Request_isPostBack">&nbsp;</div>

### request.isPostBack() ⇒ <code>boolean</code>
Returns true, if request is the postback

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_isReferral">&nbsp;</div>

### request.isReferral() ⇒ <code>boolean</code>
Returns true, if request is the referral

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_isOptin">&nbsp;</div>

### request.isOptin() ⇒ <code>boolean</code>
Returns true, if request is the optin

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_setAction">&nbsp;</div>

### request.setAction(action, [data]) ⇒ [<code>Action</code>](#Action) \| <code>null</code> \| <code>undefined</code>
Sets the action and returns previous action

**Kind**: instance method of [<code>Request</code>](#Request)  
**Returns**: [<code>Action</code>](#Action) \| <code>null</code> \| <code>undefined</code> - - previous action  

| Param | Type |
| --- | --- |
| action | <code>string</code> \| [<code>Action</code>](#Action) \| <code>null</code> | 
| [data] | <code>object</code> | 

<div id="Request_action">&nbsp;</div>

### request.action([getData]) ⇒ <code>null</code> \| <code>string</code>
Returns action of the postback or quickreply

the order, where from the action is resolved

1. referral
2. postback
2. optin
3. quick reply
4. expected keywords & intents
5. expected action in state
6. global or local AI intent action

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [getData] | <code>boolean</code> | <code>false</code> | deprecated |

**Example**  
```js
typeof res.action() === 'string' || res.action() === null;
typeof res.actionData() === 'object';
```
<div id="Request_actionData">&nbsp;</div>

### request.actionData() ⇒ <code>object</code>
Returns action data of postback or quick reply

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_getSetState">&nbsp;</div>

### request.getSetState(keysFromAi) ⇒ <code>object</code>
Gets incomming setState action variable

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type |
| --- | --- |
| keysFromAi | [<code>AiSetStateOption</code>](#AiSetStateOption) | 

**Example**  
```js
res.setState(req.getSetState());
```
<div id="Request_isConfidentInput">&nbsp;</div>

### request.isConfidentInput() ⇒ <code>boolean</code>
Returns true, if previous request has been
marked as confident using `res.expectedConfidentInput()`

It's good to consider this state in "analytics" integrations.

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_actionByAi">&nbsp;</div>

### request.actionByAi() ⇒ <code>string</code> \| <code>null</code>
Returs action string, if there is an action detected by NLP

> use rather designer's bounce feature instead of this pattern

**Kind**: instance method of [<code>Request</code>](#Request)  
**Example**  
```js
const { Router } = require('wingbot');

const bot = new Router();

bot.use('question', (req, res) => {
    res.text('tell me your email')
        .expected('email');
});

bot.use('email', async (req, res, postBack) => {
    if (req.actionByAi()) {
        await postBack(req.actionByAi(), {}, true);
        return;
    }
    res.text('thank you for your email');
    res.setState({ email: req.text() });
});
```
<div id="Request_aiActionsWinner">&nbsp;</div>

### request.aiActionsWinner() ⇒ [<code>IntentAction</code>](#IntentAction) \| <code>null</code>
Returns full detected AI action

**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="Request_postBack">&nbsp;</div>

### request.postBack([getData]) ⇒ <code>null</code> \| <code>string</code> \| <code>object</code>
Returns action or data of postback
When `getData` is `true`, object will be returned. Otherwise string or null.

**Kind**: instance method of [<code>Request</code>](#Request)  

| Param | Type | Default |
| --- | --- | --- |
| [getData] | <code>boolean</code> | <code>false</code> | 

**Example**  
```js
typeof res.postBack() === 'string' || res.postBack() === null;
typeof res.postBack(true) === 'object';
```
<div id="Request_expectedEntities">&nbsp;</div>

### request.expectedEntities() ⇒ <code>Array.&lt;string&gt;</code>
**Kind**: instance method of [<code>Request</code>](#Request)  
<div id="FEATURE_VOICE">&nbsp;</div>

## FEATURE\_VOICE : <code>string</code>
channel supports voice messages

**Kind**: global constant  
<div id="FEATURE_SSML">&nbsp;</div>

## FEATURE\_SSML : <code>string</code>
channel supports SSML voice messages

**Kind**: global constant  
<div id="FEATURE_PHRASES">&nbsp;</div>

## FEATURE\_PHRASES : <code>string</code>
channel supports expected phrases messages

**Kind**: global constant  
<div id="FEATURE_TEXT">&nbsp;</div>

## FEATURE\_TEXT : <code>string</code>
channel supports text communication

**Kind**: global constant  
<div id="FEATURE_VOICE">&nbsp;</div>

## FEATURE\_VOICE : <code>string</code>
channel supports voice messages

**Kind**: global constant  
<div id="FEATURE_SSML">&nbsp;</div>

## FEATURE\_SSML : <code>string</code>
channel supports SSML voice messages

**Kind**: global constant  
<div id="FEATURE_PHRASES">&nbsp;</div>

## FEATURE\_PHRASES : <code>string</code>
channel supports expected phrases messages

**Kind**: global constant  
<div id="FEATURE_TEXT">&nbsp;</div>

## FEATURE\_TEXT : <code>string</code>
channel supports text communication

**Kind**: global constant  
<div id="Entity">&nbsp;</div>

## Entity : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| entity | <code>string</code> | 
| value | <code>string</code> | 
| score | <code>number</code> | 
| [alternatives] | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 

<div id="Intent">&nbsp;</div>

## Intent : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| intent | <code>string</code> | 
| score | <code>number</code> | 
| [entities] | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 

<div id="Action">&nbsp;</div>

## Action : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| action | <code>string</code> | 
| data | <code>object</code> | 
| [setState] | <code>object</code> \| <code>null</code> | 

<div id="IntentAction">&nbsp;</div>

## IntentAction : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| action | <code>string</code> | 
| intent | [<code>Intent</code>](#Intent) | 
| sort | <code>number</code> | 
| local | <code>boolean</code> | 
| aboveConfidence | <code>boolean</code> | 
| [data] | <code>object</code> | 
| [match] | <code>string</code> \| <code>Array.&lt;string&gt;</code> | 
| [setState] | <code>object</code> | 
| [winner] | <code>boolean</code> | 
| [title] | <code>string</code> \| <code>function</code> | 
| [hasAiTitle] | <code>boolean</code> | 
| meta | <code>object</code> | 
| [meta.targetAppId] | <code>string</code> | 
| [meta.targetAction] | <code>string</code> \| <code>null</code> | 
| [meta.resolverTag] | <code>string</code> | 

<div id="QuickReply">&nbsp;</div>

## QuickReply : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| action | <code>string</code> | 
| title | <code>\*</code> | 

<div id="QuickReplyDisambiguation">&nbsp;</div>

## QuickReplyDisambiguation : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| action | <code>string</code> | 
| title | <code>string</code> | 
| data | <code>object</code> | 
| templateData | <code>object</code> | 

<div id="RequestOrchestratorOptions">&nbsp;</div>

## RequestOrchestratorOptions : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [apiUrl] | <code>string</code> | 
| [secret] | <code>Promise.&lt;string&gt;</code> | 
| [fetch] | <code>function</code> | 
| [appId] | <code>string</code> | 

<div id="TextAlternative">&nbsp;</div>

## TextAlternative : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| text | <code>string</code> | 
| score | <code>number</code> | 

<div id="AiSetStateOption">&nbsp;</div>

## AiSetStateOption : <code>number</code>
**Kind**: global typedef  
