# Nested Routers - Creating conversation blocks

Developing large chatbots with many flows requires advanced code organization.
We came up with solution which allows:

- creating reusable conversation blocks
- composability of whole flows
- keeping code clear and maintainable

## Basic concept

Each conversation block has a single entry point and one or more exit points.

```
  start
    |
  |-O------------|
  |              |
  | conversation |      is represented by single
  |     block    |      <Router> instance
  |              |
  |-X---X---X----|
    |   |   |

    exit points
```

When attaching the block into application, each exit point **must be "connected"** into
a parent conversation block.

## Example

First, let's start with a module. There is a single entry point: (`'/'`) and
two exit points (`'setName'` and `'leave'`). It's recomended to return data instead of
setting them to state.

```javascript
// setName.js
const { Router } = require('wingbot');

const bot = new Router();

// entry point
bot.use('/', (req, res) => {
    res.text('Please, give me a full name :)')
        .expected('name');
});

bot.use('name', (req, res, postBack) => {
    const name = req.text();
    if (!name || name.split(' ').length < 2) {
        res.text('Fullname must have two words or more.')
            .text('Please try it again', {
                '/start': 'Don\'t want'
            });
        // just stop dispatching (equal to "return undefined;")
        return Router.END;
    }

    res.setState({ name });
    postBack('/');
});

module.exports = bot;
```

```javascript
// index.js
const { Router, Settings } = require('wingbot');
const setName = require('./setName');

const settings = new Settings('pagetoken');
settings.getStartedButton('/start');

const bot = new Router();

bot.use('start', (req, res) => {
    if (req.state.name) {
        res.text(`Hello, I'am ${req.state.name}`, {
            setName: 'That\'s bad name'
        });
    } else {
        res.text('Hello, please give me name!', {
            setName: 'Let\'s do it'
        });
    }
});

bot.use('setName', setName);

module.exports = bot;
```

And this is, how the implementation works:

```
*-----------------------------------*
|                       Get started |
| Hello, please give me name!       |
|                                   |
|                      Let\'s do it |
| Please, give me a full name :)    |
|                                   |
|                                Ok |
| Fullname must have two words      |
| or more.                          |
| Please try it again               |
|                                   |
|                       Dorian Gray |
| Hello, I'am Dorian Gray           |
*-----------------------------------*
```