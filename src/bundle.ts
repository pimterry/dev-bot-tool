/// <reference path="./injected-code/dev-bot-handler.ts" />
// TODO: Find a more elegant way to make sure the above is included in dist/test/src

import fs = require("fs-extra");
import promisify = require("es6-promisify");
import path = require("path");
import Zip = require("jszip");

let readFile = promisify<string, string, string>(fs.readFile);

const HANDLER_PATH = path.join(__dirname, "handler.js");

export interface BundleSpec {
    rootDirectory: string;
    entryPoint: string;
    env: { [id: string]: string };
}

async function includeFolder(folderPath: string, bundle: Zip, pathPrefix?: string): Promise<void> {
    var folderWalk = fs.walk(folderPath);

    let outstandingReads = [];

    let walkFinished: Promise<any> = new Promise((resolve) => folderWalk.on('end', resolve));
    folderWalk.on('data', walkFile);

    function walkFile(file) {
        let relPath = path.join(pathPrefix || "", path.relative(folderPath, file.path));

        if (file.stats.isFile()) {
            outstandingReads.push(
                readFile(file.path, "utf8").then((data) => bundle.file(relPath, data))
            );
        } else if (file.stats.isSymbolicLink()) {
            // Walk() doesn't follow symlinks by default, so we have to explicitly do so here.
            // Note that we don't handle loops - your build will run infinitely if you have looping
            // symlinks. Don't do that.
            let linkTarget = path.resolve(path.dirname(file.path), fs.readlinkSync(file.path));
            outstandingReads.push(
                includeFolder(linkTarget, bundle, relPath)
            );
        }
    }

    await walkFinished;
    await Promise.all(outstandingReads);
}

export async function buildBundle(bundleSpec: BundleSpec): Promise<Zip> {
    let bundle = new Zip();

    await includeFolder(bundleSpec.rootDirectory, bundle);
    await includeFolder(path.join(__dirname, "injected-code"), bundle);

    bundle.file("dev-bot-bundle-config.json", JSON.stringify({
        entryPoint: bundleSpec.entryPoint,
        env: bundleSpec.env
    }));

    return bundle;
}
