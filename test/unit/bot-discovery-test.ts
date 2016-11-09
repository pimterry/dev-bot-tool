import expect from "../helpers/expect";
import sinon = require("sinon");

import { CliAction, CliArguments } from "../../src/cli/arg-parsing";

import rewire = require("rewire");
import * as UnmockedModule from "../../src/bot-discovery";
let MockedModule = rewire("../../src/bot-discovery");
let BotDiscoveryModule: typeof UnmockedModule & typeof MockedModule = <any> MockedModule;
let findEntryPoint = BotDiscoveryModule.findEntryPoint;
let findRoot = BotDiscoveryModule.findRoot;
let normalizeAndVerifyRoot = BotDiscoveryModule.normalizeAndVerifyRoot;


function doesNotExistError() {
    return Object.assign(new Error("File doesn't exist"), { code: 'ENOENT' });
}

describe("Bot Discovery", () => {
    let cwd: string;
    let readFile: sinon.SinonStub;
    let access: sinon.SinonStub;
    let stat: sinon.SinonStub;

    function givenFile(path: string, contents: string = "") {
        access.withArgs(path).yields(null);
        readFile.withArgs(path).yields(null, contents);
        stat.withArgs(path).yields(null, { isDirectory: () => false });
    }

    beforeEach(() => {
        cwd = "/";
        readFile = sinon.stub().yields(doesNotExistError());
        access = sinon.stub().yields(doesNotExistError());
        stat = sinon.stub().yields(null, { isDirectory: () => true });

        BotDiscoveryModule.__set__('fs', { readFile, access, stat, constants: {} });
        BotDiscoveryModule.__set__('process', { cwd: () => cwd });
    });

    describe("findRoot", async () => {
        it("returns the current directory if it contains a package.json", async () => {
            givenFile("/path/package.json");

            let root = await findRoot("/path");

            expect(root).to.equal("/path");
        });

        it("returns the parent directory if the package.json is there", async () => {
            givenFile("/path/package.json");

            let root = await findRoot("/path/subfolder");

            expect(root).to.equal("/path");
        });

        it("returns the current directory if it and the parent have a package.json", async () => {
            givenFile("/path/package.json");
            givenFile("/path/subfolder/package.json");

            let root = await findRoot("/path/subfolder");

            expect(root).to.equal("/path/subfolder");
        });

        it("fails if there is no package.json", async () => {
            let expectedError = "Could not find a relevant package.json to define the project root. Specify one manually with --root.";
            await expect(findRoot("/root")).to.be.rejectedWith(expectedError);
        });
    });

    describe("normalizeAndVerifyRoot", async () => {
        it("succeeds if a package.json exists", async () => {
            givenFile("/root/package.json");

            let root = await normalizeAndVerifyRoot("/root");

            expect(root).to.equal("/root");
        });

        it("makes the given path absolute", async () => {
            cwd = "/current/directory";
            givenFile("/current/directory/subfolder/package.json");

            let root = await normalizeAndVerifyRoot("./subfolder");

            expect(root).to.equal("/current/directory/subfolder");
        });

        it("fails if the root provided is a file, not a folder", async () => {
            givenFile("/package.json");

            let expectedError = "The DevBot root (/package.json) is not a directory";
            await expect(normalizeAndVerifyRoot("/package.json")).to.be.rejectedWith(expectedError);
        });

        it("fails if no package.json exists", async () => {
            let expectedError = "The DevBot root (/root) doesn't contain a readable package.json";
            await expect(normalizeAndVerifyRoot("/root")).to.be.rejectedWith(expectedError);
        });
    });

    describe("findEntryPoint", () => {
        it("finds the entrypoint from a package.json in the given directory", async () => {
            givenFile("/given-root/package-entrypoint.js");
            givenFile("/given-root/package.json", JSON.stringify({
                "main": "package-entrypoint.js"
            }));

            let entryPoint = await findEntryPoint("/given-root");

            expect(entryPoint).to.equal("package-entrypoint.js");
        });

        it("fails if the entry point the package.json points to doesn't exist", async () => {
            givenFile("/root/package.json", JSON.stringify({
                "main": "package-entrypoint.js"
            }));

            let expectedError = "Entry point specified in package.json (/root/package-entrypoint.js) could not be read";
            await expect(findEntryPoint("/root")).to.be.rejectedWith(expectedError);
        });

        it("fails if the entry point package.json is outside the given root", async () => {
            givenFile("/package-entrypoint.js");
            givenFile("/root/package.json", JSON.stringify({
                "main": "../package-entrypoint.js"
            }));

            let expectedError = "Entry point specified by package.json (/package-entrypoint.js) is outside the bot root (/root)";
            await expect(findEntryPoint("/root")).to.be.rejectedWith(expectedError);
        });

        it("fails if no package.json can be found", async () => {
            let expectedError = "No package.json could be read in the root provided (/parent/given-root)";
            await expect(findEntryPoint("/parent/given-root")).to.be.rejectedWith(expectedError);
        });

        it("doesn't search outside the root directory for package.json", async () => {
            givenFile("/parent/given-root/parent-folder-entrypoint.js");
            givenFile("/parent/package.json", JSON.stringify({
                "main": "given-root/parent-folder-entrypoint.js"
            }));

            let expectedError = "No package.json could be read in the root provided (/parent/given-root)";
            await expect(findEntryPoint("/parent/given-root")).to.be.rejectedWith(expectedError);
        });

        it("fails if it finds a package.json with no main field", async () => {
            givenFile("/package.json", JSON.stringify({ }));

            let expectedError = "Package.json found, but with no 'main' field to use as an entry point";
            await expect(findEntryPoint("/")).to.be.rejectedWith(expectedError);
        });
    });
});
