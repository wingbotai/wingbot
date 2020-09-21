# Routing with NLP: intents, entities and fallbacks

## Introduction

State of the art NLP services detects following structures

- **intents** - what user wants to do (verb)
- **entities** - what's an object of intent (noun)

Let's have an example: `I want a ticket to Berlin`.

- `Berlin` is possibly **an entity**
- `need-ticket` could be **an intent**

## Basic concept

How to match the previous exaple?

```javascript
const { Router, ai } = require('wingbot');
const bot = new Router();

bot.use(ai.match(['need-ticket', '@town']), (req, res) => {
    res.text('Matched!');
});
```

The logic behind the evaluation is simple. If **one of intents** are matching and **all entities** are detected, the
interaction will be executed.

`(intent OR intent OR ...) AND entity AND entity`

## Defining entities

1. **Required entity**

  ```javascript
  const { Router, ai } = require('wingbot');
  const bot = new Router();
  bot.use(ai.match('@town'), (req, res) => {
      res.text('Matched!');
  });
  ```

2. **Optional entity**

  ```javascript
  const { Router, ai } = require('wingbot');
  const bot = new Router();
  bot.use(ai.match([{ entity: 'town', optional: true }]), (req, res) => {
      res.text('Matched!');
  });
  ```

3. **Entity value**

  ```javascript
  const { Router, ai } = require('wingbot');
  const bot = new Router();

  // using string expression
  bot.use(ai.match('@town=Prague'), (req, res) => {
      res.text('Matched!');
  });

  // using object
  bot.use(ai.match([{ entity: 'town', compare: 'Prague' }]), (req, res) => {
      res.text('Matched!');
  });
  ```

4. **Numeric range**

  Number should be equal to 200 or less.

  ```javascript
  const { Router, ai } = require('wingbot');
  const bot = new Router();
  bot.use(ai.match([
      { entity: 'amount', op: 'range ', compare: [null, 200] }
    ]), (req, res) => {
      res.text('Matched!');
  });
  ```

## Detecting entities using expressions

1. Entity is present: `@town`
2. Entity is optional: `@town?`
3. Entity is present and value matches: `@town=Prague`
5. Entity is present and value does not match: `@town!=Prague`
6. Entity is present and value is greater than: `@number>10`
7. Entity is present and value is greater or equal to: `@number>=10`
8. Entity is present and value is less than: `@number<10`
9. Entity is present and value is less or equal to: `@number<=10`
10. Entity is present and value is within range: `@number<>10,20`
11. Entity is present and value matches one of: `@town=Prague,Berlin`
12. Entity is present and value does not match one of: `@town!=Prague,Berlin`

## Context of intent detection

Context is usefull for routing text messages to the right interaction. In general, the context is defined by There are three types of context:

- **Global:** intent is detected globally, so it user can "switch" the context, when global intent is detected.
- **Dialogue (local):** the context is limited to current dialogue (Router)
- **Interaction:** With `res.expected('target')` you can strictly set a target interaction. So the following text response will be processed by the target interaction.

## Global intents and fallbacks

When using the global intent, the following interaction is **always triggered** (except an expected interaction is set). This is, how the global intent is defined.

The **global fallback** works as a default interaction. When no interaction is matched, bot replies with the global fallback. It should be defined in a root router.

```javascript
const { Router, ai } = require('wingbot');

/**
 * CONVERSATION ABOUT TICKETS
 */
const tickets = new Router();

// array works as OR - either intent or postback triggers the interaction
tickets.use(['need', ai.globalMatch('need-ticket')], (req, res) => {
    res.text('So you want a ticket!')
});

const bot = new Router();

bot.use('tickets', tickets);

// global fallback
bot.use((req, res) => {
    res.text('Ok, do you want beverages or tickes?', {
        'tickets/need': 'Tickets',
        'beverages/coffee': 'Coffee',
        'beverages/tee': 'Tee'
    })
});
```

So the only reasonable use case for global intent is to make an interaction from a nested router globally avaialble (can be triggered from any other dialogue/Router)

## Local intents and fallbacks (dialogue context)

The local intent can be triggered only, when the last interaction the user visits is in the same dialogue (Router) as the local intent is defined.

Also, the local fallback is triggered the same way. It's usefull when you want to take the user back to current dialogue.

