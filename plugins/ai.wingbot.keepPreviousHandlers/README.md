> Lock users in interaction, until they reply as you wish.

**Most used example: Get answer from users with the same options of answers**
- At the interaction fallback to keep users at the interaction. Bot can give help to users and keep them in interaction.
- This snippet keeps previous NLP handlers.
> This snippet is very similar to previous snippet Keep user in this interaction (use it as a fallback)]. The difference is you don't need to set NLP handlers.

**About the snippet:**
- Keeps previous NLP handlers and fallback.
- Where to use:
    - At the dialogue or global fallbacks - keep NLP handlers and fallback from previous interactions.
    - At the interaction fallback - keep NLP handlers and fallback from this interaction (they are used again)
- The snippet is applied whenever the user gets to this point of conversation.

**Take a look how to use this snippet:** [here](http://docs.wingbot.ai/context/AnswerTheQuestion/AnswerTheQuestion.html)

![keep previous handlers](https://github.com/wingbotai/wingbot/raw/master/plugins/ai.wingbot.keepPreviousHandlers/image1.gif)