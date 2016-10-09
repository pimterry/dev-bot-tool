import fs = require("fs-extra");
import dotenv = require("dotenv");
import promisify = require("es6-promisify");

const readFile = promisify<string, string, string>(fs.readFile);

import { CliArguments, CliAction } from "./arg-parsing";
import { AwsCredentials } from "../aws/aws";

import { deploy, runOnce } from "./commands";

export async function runCommand(args: CliArguments): Promise<void> {
    let credentials: AwsCredentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }

    if (args.action === CliAction.AwsDeploy) {
        console.log(`Deploying ${args.name} to AWS`);

        return deploy(
            args.root,
            args.entrypoint,
            args.name,
            args.region,
            credentials,
            args.role,
            await buildEnv(args.env)
        );
    } else if (args.action === CliAction.RunOnce) {
        console.log(`Running ${args.entrypoint}`);

        return runOnce(
            args.entrypoint,
            await buildEnv(args.env)
        );
    } else {
        throw new Error("Unrecognized CLI action");
    }
}

async function buildEnv(envFile: string): Promise<{ [id: string]: string }> {
    if (!envFile) return <{ [id: string]: string }> {};
    return dotenv.parse(await readFile(envFile, "utf8"));
}