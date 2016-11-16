import HttpServerMock = require("http-server-mock");

import expect from "../helpers/expect";
import runWithEnv from "../helpers/tool-runner-helpers";

const server = new HttpServerMock();
const run = (...args: string[]) => runWithEnv(
    Object.assign({}, server.proxyEnv, { GITHUB_TOKEN: "ABC" }),
    ...args
);

describe("Dev-Bot tool run-once", function () {
    this.timeout(2000);

    beforeEach(async () => {
        await server.start();
    });

    afterEach(async () => {
        await server.stop();
    });

    it("automatically finds the bot entrypoint", async () => {
        let output = await run("run-once");
        expect(output).to.include("Running start.js");
    });
});
