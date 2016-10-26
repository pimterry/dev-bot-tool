import path = require("path");
import temp = require("temp");
temp.track();

import expect from "../helpers/expect";
import { createDevBot, extractToDisk, buildHandler } from "../helpers/bot-builder-helpers";

import { buildBundle, BundleSpec } from "../../src/bundle";

describe("DevBot bundling", function () {
    this.timeout(5000);

    it("can build a deployable zip", async () => {
        let testBot = createDevBot("exports.isTestBot = true");

        let bundle = await buildBundle(testBot);

        let handler = await buildHandler(bundle);
        expect(handler).not.to.equal(null);
    });

    it("automatically finds the entry point and project root", async () => {
        let testBot = createDevBot("exports.isTestBot = true");

        let bundle = await buildBundle(testBot);

        let handler = await buildHandler(bundle);
        expect(handler).not.to.equal(null);
    });

    afterEach(function () {
        if (this.currentTest.state === 'failed') {
            temp.track(false);
        }
    });
});
