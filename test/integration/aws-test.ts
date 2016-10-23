import HttpServerMock = require("http-server-mock");
import path = require("path");
import spawn = require("cross-spawn-promise");

import expect from "../expect";
import * as awsMock from "../aws-mocks";

const DEV_BOT_ROOT = (process.env.DEV_BOT_ROOT || path.resolve(__dirname, "..", "..", "..", ".."));
const CLI_SCRIPT_PATH = DEV_BOT_ROOT + "/dist/src/cli/cli.js";
const server = new HttpServerMock();

// Runs the tool with given arguments, promisified
async function run(...args: string[]): Promise<string> {
    try {
        let botDirectory = path.resolve(__dirname, "..", "fixtures", "minimal-bot");
        let stdout = await spawn(
            process.execPath,
            [CLI_SCRIPT_PATH].concat(args),
            {
                env: Object.assign({}, process.env, {
                    AWS_ACCESS_KEY_ID: "AAAAAAAAAAAAAAAAAAAA",
                    AWS_SECRET_ACCESS_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                    HTTP_PROXY: server.url,
                    HTTPS_PROXY: server.url
                }),
                cwd: botDirectory
            }
        );
        return stdout.toString();
    } catch (error) {
        if (error.exitStatus) {
            throw new Error(`Returned status: ${error.exitStatus}\n\n${error.stderr.toString()}`);
        } else {
            throw new Error(`Failed to run dev-bot: ${error}`);
        }
    }
}

describe("Dev-Bot tool AWS deploy", function () {
    this.timeout(5000);

    let iam: awsMock.IamMock;
    let lambda: awsMock.LambdaMock;
    let events: awsMock.CloudWatchEventsMock;

    beforeEach(() => {
        server.start();

        iam = new awsMock.IamMock(server);
        lambda = new awsMock.LambdaMock(server);
        events = new awsMock.CloudWatchEventsMock(server);
    });

    afterEach(() => {
        server.stop();
    });

    it("pushes a new bot to lambda, if the bot doesn't exist", async () => {
        iam.onGetRole("autogenerated-dev-bot-role").findRole();

        lambda.onGetFunction("testbot").dontFindFunction();
        lambda.onCreateFunction("testbot").succeedWithArn("arn:new-bot");

        events.onListRuleNamesByTarget("arn:new-bot").findNoRuleNames();
        events.onPutRule("dev-bot-trigger-testbot", {
            ScheduleExpression: "rate(1 minute)"
        }).succeedWithArn("arn:new-role");
        lambda.onAddPermission("arn:new-bot", "lambda:InvokeFunction", "events.amazonaws.com").succeed();
        events.onPutTargets("dev-bot-trigger-testbot", {Arn: "arn:new-bot"}).succeed();

        let output = await run("aws-deploy", "testbot", "qwe.js");

        expect(output).to.include("Deploying testbot to AWS");
        expect(output).to.match(/\nDone.\n$/);
    });

    it("updates lambda with the new code, if the bot already exits", async () => {
        iam.onGetRole("autogenerated-dev-bot-role").findRole();
        lambda.onGetFunction("testbot").findFunction("arn:updated-bot");
        lambda.onUpdateFunctionCode("testbot").succeed();
        events.onListRuleNamesByTarget("arn:updated-bot").findRuleNames(["dev-bot-trigger"]);

        let output = await run("aws-deploy", "testbot", "qwe.js");

        expect(output).to.include("Deploying testbot to AWS");
        expect(output).to.match(/\nDone.\n$/);
    });

    // TODO: Test help & version (since we can't unit test them)
});
