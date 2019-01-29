# Schema Types


  <summary><strong>Table of Contents</strong></summary>

  * [Query](#query)
  * [Mutation](#mutation)
  * [Objects](#objects)
    * [Campaign](#campaign)
    * [Campaigns](#campaigns)
    * [PostBackResult](#postbackresult)
    * [QueuingResult](#queuingresult)
    * [Subscribtion](#subscribtion)
    * [Subscribtions](#subscribtions)
    * [Tag](#tag)
    * [Tags](#tags)
    * [ValidationResult](#validationresult)
  * [Inputs](#inputs)
    * [CampaignsCondition](#campaignscondition)
    * [CreateCampaignInput](#createcampaigninput)
    * [UpdateCampaignInput](#updatecampaigninput)
  * [Scalars](#scalars)
    * [Any](#any)
    * [Boolean](#boolean)
    * [Float](#float)
    * [Int](#int)
    * [String](#string)



## Query
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>tags</strong></td>
<td valign="top"><a href="#tags">Tags</a></td>
<td>

list tags statistics

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">pageId</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>subscribtions</strong></td>
<td valign="top"><a href="#subscribtions">Subscribtions</a></td>
<td>

fetch user ids for selected tag

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">include</td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">exclude</td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">pageId</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">limit</td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">lastKey</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>campaign</strong></td>
<td valign="top"><a href="#campaign">Campaign</a></td>
<td>

get a campaign by ID

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">campaignId</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>campaigns</strong></td>
<td valign="top"><a href="#campaigns">Campaigns</a></td>
<td>

list of user defined campaigns

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">limit</td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">lastKey</td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">condition</td>
<td valign="top"><a href="#campaignscondition">CampaignsCondition</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>version</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

returns the API version

</td>
</tr>
</tbody>
</table>

## Mutation
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>validateBot</strong></td>
<td valign="top"><a href="#validationresult">ValidationResult</a></td>
<td>

validate conversation data

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">bot</td>
<td valign="top"><a href="#any">Any</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateBot</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

invalidate a conversation cache in the chatbot

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>postBack</strong></td>
<td valign="top"><a href="#postbackresult">PostBackResult</a></td>
<td>

send a message to any user

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">pageId</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">senderId</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">action</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top"><a href="#any">Any</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createCampaign</strong></td>
<td valign="top"><a href="#campaign">Campaign</a></td>
<td>

create a new campaign

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">campaign</td>
<td valign="top"><a href="#createcampaigninput">CreateCampaignInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateCampaign</strong></td>
<td valign="top"><a href="#campaign">Campaign</a></td>
<td>

update a campaign

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">campaignId</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">update</td>
<td valign="top"><a href="#updatecampaigninput">UpdateCampaignInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeCampaign</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

remove a campaign

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">campaignId</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>runCampaign</strong></td>
<td valign="top"><a href="#queuingresult">QueuingResult</a></td>
<td>

run a campaign

</td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">campaignId</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

## Objects

### Campaign

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>id</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>action</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>data</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>include</strong></td>
<td valign="top">[<a href="#string">String</a>]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>exclude</strong></td>
<td valign="top">[<a href="#string">String</a>]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pageId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sliding</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>slide</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>active</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>in24hourWindow</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>startAt</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>allowRepeat</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sent</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>failed</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>delivery</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>read</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>notSent</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>leaved</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>queued</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>negative</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>positive</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasCondition</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>condition</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Campaigns

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>data</strong></td>
<td valign="top">[<a href="#campaign">Campaign</a>]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>lastKey</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### PostBackResult

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>status</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
</tbody>
</table>

### QueuingResult

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>queued</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### Subscribtion

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>pageId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>senderId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### Subscribtions

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>data</strong></td>
<td valign="top">[<a href="#subscribtion">Subscribtion</a>]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>lastKey</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>count</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### Tag

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>tag</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>subscribtions</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### Tags

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>data</strong></td>
<td valign="top">[<a href="#tag">Tag</a>]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>lastKey</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### ValidationResult

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>ok</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>error</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

## Inputs

### CampaignsCondition

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>active</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sliding</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
</tbody>
</table>

### CreateCampaignInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>action</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>data</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>include</strong></td>
<td valign="top">[<a href="#string">String</a>]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>exclude</strong></td>
<td valign="top">[<a href="#string">String</a>]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pageId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sliding</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>slide</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>active</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>in24hourWindow</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>startAt</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>allowRepeat</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasCondition</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>condition</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

### UpdateCampaignInput

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>name</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>action</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>data</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>include</strong></td>
<td valign="top">[<a href="#string">String</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>exclude</strong></td>
<td valign="top">[<a href="#string">String</a>]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>pageId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sliding</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>slide</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>active</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>in24hourWindow</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>startAt</strong></td>
<td valign="top"><a href="#float">Float</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>allowRepeat</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>type</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasCondition</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>condition</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
</tbody>
</table>

## Scalars

### Any

### Boolean

The `Boolean` scalar type represents `true` or `false`.

### Float

The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point). 

### Int

The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. 

### String

The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.

