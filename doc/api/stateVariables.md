<div id="vars">&nbsp;</div>

## vars : <code>object</code>
Helpers for `res.setState()` method

**Kind**: global constant  

* [vars](#vars) : <code>object</code>
    * [.dialogContext(key, value)](#vars_dialogContext) ⇒ <code>object</code>
    * [.expiresAfter(key, value, turnovers)](#vars_expiresAfter) ⇒ <code>object</code>
    * [.preserveMeta(key, value, state)](#vars_preserveMeta) ⇒ <code>object</code>

<div id="vars_dialogContext">&nbsp;</div>

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
const { vars } = require('wingbot');
res.setState(vars.dialogContext('myKey', 'foovalue'))
```
<div id="vars_expiresAfter">&nbsp;</div>

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
const { vars } = require('wingbot');
res.setState(vars.expiresAfter('myKey', 'foovalue', 4))
```
<div id="vars_preserveMeta">&nbsp;</div>

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
const { vars } = require('wingbot');
res.setState(vars.preserveMeta('myKey', 'foovalue', req.state))
```