```javascript
const { Router, ai } = require('wingbot');

const tickets = new Router();

tickets.use(['need', ai.globalMatch('need-ticket')], (req, res) => {
    res.text('So you want a ticket!')
});

// the local intent
tickets.use(['cost', ai.localMatch('how-much')], (req, res) => {
    res.text('But I need to know, where you want to go first. So where?');
});

// local fallback
beverages.use((req, res, postBack) => {
    res.text('No, this is about the ticket. Let\'s try it again.');
    // redirect to the "need" interaction
    postBack('need');
});

/**
 * LET'S PUT IT TOGETHER
 */
const bot = new Router();

bot.use('tickets', tickets);

// global fallback
bot.use((req, res) => {
    res.text('Ok, do you want beverages or tickes?', {
        'tickets/need': 'Tickets',
        'beverages/coffee': 'Coffee',
        'beverages/tee': 'Tee'
    })
});
```

In this example, the bot responds to `how-much` intent only when a previous interaction is one of those in the tickets router.

## Processing an expected response (interaction context)

To just process a response on a single interaction, there is a `res.expected(<action>)` method. It defines, which interaction will be triggred, when the user responds with text. You can

1. **Process the a raw text (response fallback)**

  It's usefull when asking the user for an input. The text will be always processed with the `email-response` interaction.

  How to handle correct user responses, like: `john.doe@gmail.com`.

  ```javascript
  tickets.use('ask-for-email', (req, res) => {
    res.text('Will you give me your email?')
      .expected('email-response');
  });

  tickets.use('email-response', (req, res) => {
    const email = req.text();
    res.text(`Ok, saving ${email} as your email.`)
      .setState({ email });
  });
  ```

2. **Handling a specific intent**

  What if the user does not wont to give you an email? Let's detect a negative response.

  How to handle specifc user responses, like: `no, not`.

  ```javascript
  tickets.use('ask-for-email', (req, res) => {
    res.text('Will you give me your email?')
      .expected('email-response');
  });

  tickets.use('email-response', ai.match('negative'), (req, res) => {
    res.text('It\'s ok. I do not insist on having your email.');
  });

  tickets.use('email-response', (req, res) => {
    const email = req.text();
    res.text(`Ok, saving ${email} as your email.`)
      .setState({ email });
  });
  ```

## Bookmarks: Global intents under control

When using **an interaction context** - the expected interaction is specified, the global intents are not triggered, but **they're accessible under bookmarks**. Let's follow up the previous example.

```javascript
tickets.use('ask-for-email', (req, res) => {
    res.text('Will you give me your email?')
        .expected('email-response');
});


tickets.use('email-response', async (req, res, postBack) => {
    // if there is a bookmark
    if (res.actionByAi()) {
        // respond with the bookmark
        await postBack(res.actionByAi(), {}, true);

        // stop
        return Router.END;
    }

    const email = req.text();

    res.text(`Ok, saving ${email} as your email.`)
        .setState({ email });
});
```

## System entities

**Simple RegExp entity**

Simple RegExp entities can be detected by registering an own entity detector.

```javascript
ai.getModel()
    .setEntityDetector('number', /[0-9]+/);
```

The value will be accessible between all detected entities in a NLP result.

```javascript
bot.use(ai.match('@number'), (req, res) => {
  const num = req.entity('number')
  // typeof num === 'string'
  res.text(`Found a number: ${number}`);
})
```

**Using an own value extractor**

RegExp detector returns the whole detected string as a value. To normalize the value, you can use `extractValue` option.

```javascript
ai.getModel()
    .setEntityDetector('number', /[0-9][0-9\s]*/, {
      extractValue: (match) => parseInt(
        match[0].replace(/[^0-9]+/g, ''),
        10
      )
    });
```

Now the detector returns a numeric value.

**Prevent sensitive data to leave your bot**

To keep a sensitive value inside a bot, you can mark your custom entity with an `anonymize` flag.

```javascript
ai.getModel()
    .setEntityDetector('number', /[0-9][0-9\s]*/, {
      extractValue: (match) => parseInt(
        match[0].replace(/[^0-9]+/g, ''),
        10
      ),
      anonymize: true
    });
```

When writing a sentence like `My number is 123 456`, a NLP will receive following text:

```
my number is @NUMBER
```

**Using compound entities**

Just put an **uppercase name of the entitty starting with @** to your regexp.

```javascript
ai.getModel()
    .setEntityDetector('dollars', /\$\s?@NUMBER/);
```

When there is only one nested entity, the value will contain it's value. When there will be two or more entities, the value will be an object with a prop for every nested entity (`{entityName:123,...}`).

> Keep in mind, **the regular expression will always be executed as CASE INSENSITIVE**;

**Using a custom entity detector**

Just put a function as an entity detector. You can also use **async function** as an entity detector.

```javascript
ai.getModel()
    .setEntityDetector('number', (text) => {
      const match = text.match(/[0-9]+/);

      if (!match) {
        return null;
      }

      return {
        text: match[0],
        value: parseInt(match[0], 10)
      };
    });
});
```

The return value has to contain **either detected** `text` **or** **position of the string** (`start` and `end`).