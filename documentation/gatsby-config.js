'use strict';
module.exports = {
  pathPrefix: "/wingbot",
  plugins: [
    {
      resolve: "smooth-doc",
      options: {
        name: "Wingbot Chatbot Framework Documentation",
        description: "Wingbot Chatbot Framework Documentation",
        siteUrl: "https://wingbotai.github.io/",
        sections: ['BUILDING A CHATBOT WITH DESIGNER', 'UNDERSTANDING THE CORE', 'API'],
        githubRepositoryURL: 'https://github.com/wingbotai/wingbot',
      },
    },
  ],
};
