'use strict';

var devBot = require("dev-bot");

devBot.connectGithub({
    type: "oauth",
    token: process.env.GITHUB_TOKEN
});

exports.onMention = function (mention, context, respondCallback) {
    respondCallback("Hello from @minimalbot");
}
