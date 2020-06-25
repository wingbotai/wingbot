## Classes

<dl>
<dt><a href="#Request">Request</a></dt>
<dd><p>Instance of {Request} class is passed as first parameter of handler (req)</p>
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
</dl>

{% raw %}<div id="Request">&nbsp;</div>{% endraw %}

## Request
Instance of {Request} class is passed as first parameter of handler (req)

**Kind**: global class  

* [Request](#Request)
    * [.params](#Request_params)
    * [.timestamp](#Request_timestamp)
    * [.senderId](#Request_senderId)
    * [.recipientId](#Request_recipientId)
    * [.pageId](#Request_pageId)
    * [.state](#Request_state)
    * [.subscribtions](#Request_subscribtions)
    * [.entities](#Request_entities)
    * [.intents](#Request_intents)
    * [.event](#Request_event) : <code>object</code>
    * [.isStandby()](#Request_isStandby) ⇒ <code>boolean</code>
    * [.aiActions()](#Request_aiActions) ⇒ [<code>Array.&lt;IntentAction&gt;</code>](#IntentAction)
    * [.aiActionsForQuickReplies([limit], [aiActions], [overrideAction])](#Request_aiActionsForQuickReplies) ⇒ [<code>Array.&lt;QuickReply&gt;</code>](#QuickReply)
    * [.hasAiActionsForDisambiguation(minimum)](#Request_hasAiActionsForDisambiguation) ⇒ <code>boolean</code>
    * [.intent(getDataOrScore)](#Request_intent) ⇒ <code>null</code> \| <code>string</code> \| [<code>Intent</code>](#Intent)
    * [.entity(name, [sequence])](#Request_entity) ⇒ <code>number</code> \| <code>string</code> \| <code>null</code>
    * [.isAttachment()](#Request_isAttachment) ⇒ <code>boolean</code>
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
    * [.getSetState()](#Request_getSetState) ⇒ <code>object</code>
    * [.isConfidentInput()](#Request_isConfidentInput) ⇒ <code>boolean</code>
    * [.postBack([getData])](#Request_postBack) ⇒ <code>null</code> \| <code>string</code> \| <code>object</code>

{% raw %}<div id="Request_params">&nbsp;</div>{% endraw %}

### request.params
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | plugin configuration |

{% raw %}<div id="Request_timestamp">&nbsp;</div>{% endraw %}

### request.timestamp
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type |
| --- | --- |
| timestamp | <code>number</code> \| <code>null</code> | 

{% raw %}<div id="Request_senderId">&nbsp;</div>{% endraw %}

### request.senderId
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| senderId | <code>string</code> | sender.id from the event |

{% raw %}<div id="Request_recipientId">&nbsp;</div>{% endraw %}

### request.recipientId
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| recipientId | <code>string</code> | recipient.id from the event |

{% raw %}<div id="Request_pageId">&nbsp;</div>{% endraw %}

### request.pageId
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| pageId | <code>string</code> | page identifier from the event |

{% raw %}<div id="Request_state">&nbsp;</div>{% endraw %}

### request.state
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| state | <code>object</code> | current state of the conversation |

{% raw %}<div id="Request_subscribtions">&nbsp;</div>{% endraw %}

### request.subscribtions
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| state | <code>Array.&lt;string&gt;</code> | list of subscribed tags |

{% raw %}<div id="Request_entities">&nbsp;</div>{% endraw %}

### request.entities
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| entities | [<code>Array.&lt;Entity&gt;</code>](#Entity) | list of entities |

{% raw %}<div id="Request_intents">&nbsp;</div>{% endraw %}

### request.intents
**Kind**: instance property of [<code>Request</code>](#Request)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| intents | [<code>Array.&lt;Intent&gt;</code>](#Intent) | list of resolved intents |

{% raw %}<div id="Request_event">&nbsp;</div>{% endraw %}

### request.event : <code>object</code>
The original messaging event

**Kind**: instance property of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_isStandby">&nbsp;</div>{% endraw %}

### request.isStandby() ⇒ <code>boolean</code>
Returns true, if the incomming event is standby

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_aiActions">&nbsp;</div>{% endraw %}

### request.aiActions() ⇒ [<code>Array.&lt;IntentAction&gt;</code>](#IntentAction)
Get all matched actions from NLP intents

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_aiActionsForQuickReplies">&nbsp;</div>{% endraw %}

### request.aiActionsForQuickReplies([limit], [aiActions], [overrideAction]) ⇒ [<code>Array.&lt;QuickReply&gt;</code>](#QuickReply)
Covert all matched actions for disambiguation purposes

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- [limit] <code>number</code> <code> = 5</code>
- [aiActions] [<code>Array.&lt;IntentAction&gt;</code>](#IntentAction) <code> = </code>
- [overrideAction] <code>string</code> <code> = null</code>

{% raw %}<div id="Request_hasAiActionsForDisambiguation">&nbsp;</div>{% endraw %}

### request.hasAiActionsForDisambiguation(minimum) ⇒ <code>boolean</code>
Returns true, if there is an action for disambiguation

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- minimum <code>number</code> <code> = 1</code>

{% raw %}<div id="Request_intent">&nbsp;</div>{% endraw %}

### request.intent(getDataOrScore) ⇒ <code>null</code> \| <code>string</code> \| [<code>Intent</code>](#Intent)
Returns intent, when using AI

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- getDataOrScore <code>boolean</code> | <code>number</code> <code> = false</code> - score limit or true for getting intent data

{% raw %}<div id="Request_entity">&nbsp;</div>{% endraw %}

### request.entity(name, [sequence]) ⇒ <code>number</code> \| <code>string</code> \| <code>null</code>
Get matched entity value

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- name <code>string</code> - name of requested entity
- [sequence] <code>number</code> <code> = 0</code> - when there are more then one entity

{% raw %}<div id="Request_isAttachment">&nbsp;</div>{% endraw %}

### request.isAttachment() ⇒ <code>boolean</code>
Checks, when message contains an attachment (file, image or location)

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_isImage">&nbsp;</div>{% endraw %}

### request.isImage([attachmentIndex], [includingStickers]) ⇒ <code>boolean</code>
Checks, when the attachment is an image, but not a sticker

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- [attachmentIndex] <code>number</code> <code> = 0</code> - use, when user sends more then one attachment
- [includingStickers] <code>boolean</code> <code> = false</code> - return true, when the image is also a sticker

{% raw %}<div id="Request_isFile">&nbsp;</div>{% endraw %}

### request.isFile([attachmentIndex]) ⇒ <code>boolean</code>
Checks, when the attachment is a file

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- [attachmentIndex] <code>number</code> <code> = 0</code> - use, when user sends more then one attachment

{% raw %}<div id="Request_hasLocation">&nbsp;</div>{% endraw %}

### request.hasLocation() ⇒ <code>boolean</code>
Checks for location in attachments

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_getLocation">&nbsp;</div>{% endraw %}

### request.getLocation() ⇒ <code>null</code> \| <code>Object</code>
Gets location coordinates from attachment, when exists

**Kind**: instance method of [<code>Request</code>](#Request)  
**Example**  
```javascript
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
{% raw %}<div id="Request_attachment">&nbsp;</div>{% endraw %}

### request.attachment([attachmentIndex]) ⇒ <code>object</code> \| <code>null</code>
Returns whole attachment or null

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- [attachmentIndex] <code>number</code> <code> = 0</code> - use, when user sends more then one attachment

{% raw %}<div id="Request_attachmentUrl">&nbsp;</div>{% endraw %}

### request.attachmentUrl([attachmentIndex]) ⇒ <code>string</code> \| <code>null</code>
Returns attachment URL

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- [attachmentIndex] <code>number</code> <code> = 0</code> - use, when user sends more then one attachment

{% raw %}<div id="Request_isMessage">&nbsp;</div>{% endraw %}

### request.isMessage() ⇒ <code>boolean</code>
Returns true, when the request is text message, quick reply or attachment

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_isQuickReply">&nbsp;</div>{% endraw %}

### request.isQuickReply() ⇒ <code>boolean</code>
Check, that message is a quick reply

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_isText">&nbsp;</div>{% endraw %}

### request.isText() ⇒ <code>boolean</code>
Check, that message is PURE text

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_isSticker">&nbsp;</div>{% endraw %}

### request.isSticker([includeToTextStickers]) ⇒ <code>boolean</code>
Returns true, when the attachment is a sticker

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- [includeToTextStickers] <code>boolean</code> <code> = false</code> - including strickers transformed into a text

{% raw %}<div id="Request_text">&nbsp;</div>{% endraw %}

### request.text([tokenized]) ⇒ <code>string</code>
Returns text of the message

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- [tokenized] <code>boolean</code> <code> = false</code> - when true, message is normalized to lowercase with `-`

**Example**  
```javascript
console.log(req.text(true)) // "can-you-help-me"
```
{% raw %}<div id="Request_expected">&nbsp;</div>{% endraw %}

### request.expected() ⇒ [<code>Action</code>](#Action) \| <code>null</code>
Returns the request expected handler in case have been set last response

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_expectedKeywords">&nbsp;</div>{% endraw %}

### request.expectedKeywords([justOnce])
Returns all expected keywords for the next request (just expected keywords)

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- [justOnce] <code>boolean</code> <code> = false</code> - - don't return already retained items

**Example**  
```javascript
bot.use('my-route', (req, res) => {
    res.setState(req.expectedKeywords());
});
```
{% raw %}<div id="Request_expectedContext">&nbsp;</div>{% endraw %}

### request.expectedContext([justOnce], [includeKeywords]) ⇒ <code>object</code>
Returns current turn-around context (expected and expected keywords)

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- [justOnce] <code>boolean</code> <code> = false</code> - don't return already retained items
- [includeKeywords] <code>boolean</code> <code> = false</code> - keep intents from quick replies

**Example**  
```javascript
bot.use('my-route', (req, res) => {
    res.setState(req.expectedContext());
});
```
{% raw %}<div id="Request_quickReply">&nbsp;</div>{% endraw %}

### request.quickReply([getData]) ⇒ <code>null</code> \| <code>string</code> \| <code>object</code>
Returns action or data of quick reply
When `getData` is `true`, object will be returned. Otherwise string or null.

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- [getData] <code>boolean</code> <code> = false</code>

**Example**  
```javascript
typeof res.quickReply() === 'string' || res.quickReply() === null;
typeof res.quickReply(true) === 'object';
```
{% raw %}<div id="Request_isPostBack">&nbsp;</div>{% endraw %}

### request.isPostBack() ⇒ <code>boolean</code>
Returns true, if request is the postback

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_isReferral">&nbsp;</div>{% endraw %}

### request.isReferral() ⇒ <code>boolean</code>
Returns true, if request is the referral

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_isOptin">&nbsp;</div>{% endraw %}

### request.isOptin() ⇒ <code>boolean</code>
Returns true, if request is the optin

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_setAction">&nbsp;</div>{% endraw %}

### request.setAction(action, [data]) ⇒ [<code>Action</code>](#Action) \| <code>null</code> \| <code>undefined</code>
Sets the action and returns previous action

**Kind**: instance method of [<code>Request</code>](#Request)  
**Returns**: [<code>Action</code>](#Action) \| <code>null</code> \| <code>undefined</code> - - previous action  
**Params**

- action <code>string</code> | [<code>Action</code>](#Action) | <code>null</code>
- [data] <code>object</code>

{% raw %}<div id="Request_action">&nbsp;</div>{% endraw %}

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
**Params**

- [getData] <code>boolean</code> <code> = false</code> - deprecated

**Example**  
```javascript
typeof res.action() === 'string' || res.action() === null;
typeof res.actionData() === 'object';
```
{% raw %}<div id="Request_actionData">&nbsp;</div>{% endraw %}

### request.actionData() ⇒ <code>object</code>
Returns action data of postback or quick reply

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_getSetState">&nbsp;</div>{% endraw %}

### request.getSetState() ⇒ <code>object</code>
Gets incomming setState action variable

**Kind**: instance method of [<code>Request</code>](#Request)  
**Example**  
```javascript
res.setState(req.getSetState());
```
{% raw %}<div id="Request_isConfidentInput">&nbsp;</div>{% endraw %}

### request.isConfidentInput() ⇒ <code>boolean</code>
Returns true, if previous request has been
marked as confident using `res.expectedConfidentInput()`

It's good to consider this state in "analytics" integrations.

**Kind**: instance method of [<code>Request</code>](#Request)  
{% raw %}<div id="Request_postBack">&nbsp;</div>{% endraw %}

### request.postBack([getData]) ⇒ <code>null</code> \| <code>string</code> \| <code>object</code>
Returns action or data of postback
When `getData` is `true`, object will be returned. Otherwise string or null.

**Kind**: instance method of [<code>Request</code>](#Request)  
**Params**

- [getData] <code>boolean</code> <code> = false</code>

**Example**  
```javascript
typeof res.postBack() === 'string' || res.postBack() === null;
typeof res.postBack(true) === 'object';
```
{% raw %}<div id="Entity">&nbsp;</div>{% endraw %}

## Entity : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| entity | <code>string</code> | 
| value | <code>string</code> | 
| score | <code>number</code> | 

{% raw %}<div id="Intent">&nbsp;</div>{% endraw %}

## Intent : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| intent | <code>string</code> | 
| score | <code>number</code> | 
| [entities] | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 

{% raw %}<div id="Action">&nbsp;</div>{% endraw %}

## Action : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| action | <code>string</code> | 
| data | <code>object</code> | 
| [setState] | <code>object</code> \| <code>null</code> | 

{% raw %}<div id="IntentAction">&nbsp;</div>{% endraw %}

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
| [winner] | <code>boolean</code> | 
| [title] | <code>string</code> \| <code>function</code> | 
| meta | <code>object</code> | 
| [meta.targetAppId] | <code>string</code> | 
| [meta.targetAction] | <code>string</code> \| <code>null</code> | 

{% raw %}<div id="QuickReply">&nbsp;</div>{% endraw %}

## QuickReply : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| action | <code>string</code> | 
| title | <code>\*</code> | 

