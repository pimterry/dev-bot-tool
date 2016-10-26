import expect from "../helpers/expect";
import sinon = require("sinon");

import { CliAction, CliArguments } from "../../src/cli/arg-parsing";

import rewire = require("rewire");
import * as UnmockedModule from "../../src/bot-discovery";
let MockedModule = rewire("../../src/bot-discovery");
let BotDiscoveryModule: typeof UnmockedModule & typeof MockedModule = <any> MockedModule;
let findEntryPoint = BotDiscoveryModule.findEntryPoint;

function doesNotExistError() {
    return Object.assign(new Error("File doesn't exist"), { code: 'ENOENT' });
}

describe("Bot Discovery", () => {
    let readFile: sinon.SinonStub;
    let access: sinon.SinonStub;

    function givenFile(path: string, contents: string = "") {
        access.withArgs(path).yields(null);
        readFile.withArgs(path).yields(null, contents);
    }

    beforeEach(() => {
        readFile = sinon.stub().yields(doesNotExistError());
        access = sinon.stub().yields(doesNotExistError());

        BotDiscoveryModule.__set__('fs', { readFile, access, constants: {} });
    });

    it("finds the entrypoint from a package.json in the given directory", async () => {
        givenFile("/given-root/package-entrypoint.js");
        givenFile("/given-root/package.json", JSON.stringify({
            "main": "package-entrypoint.js"
        }));

        let entryPoint = await findEntryPoint("/given-root");

        expect(entryPoint).to.equal("package-entrypoint.js");
    });

    it("finds the entrypoint from a package.json in the parent directory", async () => {
        givenFile("/parent/given-root/parent-folder-entrypoint.js");
        givenFile("/parent/package.json", JSON.stringify({
            "main": "given-root/parent-folder-entrypoint.js"
        }));

        let entryPoint = await findEntryPoint("/parent/given-root/");

        expect(entryPoint).to.equal("parent-folder-entrypoint.js");
    });

    it("fails if the entry point package.json points to doesn't exist", async () => {
        givenFile("/root/package.json", JSON.stringify({
            "main": "package-entrypoint.js"
        }));

        let expectedError = "Entry point specified in package.json (/root/package-entrypoint.js) could not be read";
        await expect(findEntryPoint("/root")).to.be.rejectedWith(expectedError);
    });

    it("fails if the entry point package.json is outside the given root", async () => {
        givenFile("/package-entrypoint.js");
        givenFile("/package.json", JSON.stringify({
            "main": "package-entrypoint.js"
        }));

        let expectedError = "Entry point specified by package.json (/package-entrypoint.js) is outside the bot root (/root)";
        await expect(findEntryPoint("/root")).to.be.rejectedWith(expectedError);
    });

    it("fails if no package.json can be found", async () => {
        let expectedError = "Could not find package.json to read entry point from";
        await expect(findEntryPoint("/parent/given-root/")).to.be.rejectedWith(expectedError);
    });

    it("fails if it finds a package.json with no main field", async () => {
        givenFile("/package.json", JSON.stringify({ }));

        let expectedError = "Package.json found, but with no 'main' field to use as an entry point";
        await expect(findEntryPoint("/")).to.be.rejectedWith(expectedError);
    });
});
