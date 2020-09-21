{% raw %}<div id="vars">&nbsp;</div>{% endraw %}

## vars : <code>object</code>
**Kind**: global constant  

* [vars](#vars) : <code>object</code>
    * [.dialogContext(key, value)](#vars_dialogContext) ⇒ <code>object</code>
    * [.expiresAfter(key, value, turnovers)](#vars_expiresAfter) ⇒ <code>object</code>
    * [.preserveMeta(key, value, state)](#vars_preserveMeta) ⇒ <code>object</code>

{% raw %}<div id="vars_dialogContext">&nbsp;</div>{% endraw %}

### vars.dialogContext(key, value) ⇒ <code>object</code>
Sets variable, which will be removed, when user leaves the dialogue.
**Variable will be available at first interaction of next dialogue.**
Then it will be removed.

**Kind**: static method of [<code>vars</code>](#vars)  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 
| value | <code>\*</code> | 

**Example**  
```js
res.setState(vars.dialogContext('myKey', 'foovalue'))
```
{% raw %}<div id="vars_expiresAfter">&nbsp;</div>{% endraw %}

### vars.expiresAfter(key, value, turnovers) ⇒ <code>object</code>
Sets variable, which will be removed after specified number of conversation turonovers

**Kind**: static method of [<code>vars</code>](#vars)  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 
| value | <code>\*</code> | 
| turnovers | <code>number</code> | 

**Example**  
```js
res.setState(vars.expiresAfter('myKey', 'foovalue', 4))
```
{% raw %}<div id="vars_preserveMeta">&nbsp;</div>{% endraw %}

### vars.preserveMeta(key, value, state) ⇒ <code>object</code>
Sets variable while preserving its metadata

**Kind**: static method of [<code>vars</code>](#vars)  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 
| value | <code>\*</code> | 
| state | <code>object</code> | 

**Example**  
```js
res.setState(vars.expiresAfter('myKey', 'foovalue', 4))
```
