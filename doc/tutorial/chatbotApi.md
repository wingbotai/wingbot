# Chatbot API

You can communicate with your chatbot through its **GraphQL API**. These basic tasks can be done by API:

- sending messages (with [postBackApi()](../api/GraphApi.md#postBackApi))
- validating a conversation data (with [validateBotApi()](../api/GraphApi.md#validateBotApi))
- managing campaigns and querying target audience (with [Notifications#api()](../api/Notifications.md#Notifications_api))
- or updating a conversation data

## Sending a request to the chatbot (postback)

This example illustrates, how to send a request with CURL

```
curl -X POST https://yourbot.com/api \
  -H "Authorization: <custom static token for other applications>" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d @- << EOF

{
    "variables": {
        "pageId":"webchat",
        "senderId":"id-of-user",
        "action": "action-path"
    },
    "query":"mutation SendPostBack ($pageId:String!,$senderId:String!,$action:String!,$data:Any) { postBack (pageId:$pageId,senderId:$senderId,action:$action,data:$data) { status } }"
}
EOF
```

Or with plain javascript

```javascript
const request = new XMLHttpRequest();

request.open('POST', 'https://my-bot.com/api', true);

request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
request.setRequestHeader('Authorization', '<custom static token for other applications>');

request.onload = () => {
    let err = null;
    if (request.status >= 200 && request.status < 400) {
        const res = JSON.parse(request.response);
        if (res.data && (!res.errors || res.errors.length === 0)) {
            // success
        } else {
            err = res.errors && res.errors[0];
            // graphql error
        }
    } else {
        // error status
    }
};

request.onerror = () => {
    // request failed
};

request.send(JSON.stringify({
    query: `mutation SendPostBack (
        $pageId:String!,
        $senderId:String!,
        $action:String!,
        $data:Any
    ) {
        postBack (
            pageId:$pageId,
            senderId:$senderId,
            action:$action,
            data:$data
        ) {
            status
        }
    }`,
    variables: {
        pageId: 'webchat',
        senderId: 'id-of-user',
        action: 'action-path'
    }
}));
```

## Setting up the API

Each chatbot should have the `/api` endpoint, which listens to the
**GraphQL requests** authorized with **JWT token** or **Static token**.

```javascript
const { GraphApi, validateBotApi, postBackApi } = require('wingbot');
const espress = require('express');
const channel = require('./instance-of-facebook-or-botservice');
const botFactory = require('./function-which-returns-instance-of-router');

const app = express();

// attach API's
const api = new GraphApi([
    postBackApi(channel),
    validateBotApi(botFactory, 'start', 'foobar')
], {
    token: '<wingbot token>',
    appToken: '<custom static token for other applications>'
});

app.post(
    '/api',
    express.json(),
    (req, res, next) => {
        const { body } = req;
        api.request(body, req.headers)
            .then((response) => {
                res.set({
                    'Content-Type': 'application/json'
                })
                    .send(response);
            })
            .catch(next);
    })
);
```