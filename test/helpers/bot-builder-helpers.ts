import promisify = require("es6-promisify");
import fs = require("fs-extra");
import path = require("path");
import Zip = require("jszip");
import temp = require("temp");
temp.track();

import { LambdaHandler } from "../../src/aws/lambda-deployer";
import { BundleSpec } from "../../src/bundle";

import { sleep } from "./promise-helpers";

let outputFile = promisify<void, string, Buffer>(fs.outputFile);

export function createDevBot(entryPointCode: string): BundleSpec {
    let botFolder = temp.mkdirSync("dev-bot-code");
    let entryPoint = path.join(botFolder, "bot-entrypoint.js");

    fs.mkdirSync(path.join(botFolder, "node_modules"));
    linkDep(botFolder, "dev-bot");

    fs.writeFileSync(entryPoint, entryPointCode);

    return {
        rootDirectory: botFolder,
        entryPoint,
        env: {}
    };
}

function linkDep(botFolder: string, depName: string) {
    let sourcePath = path.resolve("node_modules", depName);
    let targetPath = path.join(botFolder, "node_modules", depName);

    if (fs.existsSync(targetPath)) return;
    if (!fs.existsSync(sourcePath)) return; // Skip missing deps - typically means we have them nested.

    fs.symlinkSync(sourcePath, targetPath, 'dir');

    let depPackageJson = require(`${depName}/package.json`);

    Object.keys(depPackageJson.dependencies).forEach((subDep) => {
        linkDep(botFolder, subDep);
    });
}

export async function extractToDisk(outputPath: string, zip: Zip): Promise<void> {
    let fileWrites = [];

    zip.forEach((relativePath, file) => {
        if (!file.dir) {
            let write = file.async("nodebuffer").then(
                (contents: Buffer) => {
                    var filePath = path.join(outputPath, file.name);
                    outputFile(filePath, contents);
                }
            );
            fileWrites.push(write);
        }
    });

    await Promise.all(fileWrites);
}

export async function buildHandler(bundle: Zip): Promise<LambdaHandler> {
    let unbundleFolder = temp.mkdirSync("dev-bot-bundle");
    await extractToDisk(unbundleFolder, bundle);

    let handlerPath = path.join(unbundleFolder, "dev-bot-handler.js");

    await sleep(500);
    return require(handlerPath);
}
