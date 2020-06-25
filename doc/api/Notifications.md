## Classes

<dl>
<dt><a href="#Notifications">Notifications</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#CampaignTarget">CampaignTarget</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Task">Task</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Campaign">Campaign</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Tag">Tag</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Target">Target</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Subscribtion">Subscribtion</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Campaign">Campaign</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Task">Task</a> : <code>Object</code></dt>
<dd></dd>
</dl>

{% raw %}<div id="Notifications">&nbsp;</div>{% endraw %}

## Notifications
**Kind**: global class  

* [Notifications](#Notifications)
    * [new Notifications()](#new_Notifications_new)
    * _instance_
        * [.api([acl])](#Notifications_api) ⇒ <code>object</code>
        * [.createCampaign(name, action, [data], options)](#Notifications_createCampaign) ⇒ [<code>Promise.&lt;Campaign&gt;</code>](#Campaign)
        * [.pushTasksToQueue(campaignTargets)](#Notifications_pushTasksToQueue) ⇒ <code>Promise.&lt;Array.&lt;Task&gt;&gt;</code>
        * [.subscribe(senderId, pageId, tag)](#Notifications_subscribe)
        * [.unsubscribe(senderId, pageId, [tag], [req], [res])](#Notifications_unsubscribe)
        * [.processMessage(event, pageId)](#Notifications_processMessage) ⇒ <code>Promise.&lt;{status:number}&gt;</code>
        * [.getSubscribtions(senderId, pageId)](#Notifications_getSubscribtions) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
        * [.runCampaign(campaign)](#Notifications_runCampaign) ⇒ <code>Promise.&lt;{queued:number}&gt;</code>
        * [.sendCampaignMessage(campaign, processor, pageId, senderId, [data])](#Notifications_sendCampaignMessage) ⇒ <code>Promise.&lt;{status: number}&gt;</code>
    * _static_
        * [.Notifications](#Notifications_Notifications)
            * [new Notifications(notificationStorage, options)](#new_Notifications_Notifications_new)

{% raw %}<div id="new_Notifications_new">&nbsp;</div>{% endraw %}

### new Notifications()
Experimental notifications service

{% raw %}<div id="Notifications_api">&nbsp;</div>{% endraw %}

### notifications.api([acl]) ⇒ <code>object</code>
API Factory

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Returns**: <code>object</code> - - the graphql api object  
**Params**

- [acl] <code>Array.&lt;string&gt;</code> | <code>function</code> <code> = </code> - limit api to array of groups or use auth function

{% raw %}<div id="Notifications_createCampaign">&nbsp;</div>{% endraw %}

### notifications.createCampaign(name, action, [data], options) ⇒ [<code>Promise.&lt;Campaign&gt;</code>](#Campaign)
Upsert the campaign
If the campaing does not exists add new. Otherwise, update it.

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- name <code>string</code>
- action <code>string</code>
- [data] <code>object</code>
- options <code>object</code> - use { id: '...' } to make campaign accessible from code

{% raw %}<div id="Notifications_pushTasksToQueue">&nbsp;</div>{% endraw %}

### notifications.pushTasksToQueue(campaignTargets) ⇒ <code>Promise.&lt;Array.&lt;Task&gt;&gt;</code>
Add tasks to process by queue

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- campaignTargets [<code>Array.&lt;CampaignTarget&gt;</code>](#CampaignTarget)

{% raw %}<div id="Notifications_subscribe">&nbsp;</div>{% endraw %}

### notifications.subscribe(senderId, pageId, tag)
Subscribe user under certain tag

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- senderId <code>string</code>
- pageId <code>string</code>
- tag <code>string</code>

{% raw %}<div id="Notifications_unsubscribe">&nbsp;</div>{% endraw %}

### notifications.unsubscribe(senderId, pageId, [tag], [req], [res])
Unsubscribe user from certain tag or from all tags

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- senderId <code>string</code>
- pageId <code>string</code>
- [tag] <code>string</code> <code> = null</code>
- [req] <code>object</code> <code> = </code>
- [res] <code>object</code> <code> = </code>

{% raw %}<div id="Notifications_processMessage">&nbsp;</div>{% endraw %}

### notifications.processMessage(event, pageId) ⇒ <code>Promise.&lt;{status:number}&gt;</code>
Preprocess message - for read and delivery

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- event <code>object</code>
- pageId <code>string</code>

{% raw %}<div id="Notifications_getSubscribtions">&nbsp;</div>{% endraw %}

### notifications.getSubscribtions(senderId, pageId) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
Get user subscribtions

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- senderId <code>string</code>
- pageId <code>string</code>

{% raw %}<div id="Notifications_runCampaign">&nbsp;</div>{% endraw %}

### notifications.runCampaign(campaign) ⇒ <code>Promise.&lt;{queued:number}&gt;</code>
Run the campaign now (push tasks into the queue)

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- campaign <code>object</code>

{% raw %}<div id="Notifications_sendCampaignMessage">&nbsp;</div>{% endraw %}

### notifications.sendCampaignMessage(campaign, processor, pageId, senderId, [data]) ⇒ <code>Promise.&lt;{status: number}&gt;</code>
Sends the message directly (without queue)
and records it's delivery status at campaign stats

**Kind**: instance method of [<code>Notifications</code>](#Notifications)  
**Params**

- campaign <code>object</code> - campaign
- processor <code>object</code> - channel processor instance
- pageId <code>string</code> - page
- senderId <code>string</code> - user
- [data] <code>object</code> <code> = </code> - override the data of campaign

**Example**  
```javascript
const campaign = await notifications
    .createCampaign('Custom campaign', 'camp-action', {}, { id: 'custom-campaign' });

await notifications.sendCampaignMessage(campaign, channel, pageId, senderId);
```
{% raw %}<div id="Notifications_Notifications">&nbsp;</div>{% endraw %}

### Notifications.Notifications
**Kind**: static class of [<code>Notifications</code>](#Notifications)  
{% raw %}<div id="new_Notifications_Notifications_new">&nbsp;</div>{% endraw %}

#### new Notifications(notificationStorage, options)
Creates a new instance on notification service

**Params**

- notificationStorage <code>NotificationsStorage</code>
- options <code>object</code>
    - [.log] <code>console</code> - logger
    - [.default24Clearance] <code>number</code> - use this clearance to ensure delivery in 24h
    - [.allAudienceTag] <code>string</code> - tag to mark all users

{% raw %}<div id="CampaignTarget">&nbsp;</div>{% endraw %}

## CampaignTarget : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| senderId | <code>string</code> | sender identifier |
| pageId | <code>string</code> | page identifier |
| campaignId | <code>string</code> | campaign identifier |
| [data] | <code>object</code> | custom action data for specific target |
| [enqueue] | <code>number</code> | custom enqueue time, now will be used by default |

{% raw %}<div id="Task">&nbsp;</div>{% endraw %}

## Task : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | task identifier |
| pageId | <code>string</code> | page identifier |
| senderId | <code>string</code> | user identifier |
| campaignId | <code>string</code> | campaign identifer |
| enqueue | <code>number</code> | when the task will be processed with queue |
| [data] | <code>object</code> | custom action data for specific target |
| [read] | <code>number</code> | time of read |
| [delivery] | <code>number</code> | time of delivery |
| [sent] | <code>number</code> | time of send |
| [reaction] | <code>boolean</code> | user reacted |
| [leaved] | <code>number</code> | time the event was not sent because user left |

{% raw %}<div id="Campaign">&nbsp;</div>{% endraw %}

## Campaign : <code>object</code>
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
| [data] | <code>object</code> | Setup |
| sliding | <code>boolean</code> |  |
| slide | <code>number</code> |  |
| active | <code>boolean</code> |  |
| in24hourWindow | <code>boolean</code> |  |
| allowRepeat | <code>boolean</code> |  |
| startAt | <code>number</code> |  |
| slideRound | <code>number</code> |  |

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

## Campaign : <code>object</code>
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
| [data] | <code>object</code> | Setup |
| sliding | <code>boolean</code> |  |
| slide | <code>number</code> |  |
| active | <code>boolean</code> |  |
| in24hourWindow | <code>boolean</code> |  |
| allowRepeat | <code>boolean</code> |  |
| startAt | <code>number</code> |  |
| slideRound | <code>number</code> |  |

{% raw %}<div id="Task">&nbsp;</div>{% endraw %}

## Task : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> |  |
| pageId | <code>string</code> |  |
| senderId | <code>string</code> |  |
| campaignId | <code>string</code> |  |
| enqueue | <code>number</code> |  |
| [read] | <code>number</code> |  |
| [delivery] | <code>number</code> |  |
| [sent] | <code>number</code> |  |
| [insEnqueue] | <code>number</code> |  |
| [reaction] | <code>boolean</code> | user reacted |
| [leaved] | <code>number</code> | time the event was not sent because user left |

