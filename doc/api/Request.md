## Classes

<dl>
<dt><a href="#{Request}">{Request}</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Entity">Entity</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Intent">Intent</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Action">Action</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#IntentAction">IntentAction</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#QuickReply">QuickReply</a> : <code>Object</code></dt>
<dd></dd>
</dl>

{% raw %}<div id="{Request}">&nbsp;</div>{% endraw %}

## {Request}
**Kind**: global class  
{% raw %}<div id="new_{Request}_new">&nbsp;</div>{% endraw %}

### new {Request}()
Instance of {Request} class is passed as first parameter of handler (req)

{% raw %}<div id="Entity">&nbsp;</div>{% endraw %}

## Entity : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| entity | <code>string</code> | 
| value | <code>string</code> | 
| score | <code>number</code> | 

{% raw %}<div id="Intent">&nbsp;</div>{% endraw %}

## Intent : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| intent | <code>string</code> | 
| score | <code>number</code> | 
| [entities] | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 

{% raw %}<div id="Action">&nbsp;</div>{% endraw %}

## Action : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| action | <code>string</code> | 
| data | <code>Object</code> | 
| [setState] | <code>Object</code> \| <code>null</code> | 

{% raw %}<div id="IntentAction">&nbsp;</div>{% endraw %}

## IntentAction : <code>Object</code>
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
| meta | <code>Object</code> | 
| [meta.targetAppId] | <code>string</code> | 
| [meta.targetAction] | <code>string</code> \| <code>null</code> | 

{% raw %}<div id="QuickReply">&nbsp;</div>{% endraw %}

## QuickReply : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| action | <code>string</code> | 
| title | <code>\*</code> | 

