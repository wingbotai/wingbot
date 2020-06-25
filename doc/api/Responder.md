## Classes

<dl>
<dt><a href="#Responder">Responder</a></dt>
<dd><p>Instance of responder is passed as second parameter of handler (res)</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#QuickReply">QuickReply</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#SenderMeta">SenderMeta</a> : <code>object</code></dt>
<dd></dd>
</dl>

{% raw %}<div id="Responder">&nbsp;</div>{% endraw %}

## Responder
Instance of responder is passed as second parameter of handler (res)

**Kind**: global class  

* [Responder](#Responder)
    * [.newState](#Responder_newState)
    * [.finalMessageSent](#Responder_finalMessageSent)
    * [.startedOutput](#Responder_startedOutput)
    * [.senderMeta](#Responder_senderMeta) ⇒ [<code>SenderMeta</code>](#SenderMeta)
    * [.data](#Responder_data) : <code>object</code>
    * [.run(blockName)](#Responder_run) ⇒ <code>Promise</code>
    * [.setNotificationRecipient(recipient)](#Responder_setNotificationRecipient)
    * [.doNotLogTheEvent()](#Responder_doNotLogTheEvent) ⇒ <code>this</code>
    * ~~[.setBookmark([action], [winningIntent])](#Responder_setBookmark) ⇒ <code>this</code>~~
    * ~~[.bookmark()](#Responder_bookmark) ⇒ <code>string</code> \| <code>null</code>~~
    * ~~[.runBookmark(postBack, [data])](#Responder_runBookmark) ⇒ <code>Promise.&lt;(null\|boolean)&gt;</code>~~
    * [.setMessagingType(messagingType, [tag])](#Responder_setMessagingType) ⇒ <code>this</code>
    * [.setPersona(personaId)](#Responder_setPersona) ⇒ <code>this</code>
    * [.isResponseType()](#Responder_isResponseType) ⇒ <code>boolean</code>
    * [.setData(data)](#Responder_setData) ⇒ <code>this</code>
    * [.text(text, [replies])](#Responder_text) ⇒ <code>this</code>
    * [.setState(object)](#Responder_setState) ⇒ <code>this</code>
    * [.addQuickReply(action, [title], [data], [prepend], [justToExisting])](#Responder_addQuickReply)
    * [.keepPreviousContext(req, [justOnce], [includeKeywords])](#Responder_keepPreviousContext) ⇒ <code>this</code>
    * [.expectedIntent(intents, action, data, setState)](#Responder_expectedIntent)
    * [.expected(action, data)](#Responder_expected) ⇒ <code>this</code>
    * [.expectedConfidentInput()](#Responder_expectedConfidentInput) ⇒ <code>this</code>
    * [.toAbsoluteAction(action)](#Responder_toAbsoluteAction) ⇒ <code>string</code>
    * [.currentAction()](#Responder_currentAction) ⇒ <code>string</code>
    * [.image(imageUrl, [reusable])](#Responder_image) ⇒ <code>this</code>
    * [.video(videoUrl, [reusable])](#Responder_video) ⇒ <code>this</code>
    * [.file(fileUrl, [reusable])](#Responder_file) ⇒ <code>this</code>
    * [.oneTimeNotificationRequest(title, action, [tag], [data])](#Responder_oneTimeNotificationRequest) ⇒ <code>this</code>
    * [.wait([ms])](#Responder_wait) ⇒ <code>this</code>
    * [.typingOn()](#Responder_typingOn) ⇒ <code>this</code>
    * [.typingOff()](#Responder_typingOff) ⇒ <code>this</code>
    * [.seen()](#Responder_seen) ⇒ <code>this</code>
    * [.passThread(targetAppId, [data])](#Responder_passThread) ⇒ <code>this</code>
    * [.requestThread([data])](#Responder_requestThread) ⇒ <code>this</code>
    * [.takeThead([data])](#Responder_takeThead) ⇒ <code>this</code>
    * [.receipt(recipientName, [paymentMethod], [currency], [uniqueCode])](#Responder_receipt) ⇒ <code>ReceiptTemplate</code>
    * [.button(text)](#Responder_button) ⇒ <code>ButtonTemplate</code>
    * [.genericTemplate([shareable], [isSquare])](#Responder_genericTemplate) ⇒ <code>GenericTemplate</code>
    * [.list([topElementStyle])](#Responder_list) ⇒ <code>ListTemplate</code>
    * [.trackAs(action)](#Responder_trackAs) ⇒ <code>this</code>
    * [.trackAsSkill(skill)](#Responder_trackAsSkill) ⇒ <code>this</code>

{% raw %}<div id="Responder_newState">&nbsp;</div>{% endraw %}

### responder.newState
The empty object, which is filled with res.setState() method
and saved (with Object.assign) at the end of event processing
into the conversation state.

**Kind**: instance property of [<code>Responder</code>](#Responder)  
**Properties**

| Type |
| --- |
| <code>object</code> | 

{% raw %}<div id="Responder_finalMessageSent">&nbsp;</div>{% endraw %}

### responder.finalMessageSent
Is true, when a final message (the quick replies by default) has been sent

**Kind**: instance property of [<code>Responder</code>](#Responder)  
**Properties**

| Type |
| --- |
| <code>boolean</code> | 

{% raw %}<div id="Responder_startedOutput">&nbsp;</div>{% endraw %}

### responder.startedOutput
Is true, when a an output started during the event dispatch

**Kind**: instance property of [<code>Responder</code>](#Responder)  
**Properties**

| Type |
| --- |
| <code>boolean</code> | 

{% raw %}<div id="Responder_senderMeta">&nbsp;</div>{% endraw %}

### responder.senderMeta ⇒ [<code>SenderMeta</code>](#SenderMeta)
Response has been marked with a flag

**Kind**: instance property of [<code>Responder</code>](#Responder)  
{% raw %}<div id="Responder_data">&nbsp;</div>{% endraw %}

### responder.data : <code>object</code>
**Kind**: instance property of [<code>Responder</code>](#Responder)  
{% raw %}<div id="Responder_run">&nbsp;</div>{% endraw %}

### responder.run(blockName) ⇒ <code>Promise</code>
Run a code block defined by a plugin

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- blockName <code>string</code>

**Properties**

| Type |
| --- |
| <code>function</code> | 

{% raw %}<div id="Responder_setNotificationRecipient">&nbsp;</div>{% endraw %}

### responder.setNotificationRecipient(recipient)
Replaces recipient and disables autotyping
Usefull for sending a one-time notification

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- recipient <code>object</code>

{% raw %}<div id="Responder_doNotLogTheEvent">&nbsp;</div>{% endraw %}

### responder.doNotLogTheEvent() ⇒ <code>this</code>
Disables logging the event to history

**Kind**: instance method of [<code>Responder</code>](#Responder)  
{% raw %}<div id="Responder_setBookmark">&nbsp;</div>{% endraw %}

### ~~responder.setBookmark([action], [winningIntent]) ⇒ <code>this</code>~~
***Deprecated***

Stores current action to be able to all it again

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- [action] <code>string</code>
- [winningIntent] <code>object</code> <code> = </code>

**Example**  
```javascript
bot.use(['action-name', /keyword/], (req, res) => {
    if (req.action() !== res.currentAction()) {
        // only for routes with action name (action-name)
        res.setBookmark();
        return Router.BREAK;
    }
    res.text('Keyword reaction');
});

// check out the res.runBookmark() method
```
{% raw %}<div id="Responder_bookmark">&nbsp;</div>{% endraw %}

### ~~responder.bookmark() ⇒ <code>string</code> \| <code>null</code>~~
***Deprecated***

Returns the action of bookmark

**Kind**: instance method of [<code>Responder</code>](#Responder)  
{% raw %}<div id="Responder_runBookmark">&nbsp;</div>{% endraw %}

### ~~responder.runBookmark(postBack, [data]) ⇒ <code>Promise.&lt;(null\|boolean)&gt;</code>~~
***Deprecated***

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- postBack <code>function</code> - the postback func
- [data] <code>object</code> - data for bookmark action

**Example**  
```javascript
// there should be a named intent intent matcher (ai.match() and 'action-name')

bot.use('action', (req, res) => {
    res.text('tell me your name');
    res.expected('onName');
});

bot.use('onName', (req, res, postBack) => {
    if (res.bookmark()) {
         await res.runBookmark(postBack);

         res.text('But I'll need your name')
             .expected('onName');
         return;
    }

    res.text(`Your name is: ${res.text()}`);
})
```
{% raw %}<div id="Responder_setMessagingType">&nbsp;</div>{% endraw %}

### responder.setMessagingType(messagingType, [tag]) ⇒ <code>this</code>
**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- messagingType <code>string</code>
- [tag] <code>string</code> <code> = null</code>

{% raw %}<div id="Responder_setPersona">&nbsp;</div>{% endraw %}

### responder.setPersona(personaId) ⇒ <code>this</code>
Tets the persona for following requests

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- personaId <code>object</code> | <code>string</code> | <code>null</code> <code> = </code>

{% raw %}<div id="Responder_isResponseType">&nbsp;</div>{% endraw %}

### responder.isResponseType() ⇒ <code>boolean</code>
Returns true, when responder is not sending an update (notification) message

**Kind**: instance method of [<code>Responder</code>](#Responder)  
{% raw %}<div id="Responder_setData">&nbsp;</div>{% endraw %}

### responder.setData(data) ⇒ <code>this</code>
Set temporary data to responder, which are persisted through single event

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- data <code>object</code>

**Example**  
```javascript
bot.use('foo', (req, res, postBack) => {
    res.setData({ a: 1 });
    postBack('bar');
});

bot.use('bar', (req, res) => {
    res.data.a; // === 1 from postback
});
```
{% raw %}<div id="Responder_text">&nbsp;</div>{% endraw %}

### responder.text(text, [replies]) ⇒ <code>this</code>
Send text as a response

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- text <code>string</code> - text to send to user, can contain placeholders (%s)
- [replies] <code>object.&lt;string, (string\|QuickReply)&gt;</code> | [<code>Array.&lt;QuickReply&gt;</code>](#QuickReply) <code> = </code> - quick replies

**Example**  
```javascript
// simply
res.text('Hello', {
    action: 'Quick reply',
    another: 'Another quick reply'
});

// complex
res.text('Hello', [
    { action: 'action', title: 'Quick reply' },
    {
        action: 'complexAction', // required
        title: 'Another quick reply', // required
        setState: { prop: 'value' }, // optional
        match: 'text' || /regexp/ || ['intent'], // optional
        data:  { foo: 1  }'Will be included in payload data' // optional
    }
]);
```
{% raw %}<div id="Responder_setState">&nbsp;</div>{% endraw %}

### responder.setState(object) ⇒ <code>this</code>
Sets new attributes to state (with Object.assign())

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- object <code>object</code>

**Example**  
```javascript
res.setState({ visited: true });
```
{% raw %}<div id="Responder_addQuickReply">&nbsp;</div>{% endraw %}

### responder.addQuickReply(action, [title], [data], [prepend], [justToExisting])
Appends quick reply, to be sent with following text method

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- action <code>string</code> | <code>object</code> - relative or absolute action
- [title] <code>string</code> - quick reply title
- [data] <code>object</code> - additional data
- [prepend] <code>boolean</code> <code> = false</code> - set true to add reply at the beginning
- [justToExisting] <code>boolean</code> <code> = false</code> - add quick reply only to existing replies

**Example**  
```javascript
bot.use((req, res) => {
    res.addQuickReply('barAction', 'last action');

    res.addQuickReply('theAction', 'first action', {}, true);

    res.text('Text', {
        fooAction: 'goto foo'
    }); // will be merged and sent with previously added quick replies
});
```
{% raw %}<div id="Responder_keepPreviousContext">&nbsp;</div>{% endraw %}

### responder.keepPreviousContext(req, [justOnce], [includeKeywords]) ⇒ <code>this</code>
To be able to keep context of previous interaction (expected action and intents)
Just use this method to let user to answer again.

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- req <code>Request</code>
- [justOnce] <code>boolean</code> <code> = false</code> - don't do it again
- [includeKeywords] <code>boolean</code> <code> = false</code> - keep intents from quick replies

**Example**  
```javascript
bot.use('start', (req, res) => {
    res.text('What color do you like?', [
        { match: ['@Color=red'], text: 'red', action: 'red' },
        { match: ['@Color=blue'], text: 'blue', action: 'blue' }
    ]);
    res.expected('need-color')
});

bot.use('need-color', (req, res) => {
    res.keepPreviousContext(req);
    res.text('Sorry, only red or blue.');
});
```
{% raw %}<div id="Responder_expectedIntent">&nbsp;</div>{% endraw %}

### responder.expectedIntent(intents, action, data, setState)
**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- intents <code>string</code> | <code>Array.&lt;string&gt;</code>
- action <code>string</code>
- data <code>object</code>
- setState <code>object</code> <code> = </code>

{% raw %}<div id="Responder_expected">&nbsp;</div>{% endraw %}

### responder.expected(action, data) ⇒ <code>this</code>
When user writes some text as reply, it will be processed as action

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- action <code>string</code> - desired action
- data <code>object</code> - desired action data

{% raw %}<div id="Responder_expectedConfidentInput">&nbsp;</div>{% endraw %}

### responder.expectedConfidentInput() ⇒ <code>this</code>
Makes a following user input anonymized

- disables processing of it with NLP
- replaces text content of incomming request before
  storing it at ChatLogStorage using a `confidentInputFilter`
- `req.isConfidentInput()` will return true

After processing the user input, next requests will be processed as usual,

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Example**  
```javascript
const { Router } = require('wingbot');

const bot = new Router();

bot.use('start', (req, res) => {
    // evil question
    res.text('Give me your CARD NUMBER :D')
        .expected('received-card-number')
        .expectedConfidentInput();
});

bot.use('received-card-number', (req, res) => {
    const cardNumber = req.text();

    // raw card number

    req.isConfidentInput(); // true

    res.text('got it')
        .setState({ cardNumber });
});
```
{% raw %}<div id="Responder_toAbsoluteAction">&nbsp;</div>{% endraw %}

### responder.toAbsoluteAction(action) ⇒ <code>string</code>
Converts relative action to absolute action path

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Returns**: <code>string</code> - absolute action path  
**Params**

- action <code>string</code> - relative action to covert to absolute

{% raw %}<div id="Responder_currentAction">&nbsp;</div>{% endraw %}

### responder.currentAction() ⇒ <code>string</code>
Returns current action path

**Kind**: instance method of [<code>Responder</code>](#Responder)  
{% raw %}<div id="Responder_image">&nbsp;</div>{% endraw %}

### responder.image(imageUrl, [reusable]) ⇒ <code>this</code>
Sends image as response. Requires appUrl option to send images from server

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- imageUrl <code>string</code> - relative or absolute url
- [reusable] <code>boolean</code> <code> = false</code> - force facebook to cache image

**Example**  
```javascript
// image on same server (appUrl option)
res.image('/img/foo.png');

// image at url
res.image('https://google.com/img/foo.png');
```
{% raw %}<div id="Responder_video">&nbsp;</div>{% endraw %}

### responder.video(videoUrl, [reusable]) ⇒ <code>this</code>
Sends video as response. Requires appUrl option to send videos from server

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- videoUrl <code>string</code> - relative or absolute url
- [reusable] <code>boolean</code> <code> = false</code> - force facebook to cache asset

**Example**  
```javascript
// file on same server (appUrl option)
res.video('/img/foo.mp4');

// file at url
res.video('https://google.com/img/foo.mp4');
```
{% raw %}<div id="Responder_file">&nbsp;</div>{% endraw %}

### responder.file(fileUrl, [reusable]) ⇒ <code>this</code>
Sends file as response. Requires appUrl option to send files from server

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- fileUrl <code>string</code> - relative or absolute url
- [reusable] <code>boolean</code> <code> = false</code> - force facebook to cache asset

**Example**  
```javascript
// file on same server (appUrl option)
res.file('/img/foo.pdf');

// file at url
res.file('https://google.com/img/foo.pdf');
```
{% raw %}<div id="Responder_oneTimeNotificationRequest">&nbsp;</div>{% endraw %}

### responder.oneTimeNotificationRequest(title, action, [tag], [data]) ⇒ <code>this</code>
One-time Notification request

use tag to be able to use the specific token with a specific campaign

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- title <code>string</code> - propmt text
- action <code>string</code> - target action, when user subscribes
- [tag] <code>string</code> <code> = null</code> - subscribtion tag, which will be matched against a campaign
- [data] <code>object</code>

{% raw %}<div id="Responder_wait">&nbsp;</div>{% endraw %}

### responder.wait([ms]) ⇒ <code>this</code>
Sets delay between two responses

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- [ms] <code>number</code> <code> = 600</code>

{% raw %}<div id="Responder_typingOn">&nbsp;</div>{% endraw %}

### responder.typingOn() ⇒ <code>this</code>
Sends "typing..." information

**Kind**: instance method of [<code>Responder</code>](#Responder)  
{% raw %}<div id="Responder_typingOff">&nbsp;</div>{% endraw %}

### responder.typingOff() ⇒ <code>this</code>
Stops "typing..." information

**Kind**: instance method of [<code>Responder</code>](#Responder)  
{% raw %}<div id="Responder_seen">&nbsp;</div>{% endraw %}

### responder.seen() ⇒ <code>this</code>
Reports last message from user as seen

**Kind**: instance method of [<code>Responder</code>](#Responder)  
{% raw %}<div id="Responder_passThread">&nbsp;</div>{% endraw %}

### responder.passThread(targetAppId, [data]) ⇒ <code>this</code>
Pass thread to another app

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- targetAppId <code>string</code>
- [data] <code>string</code> | <code>object</code> <code> = null</code>

{% raw %}<div id="Responder_requestThread">&nbsp;</div>{% endraw %}

### responder.requestThread([data]) ⇒ <code>this</code>
Request thread from Primary Receiver app

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- [data] <code>string</code> | <code>object</code> <code> = null</code>

{% raw %}<div id="Responder_takeThead">&nbsp;</div>{% endraw %}

### responder.takeThead([data]) ⇒ <code>this</code>
Take thread from another app

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- [data] <code>string</code> | <code>object</code> <code> = null</code>

{% raw %}<div id="Responder_receipt">&nbsp;</div>{% endraw %}

### responder.receipt(recipientName, [paymentMethod], [currency], [uniqueCode]) ⇒ <code>ReceiptTemplate</code>
Sends Receipt template

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- recipientName <code>string</code>
- [paymentMethod] <code>string</code> <code> = &quot;&#x27;Cash&#x27;&quot;</code> - should not contain more then 4 numbers
- [currency] <code>string</code> <code> = &quot;&#x27;USD&#x27;&quot;</code> - sets right currency
- [uniqueCode] <code>string</code> <code> = null</code> - when omitted, will be generated randomly

**Example**  
```javascript
res.receipt('Name', 'Cash', 'CZK', '1')
    .addElement('Element name', 1, 2, '/inside.png', 'text')
    .send();
```
{% raw %}<div id="Responder_button">&nbsp;</div>{% endraw %}

### responder.button(text) ⇒ <code>ButtonTemplate</code>
Sends nice button template. It can redirect user to server with token in url

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- text <code>string</code>

**Example**  
```javascript
res.button('Hello')
    .postBackButton('Text', 'action')
    .urlButton('Url button', '/internal', true) // opens webview with token
    .urlButton('Other button', 'https://goo.gl') // opens in internal browser
    .send();
```
{% raw %}<div id="Responder_genericTemplate">&nbsp;</div>{% endraw %}

### responder.genericTemplate([shareable], [isSquare]) ⇒ <code>GenericTemplate</code>
Creates a generic template

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- [shareable] <code>boolean</code> <code> = false</code> - ability to share template
- [isSquare] <code>boolean</code> <code> = false</code> - use square aspect ratio for images

**Example**  
```javascript
res.genericTemplate()
    .addElement('title', 'subtitle')
        .setElementImage('/local.png')
        .setElementAction('https://www.seznam.cz')
        .postBackButton('Button title', 'action', { actionData: 1 })
    .addElement('another', 'subtitle')
        .setElementImage('https://goo.gl/image.png')
        .setElementActionPostback('action', { actionData: 1 })
        .urlButton('Local link with extension', '/local/path', true, 'compact')
    .send();
```
{% raw %}<div id="Responder_list">&nbsp;</div>{% endraw %}

### responder.list([topElementStyle]) ⇒ <code>ListTemplate</code>
Creates a generic template

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- [topElementStyle] <code>&#x27;large&#x27;</code> | <code>&#x27;compact&#x27;</code> <code> = &#x27;large&#x27;</code>

**Example**  
```javascript
res.list('compact')
    .postBackButton('Main button', 'action', { actionData: 1 })
    .addElement('title', 'subtitle')
        .setElementImage('/local.png')
        .setElementUrl('https://www.seznam.cz')
        .postBackButton('Button title', 'action', { actionData: 1 })
    .addElement('another', 'subtitle')
        .setElementImage('https://goo.gl/image.png')
        .setElementAction('action', { actionData: 1 })
        .urlButton('Local link with extension', '/local/path', true, 'compact')
    .send();
```
{% raw %}<div id="Responder_trackAs">&nbsp;</div>{% endraw %}

### responder.trackAs(action) ⇒ <code>this</code>
Override action tracking

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- action <code>string</code> | <code>boolean</code> - use false to not emit analytics events

{% raw %}<div id="Responder_trackAsSkill">&nbsp;</div>{% endraw %}

### responder.trackAsSkill(skill) ⇒ <code>this</code>
Set skill for tracking (will used untill it will be changed)

**Kind**: instance method of [<code>Responder</code>](#Responder)  
**Params**

- skill <code>string</code> | <code>null</code>

{% raw %}<div id="QuickReply">&nbsp;</div>{% endraw %}

## QuickReply : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| title | <code>string</code> | 
| [action] | <code>string</code> | 
| [data] | <code>object</code> | 
| [setState] | <code>object</code> | 
| [match] | <code>RegExp</code> \| <code>string</code> \| <code>Array.&lt;string&gt;</code> | 

{% raw %}<div id="SenderMeta">&nbsp;</div>{% endraw %}

## SenderMeta : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| flag | <code>string</code> \| <code>null</code> | 
| [likelyIntent] | <code>string</code> | 
| [disambText] | <code>string</code> | 
| [disambiguationIntents] | <code>Array.&lt;string&gt;</code> | 

