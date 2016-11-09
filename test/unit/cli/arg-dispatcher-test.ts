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
    let findRoot: sinon.SinonStub;
    let normalizeAndVerifyRoot: sinon.SinonStub;
    let cwd: sinon.SinonStub;

    beforeEach(() => {
        deploy = sinon.stub();
        findEntryPoint = sinon.stub();
        findRoot = sinon.stub();
        normalizeAndVerifyRoot = sinon.stub().returnsArg(0);
        cwd = sinon.stub();

        ArgDispatcherModule.__set__('commands_1', { deploy });
        ArgDispatcherModule.__set__('bot_discovery_1', { findEntryPoint, findRoot, normalizeAndVerifyRoot });
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

    it("automatically finds the root, if one isn't provided, and finds the entry point from there", async () => {
        cwd.returns("/current/working/directory");
        findRoot.withArgs("/current/working/directory").returns("/current");
        findEntryPoint.withArgs("/current").returns("entrypoint.js");

        await runCommand(deployArgs());

        expect(deploy).to.have.been.calledWith("/current", "entrypoint.js");
    });
});
