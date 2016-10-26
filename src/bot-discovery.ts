import path = require("path");
import fs = require("fs-extra");
import pathIsInside = require("path-is-inside");

// Node 6.3+ has fs.constants.X, before that it's just fs.X
const FS_CONSTANTS = (<any> fs).constants || fs;

// Returns the path to the bot entry point, relative to the bot root
export async function findEntryPoint(rootDirectory: string): Promise<string> {
    let packageJsonPath = await findPackageJson(rootDirectory);

    let packageJson = JSON.parse(await readFile(packageJsonPath));
    if (!packageJson.main) throw new Error("Package.json found, but with no 'main' field to use as an entry point");

    let entryPointPath = path.resolve(path.dirname(packageJsonPath), packageJson.main);

    if (!await isFileReadable(entryPointPath)) {
        throw new Error(`Entry point specified in package.json (${entryPointPath}) could not be read`);
    }

    if (!pathIsInside(entryPointPath, rootDirectory)) {
        throw new Error(`Entry point specified by package.json (${entryPointPath}) is outside the bot root (${rootDirectory})`);
    }

    return path.relative(rootDirectory, entryPointPath);
}

async function findPackageJson(rootDirectory: string): Promise<string> {
    let packageJsonPath = path.join(rootDirectory, "package.json");
    if (await isFileReadable(packageJsonPath)) {
        return packageJsonPath;
    } else {
        let parentDirectory = path.join(rootDirectory, "..");
        if (parentDirectory === rootDirectory) {
            throw new Error("Could not find package.json to read entry point from");
        }

        return findPackageJson(parentDirectory);
    }
}

function readFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, "utf-8", (error, data) => {
            if (error) reject(error);
            else resolve(data);
        });
    });
}

function isFileReadable(path: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.access(path, FS_CONSTANTS.R_OK, (error) => {
            resolve(!error);
        });
    });
}
