## Classes

<dl>
<dt><a href="#ButtonTemplate">ButtonTemplate</a> ⇐ <code>BaseTemplate</code></dt>
<dd><p>Helps with creating of button template
Instance of button template is returned by {Responder}</p>
</dd>
<dt><a href="#GenericTemplate">GenericTemplate</a> ⇐ <code><a href="#ButtonTemplate">ButtonTemplate</a></code></dt>
<dd><p>Generic template utility</p>
</dd>
<dt><a href="#ReceiptTemplate">ReceiptTemplate</a> ⇐ <code>BaseTemplate</code></dt>
<dd><p>Provides fluent interface to make nice Receipts
Instance of button template is returned by {Responder}</p>
</dd>
</dl>

<div id="ButtonTemplate">&nbsp;</div>

## ButtonTemplate ⇐ <code>BaseTemplate</code>
Helps with creating of button template
Instance of button template is returned by {Responder}

**Kind**: global class  
**Extends**: <code>BaseTemplate</code>  

* [ButtonTemplate](#ButtonTemplate) ⇐ <code>BaseTemplate</code>
    * [.urlButton(title, linkUrl, hasExtension, [webviewHeight])](#ButtonTemplate_urlButton) ⇒ <code>this</code>
    * [.postBackButton(title, action, [data], [setState])](#ButtonTemplate_postBackButton) ⇒ <code>this</code>
    * [.shareButton()](#ButtonTemplate_shareButton) ⇒ <code>this</code>

<div id="ButtonTemplate_urlButton">&nbsp;</div>

### buttonTemplate.urlButton(title, linkUrl, hasExtension, [webviewHeight]) ⇒ <code>this</code>
Adds button. When `hasExtension` is set to `true`, url will contain hash like:
`#token=foo&senderId=23344`

**Kind**: instance method of [<code>ButtonTemplate</code>](#ButtonTemplate)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| title | <code>string</code> |  | button text |
| linkUrl | <code>string</code> |  | button url |
| hasExtension | <code>boolean</code> | <code>false</code> | includes token in url |
| [webviewHeight] | <code>string</code> | <code>null</code> | compact|tall|full |

<div id="ButtonTemplate_postBackButton">&nbsp;</div>

### buttonTemplate.postBackButton(title, action, [data], [setState]) ⇒ <code>this</code>
Adds button, which makes another action

**Kind**: instance method of [<code>ButtonTemplate</code>](#ButtonTemplate)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| title | <code>string</code> |  | Button title |
| action | <code>string</code> |  | Button action (can be absolute or relative) |
| [data] | <code>object</code> | <code>{}</code> | Action data |
| [setState] | <code>object</code> | <code></code> | SetState data |

<div id="ButtonTemplate_shareButton">&nbsp;</div>

### buttonTemplate.shareButton() ⇒ <code>this</code>
**Kind**: instance method of [<code>ButtonTemplate</code>](#ButtonTemplate)  
<div id="GenericTemplate">&nbsp;</div>

## GenericTemplate ⇐ [<code>ButtonTemplate</code>](#ButtonTemplate)
Generic template utility

**Kind**: global class  
**Extends**: [<code>ButtonTemplate</code>](#ButtonTemplate)  

* [GenericTemplate](#GenericTemplate) ⇐ [<code>ButtonTemplate</code>](#ButtonTemplate)
    * [.addElement(title, [subtitle], [dontTranslate])](#GenericTemplate_addElement) ⇒ <code>this</code>
    * [.setElementActionShare()](#GenericTemplate_setElementActionShare) ⇒ <code>this</code>
    * [.setElementActionPostback(action, [data])](#GenericTemplate_setElementActionPostback) ⇒ <code>this</code>
    * [.setElementImage(image)](#GenericTemplate_setElementImage) ⇒ <code>this</code>
    * [.setElementAction(url, hasExtension, [webviewHeight])](#GenericTemplate_setElementAction)
    * [.urlButton(title, linkUrl, hasExtension, [webviewHeight])](#ButtonTemplate_urlButton) ⇒ <code>this</code>
    * [.postBackButton(title, action, [data], [setState])](#ButtonTemplate_postBackButton) ⇒ <code>this</code>
    * [.shareButton()](#ButtonTemplate_shareButton) ⇒ <code>this</code>

<div id="GenericTemplate_addElement">&nbsp;</div>

### genericTemplate.addElement(title, [subtitle], [dontTranslate]) ⇒ <code>this</code>
Adds element to generic template

**Kind**: instance method of [<code>GenericTemplate</code>](#GenericTemplate)  

| Param | Type | Default |
| --- | --- | --- |
| title | <code>string</code> |  | 
| [subtitle] | <code>string</code> | <code>null</code> | 
| [dontTranslate] | <code>boolean</code> | <code>false</code> | 

<div id="GenericTemplate_setElementActionShare">&nbsp;</div>

### genericTemplate.setElementActionShare() ⇒ <code>this</code>
Sets url of recently added element

**Kind**: instance method of [<code>GenericTemplate</code>](#GenericTemplate)  
<div id="GenericTemplate_setElementActionPostback">&nbsp;</div>

### genericTemplate.setElementActionPostback(action, [data]) ⇒ <code>this</code>
Sets url of recently added element

**Kind**: instance method of [<code>GenericTemplate</code>](#GenericTemplate)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| action | <code>string</code> |  | Button action (can be absolute or relative) |
| [data] | <code>object</code> | <code>{}</code> | Action data |

<div id="GenericTemplate_setElementImage">&nbsp;</div>

### genericTemplate.setElementImage(image) ⇒ <code>this</code>
Sets image of recently added element

**Kind**: instance method of [<code>GenericTemplate</code>](#GenericTemplate)  

| Param | Type |
| --- | --- |
| image | <code>string</code> | 

<div id="GenericTemplate_setElementAction">&nbsp;</div>

### genericTemplate.setElementAction(url, hasExtension, [webviewHeight])
Sets default action of recently added element

**Kind**: instance method of [<code>GenericTemplate</code>](#GenericTemplate)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>string</code> |  | button url |
| hasExtension | <code>boolean</code> | <code>false</code> | includes token in url |
| [webviewHeight] | <code>string</code> | <code>null</code> | compact|tall|full |

<div id="ButtonTemplate_urlButton">&nbsp;</div>

### genericTemplate.urlButton(title, linkUrl, hasExtension, [webviewHeight]) ⇒ <code>this</code>
Adds button. When `hasExtension` is set to `true`, url will contain hash like:
`#token=foo&senderId=23344`

**Kind**: instance method of [<code>GenericTemplate</code>](#GenericTemplate)  
**Overrides**: [<code>urlButton</code>](#ButtonTemplate_urlButton)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| title | <code>string</code> |  | button text |
| linkUrl | <code>string</code> |  | button url |
| hasExtension | <code>boolean</code> | <code>false</code> | includes token in url |
| [webviewHeight] | <code>string</code> | <code>null</code> | compact|tall|full |

<div id="ButtonTemplate_postBackButton">&nbsp;</div>

### genericTemplate.postBackButton(title, action, [data], [setState]) ⇒ <code>this</code>
Adds button, which makes another action

**Kind**: instance method of [<code>GenericTemplate</code>](#GenericTemplate)  
**Overrides**: [<code>postBackButton</code>](#ButtonTemplate_postBackButton)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| title | <code>string</code> |  | Button title |
| action | <code>string</code> |  | Button action (can be absolute or relative) |
| [data] | <code>object</code> | <code>{}</code> | Action data |
| [setState] | <code>object</code> | <code></code> | SetState data |

<div id="ButtonTemplate_shareButton">&nbsp;</div>

### genericTemplate.shareButton() ⇒ <code>this</code>
**Kind**: instance method of [<code>GenericTemplate</code>](#GenericTemplate)  
**Overrides**: [<code>shareButton</code>](#ButtonTemplate_shareButton)  
<div id="ReceiptTemplate">&nbsp;</div>

## ReceiptTemplate ⇐ <code>BaseTemplate</code>
Provides fluent interface to make nice Receipts
Instance of button template is returned by {Responder}

**Kind**: global class  
**Extends**: <code>BaseTemplate</code>  
<div id="ReceiptTemplate_addElement">&nbsp;</div>

### receiptTemplate.addElement(title, [price], [quantity], [image], [subtitle]) ⇒ <code>this</code>
Adds item to receipt

**Kind**: instance method of [<code>ReceiptTemplate</code>](#ReceiptTemplate)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| title | <code>string</code> |  |  |
| [price] | <code>number</code> | <code>0</code> | a item price |
| [quantity] | <code>number</code> | <code></code> | amount of items |
| [image] | <code>string</code> | <code>null</code> | image of item |
| [subtitle] | <code>string</code> | <code>null</code> | optional subtitle |

