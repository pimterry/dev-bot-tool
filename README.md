# DevBot Deploy [![Build Status](https://travis-ci.org/pimterry/dev-bot-tool.png)](https://travis-ci.org/pimterry/dev-bot-tool)

**[DevBot](https://github.com/pimterry/dev-bot) is a framework to build chat-bot-based developer tooling.**

This is a command line tool to manage your DevBots, so you can run them locally, host them for free (typically) on AWS Lambda, and generally get things done.

Take a look at [DevBot](https://github.com/pimterry/dev-bot) for more info on how to build bots themselves. For the rest of this readme, I'm going to assume you're totally on that, you've got at least the start of a bot ready and waiting.

## Getting Started

First up, get a bot ready, and then install the DevBot tool:

```javascript
npm install --save-dev dev-bot-tool
```

Note that with the above, you don't automatically have `dev-bot` in your path. You can install it globally to do that, but typically instead I install it locally in my bots, and run the commands below from NPM scripts (which automatically include `./node_modules/bin`, where the DevBot CLI tool lives, in their path) with the relevant arguments pre-prepared.

Check out JokeBot's [package.json](https://github.com/jokebot/jokebot/blob/master/package.json) for an example of this all put together.

### Local manual testing

To quickly run your bot locally, simply run:

```bash
dev-bot run-once my-bot.js
```

This starts up the bot on your machine. Typically you'll want it to connect to Github, which means it'll need to make a call to `devBot.connectGithub`, and use some credentials. Rather than hardcoding these, I'd strongly recommend pulling them from process.env, and either including GITHUB_TOKEN in your environment directly, or specifying `--env env-file.env` on the command line, with `env-file.env` is in dotenv format (KEY=VALUE, newline separated).

The `--env` approach will helpfully set you up nicely for deployment, where you'll need to explicitly include a file with any environmental variables you need at runtime.

### Deployment

To actually deploy your bot, you'll need an AWS account, and your AWS credentials in the environment. For most projects you'll want to create a .env file in the root of your repo (**remember to .gitignore it!**) and `source .env` before these your commands, but to quickly test this you can just run:

```bash
export AWS_ACCESS_KEY_ID=AAAAAAAAAAAAAA
export AWS_SECRET_ACCESS_KEY=BBBBBBBBBBBBBBBBBBBBBBBBBBBBB

dev-bot aws-deploy myBotName my-bot.js
```

## Commands

`aws-deploy [botName] [entryPoint]`

Deploys a given bot to AWS. At a minimum it needs a name for the bot, and the script defining its interface. This bundles up the codebase, with its production dependencies and some DevBot wrapper code, uploads it to AWS Lambda, and starts it. 'Your codebase' is the current directory by default, or can be specified explicitly with `--root=[directory]`.

If a bot with the same name exists, it is replaced. If you don't specify a role with `--role=[roleName]`, or the role you do specify doesn't exist, one is automatically created with minimal default permissions. If you need more permissions, edit the role (`autogenerated-dev-bot-role`, by default) in the AWS console. By default, bots are created in `eu-west-1`, but you can specify a different region with `--region=[regionName]` when deploying.

You can also set environmental variables that will be available to your bot when running. To do so, create a dotenv format (KEY=VALUE, newline separated) file listing these values, and specify it when deploying with `--env [filename]`. In most cases this will be because you've got secrets you don't want to hardcode in your codebase, so they stay secret. Don't forget to .gitignore it!