# DevBot Tool [![Build Status](https://travis-ci.org/pimterry/dev-bot-tool.png)](https://travis-ci.org/pimterry/dev-bot-tool)

**[DevBot](https://github.com/pimterry/dev-bot) is a framework to build chat-bot-based developer tooling.**

This is a command line tool to manage your DevBots, so you can run them locally, host them for free (typically) on AWS Lambda, and generally get things done.

Take a look at [DevBot](https://github.com/pimterry/dev-bot) for more info on how to build bots themselves. For the rest of this readme, I'm going to assume you're totally on that, and you've got at least the start of a bot ready and waiting.

## Getting Started

With your bot ready, install the DevBot tool:

```javascript
npm install --save-dev dev-bot-tool
```

Note that this doesn't automatically put `dev-bot` in your PATH. You can install it globally to do that, but typically instead I install it locally in my bots, and run the commands below from NPM scripts (which automatically include `./node_modules/bin`, where a locally installed DevBot CLI tool lives, in their PATH) with the relevant arguments pre-prepared.

Check out JokeBot's [package.json](https://github.com/jokebot/jokebot/blob/master/package.json) for an example of this all put together.

### Local manual testing

To quickly run your bot locally, simply run:

```bash
dev-bot run-once
```

This starts up the bot on your machine, does a quick run to check for mentions or other immediate actions, and then shuts down again.

Typically you'll want it to connect to Github, which means it'll need to make a call to `devBot.connectGithub` with some credentials. Rather than hardcoding these, you should pull from `process.env` - see [environmental variables](#environmental-variables) below for details on how to do this nicely.

See [the full run-once documentation](#run-once) below for more details about this command.

### Deployment

To actually deploy your bot, you'll need an AWS account, and your AWS credentials in the environment. For many projects you'll want to do this with a .env file in the root of your repo (**remember to .gitignore it!**) and with `source .env` before these your commands. To quickly test this though you can just run:

```bash
export AWS_ACCESS_KEY_ID=AAAAAAAAAAAAAA
export AWS_SECRET_ACCESS_KEY=BBBBBBBBBBBBBBBBBBBBBBBBBBBBB

dev-bot aws-deploy myBotName
```

See [the full aws-deploy documentation](#aws-deploy-botname) below for more details about this command.

## Commands

#### `dev-bot aws-deploy [botName]`

Deploys a given bot to AWS. At a minimum it needs a name for the bot. This bundles up the codebase, with its production dependencies and some DevBot wrapper code, uploads it to AWS Lambda, and starts it. The root directory and entry point are found using [the standard rules](#Bot-root-folder-and-entry-point).

If a bot with the same name exists, it is replaced. If you don't specify a role with `--role [roleName]`, or the role you do specify doesn't exist, one is automatically created with default permissions. If you need more permissions, just edit the role (`autogenerated-dev-bot-role`, by default) in the AWS console. By default, bots are created in `eu-west-1`, but you can specify a different region with `--region [regionName]` when deploying.

As with all commands here, you can specify a file of environmental variables that you'd like to be available to this bot at runtime with `--env`. See [environmental variables](#environmental-variables) for more details. AWS Lambda doesn't actually directly support specifying environmental variables, so here your variables are automatically loaded on deploy by [dotenv](https://npmjs.com/package/dotenv), added to the deployed bundle's config, then loaded into `process.env` at runtime later, before your bot is loaded.

#### `dev-bot run-once`

Runs a bot once locally, checking if there's anything to handle immediately, and stopping when it's complete. The bot's root directory and entry point are found using [the standard rules](#Bot-root-folder-and-entry-point).

This runs DevBot as it will be run when deployed, but notably doesn't simulate a full AWS environment or anything like that. If you do have your AWS credentials in your environment you can potentially still connect to your AWS services though, depending on their configuration.

You can also set environmental variables that will be available to your bot when running, in exactly the same way you can when deploying. See [environmental variables](#environmental-variables) for the details of how this works.

## More details

### Environmental variables

You will almost always have some values that you don't want to hardcode into your project, but you do want to use when running your bot locally, or when deploying it. Your Github authentication token and login details for other services you might be talking to are easy examples.

This tool has support for handling environmental variables built in. To make variables available to your bot when executing or deploying it, create a file in dotenv format (KEY=VALUE, newline separated) and pass it on the command line with `--env`. It's strongly recommended you include this file in your .gitignore, so you don't accidentally commit it.

For example:

*bot.env*

```
GITHUB_TOKEN=123abc
MORE_SECRETS=secret!
```

You can deploy this with `dev-bot aws-deploy myBot --env bot.env`, or run it locally with `dev-bot run-local --env bot.env`. Inside your bot GITHUB_TOKEN and MORE_SECRETS will be available in `process.env`.

### Bot root folder and entry point

To deploy a bot or run it locally, we need to know what files are included, and which script the DevBot framework needs to be talking to. **Most of the time, you shouldn't have to worry about any of this**. Create a npm project, install whatever dependencies you need, point `main` at the entry point of your bot, and run this tool from within that project.

If you're doing something more complicated though, the gory details are below. These rules are intended to work as much like normal npm publishing as possible.

We first need a root directory, so the tool can read your npm config &mdash; by default this is the first parent folder of the current directory with a package.json file, or you can specify a directory manually with `--root <root_directory>`. The root folder must contain a package.json file.

We also need an entry point module, which exports the methods DevBot will call into. This is the script that the `main` property in your package.json points to, by default. You can override this with `--entrypoint <my-bot.js>`. This should be relative to the root directory.

Which individual files count as part of the bot's codebase and should be deployed is worked out with exactly the same rules as npm, plus your dependencies. I.e. by default every file within the root folder is included, or only the files specified by the [`files`](https://docs.npmjs.com/files/package.json#files) property in your package.json if you have one. Files are then ignored by any patterns you have specified in [.npmignore](https://docs.npmjs.com/misc/developers#keeping-files-out-of-your-package) if you have one, or .gitignore if you don't (or not ignored at all, if you have neither). We then diverge from normal npm publishing rules by also including everything in your current `node_modules` directory too.

If you need to deploy code and .gitignore it (for example, because it's generated automatically), npm's packaging rules can catch you out &mdash; by default .gitignore'd files aren't included, so aren't deployed. You can override this by just creating an empty .npmignore, which will be used instead.
