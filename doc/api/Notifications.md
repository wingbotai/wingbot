## Classes

<dl>
<dt><a href="#Notifications">Notifications</a></dt>
<dd><p>Experimental notifications service</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Tag">Tag</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Target">Target</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Subscribtion">Subscribtion</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Campaign">Campaign</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Task">Task</a> : <code>Object</code></dt>
<dd></dd>
</dl>

{% raw %}<div id="Notifications">&nbsp;</div>{% endraw %}

## Notifications
Experimental notifications service

**Kind**: global class  

* [Notifications](#Notifications)
    * [new Notifications(notificationStorage, options)](#new_Notifications_new)
    * [.api([acl])](#Notifications_api) ⇒ <code>Object</code>
    * [.subscribe(senderId, pageId, tag)](#Notifications_subscribe)
    * [.unsubscribe(senderId, pageId, [tag])](#Notifications_unsubscribe)
    * [.processMessage(event, pageId)](#Notifications_processMessage) ⇒ <code>Promise.&lt;{status:number}&gt;</code>
    * [.runCampaign(campaign)](#Notifications_runCampaign) ⇒ <code>Promise.&lt;{queued:number}&gt;</code>

{% raw %}<div id="new_Notifications_new">&nbsp;</div>{% endraw %}

### new Notifications(notificationStorage, options)
**Params**

- notificationStorage <code>NotificationsStorage</code>
- options <code>Object</code>
    - [.log] <code>console</code>
    - [.sendMoreMessagesOver24] <code>boolean</code>

{% raw %}<div id="Notifications_api">&nbsp;</div>{% endraw %}

### notifications.api([acl]) ⇒ <code>Object</code>
API Factory

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Returns**: <code>Object</code> - - the graphql api object  
**Params**

- [acl] <code>Array.&lt;string&gt;</code> | <code>function</code> <code> = </code> - limit api to array of groups or use auth function

{% raw %}<div id="Notifications_subscribe">&nbsp;</div>{% endraw %}

### notifications.subscribe(senderId, pageId, tag)
Subscribe user under certain tag

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- senderId <code>string</code>
- pageId <code>string</code>
- tag <code>string</code>

{% raw %}<div id="Notifications_unsubscribe">&nbsp;</div>{% endraw %}

### notifications.unsubscribe(senderId, pageId, [tag])
Unsubscribe user from certain tag or from all tags

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- senderId <code>string</code>
- pageId <code>string</code>
- [tag] <code>string</code> <code> = null</code>

{% raw %}<div id="Notifications_processMessage">&nbsp;</div>{% endraw %}

### notifications.processMessage(event, pageId) ⇒ <code>Promise.&lt;{status:number}&gt;</code>
Preprocess message - for read and delivery

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- event <code>Object</code>
- pageId <code>string</code>

{% raw %}<div id="Notifications_runCampaign">&nbsp;</div>{% endraw %}

### notifications.runCampaign(campaign) ⇒ <code>Promise.&lt;{queued:number}&gt;</code>
Run the campaign now (push tasks into the queue)

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- campaign <code>Object</code>

{% raw %}<div id="Tag">&nbsp;</div>{% endraw %}

## Tag : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| tag | <code>string</code> | 
| subscribtions | <code>number</code> | 

{% raw %}<div id="Target">&nbsp;</div>{% endraw %}

## Target : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 

{% raw %}<div id="Subscribtion">&nbsp;</div>{% endraw %}

## Subscribtion : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| subs | <code>Array.&lt;string&gt;</code> | 

{% raw %}<div id="Campaign">&nbsp;</div>{% endraw %}

## Campaign : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> |  |
| name | <code>string</code> | Tatgeting |
| include | <code>Array.&lt;string&gt;</code> |  |
| exclude | <code>Array.&lt;string&gt;</code> |  |
| pageId | <code>string</code> | Stats |
| sent | <code>number</code> |  |
| failed | <code>number</code> |  |
| delivery | <code>number</code> |  |
| read | <code>number</code> |  |
| notSent | <code>number</code> |  |
| leaved | <code>number</code> |  |
| queued | <code>number</code> | Interaction |
| action | <code>string</code> |  |
| [data] | <code>Object</code> | Setup |
| sliding | <code>boolean</code> |  |
| slide | <code>number</code> |  |
| active | <code>boolean</code> |  |
| in24hourWindow | <code>boolean</code> |  |
| startAt | <code>number</code> |  |

{% raw %}<div id="Task">&nbsp;</div>{% endraw %}

## Task : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| id | <code>string</code> | 
| pageId | <code>string</code> | 
| senderId | <code>string</code> | 
| campaignId | <code>string</code> | 
| enqueue | <code>number</code> | 
| [read] | <code>number</code> | 
| [delivery] | <code>number</code> | 
| [sent] | <code>number</code> | 

