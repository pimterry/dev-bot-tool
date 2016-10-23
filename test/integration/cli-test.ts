import HttpServerMock = require("http-server-mock");

import expect from "../helpers/expect";
import * as awsMock from "../helpers/aws-mocks";
import runWithEnv from "../helpers/tool-runner-helpers";

const run = (...args: string[]) => runWithEnv({}, ...args);

describe("Dev-Bot tool CLI interface", function () {
    this.timeout(2000);

    it("shows the basic help when run without arguments", async () => {
        let output = await run().catch(e => e.message);

        expect(output).to.include("Usage:");
        expect(output).not.to.include("Options:");
    });

    it("shows the detailed help (including options) when asked", async () => {
        let output = await run("--help").catch(e => e.message);

        expect(output).to.include("Usage:");
        expect(output).to.include("Options:");
    });
});
