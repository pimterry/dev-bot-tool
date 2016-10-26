import HttpServerMock = require("http-server-mock");

import path = require("path");
import spawn = require("cross-spawn-promise");

const DEV_BOT_ROOT = (process.env.DEV_BOT_ROOT || path.resolve(__dirname, "..", "..", "..", ".."));
const CLI_SCRIPT_PATH = DEV_BOT_ROOT + "/dist/src/cli/cli.js";

// Runs the tool with given arguments, promisified
export default async function runWithEnv(envAdditions: {}, ...args: string[]): Promise<string> {
    try {
        let botDirectory = path.resolve(DEV_BOT_ROOT, "test", "fixtures", "minimal-bot");
        let stdout = await spawn(
            process.execPath,
            [CLI_SCRIPT_PATH].concat(args),
            {
                env: Object.assign({}, process.env, {
                    AWS_ACCESS_KEY_ID: "AAAAAAAAAAAAAAAAAAAA",
                    AWS_SECRET_ACCESS_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                }, envAdditions),
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
