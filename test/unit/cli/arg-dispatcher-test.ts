import expect from "../../helpers/expect";
import sinon = require("sinon");

import { CliAction, CliArguments } from "../../../src/cli/arg-parsing";

import rewire = require("rewire");
import * as UnmockedModule from "../../../src/cli/arg-dispatcher";
let ArgDispatcherModule = rewire("../../../src/cli/arg-dispatcher");
let runCommand: typeof UnmockedModule.runCommand = (<any>ArgDispatcherModule).runCommand;

function deployArgs(overrides = {}): CliArguments {
    return Object.assign({
        action: CliAction.AwsDeploy,
        name: "test-bot",
        region: "eu-west-1"
    }, overrides);
}

describe("Arg dispatcher", () => {
    let deploy: sinon.SinonStub;
    let findEntryPoint: sinon.SinonStub;
    let cwd: sinon.SinonStub;

    beforeEach(() => {
        deploy = sinon.stub();
        findEntryPoint = sinon.stub();
        cwd = sinon.stub();

        ArgDispatcherModule.__set__('commands_1', { deploy });
        ArgDispatcherModule.__set__('bot_discovery_1', { findEntryPoint });
        ArgDispatcherModule.__set__('process', { cwd, env: {} });
    });

    it("uses the entry point and root given, if provided", async () => {
        await runCommand(deployArgs({ root: "/path", entryPoint: "bot.js" }));

        expect(deploy).to.have.been.calledWith("/path", "bot.js");
    });

    it("finds the entry point automatically, based on the provided root", async () => {
        findEntryPoint.withArgs("/provided-root").returns("found-entrypoint.js");

        await runCommand(deployArgs({ root: "/provided-root" }));

        expect(deploy).to.have.been.calledWith("/provided-root", "found-entrypoint.js");
    });

    it("uses the current directory as the root, if no root is provided, and finds the entry point from there", async () => {
        cwd.returns("/current/working/directory");
        findEntryPoint.withArgs("/current/working/directory").returns("entrypoint.js");

        await runCommand(deployArgs());

        expect(deploy).to.have.been.calledWith("/current/working/directory", "entrypoint.js");
    });
});
