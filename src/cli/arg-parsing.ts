import docopt = require("docopt");

export interface CliArguments {
    action: CliAction;
    name: string;
    region: string;

    entryPoint?: string;
    root?: string;
    env?: string;
    role?: string;
}

export enum CliAction {
    AwsDeploy,
    RunOnce
}

const doc = `
Usage:
    dev-bot run-once [--env=deploy.env] [--root=<root_directory>] [--entrypoint=<entry-point.js>]
    dev-bot aws-deploy <name> [--entrypoint=<entry_point>] [--region=<region>] [--root=<root_directory>]
                                           [--role=<role_name>] [--env=deploy.env]
    dev-bot -h | --help

Options:
    -h, --help                 Print this help message

    --region <region>          The AWS region to use [default: eu-west-1]
    --root <root_directory>    The bot's root directory [default: ./]
    --entrypoint <entry_point> The bot's entry point [default: 'main' in the first package.json above the root]
    --role <role_name>         The AWS role to use [default: create one automatically]
    --env <env-vars-file>      A dotenv file, containing environmental variables to include at runtime
`;

export function parseArgs(argv: string[]): CliArguments {
    let result = docopt.docopt(doc, {
        argv: argv.slice(2),
        help: true,
        exit: false
    });

    let action = result["aws-deploy"] ? CliAction.AwsDeploy :
                 result["run-once"] ? CliAction.RunOnce :
                 null;

    return {
        action: action,
        name: result["<name>"],

        region: result["--region"] || "eu-west-1",
        entryPoint: result["--entrypoint"] || null,
        root: result["--root"] || null,
        env: result["--env"] || null,
        role: result["--role"] || null
    };
}
