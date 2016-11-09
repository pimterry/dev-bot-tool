import path = require("path");
import fs = require("fs-extra");
import pathIsInside = require("path-is-inside");

// Node 6.3+ has fs.constants.X, before that it's just fs.X
const FS_CONSTANTS = (<any> fs).constants || fs;

// Returns the path to the package.json for the given directory
export async function findRoot(startDirectory: string): Promise<string> {
    try {
        let packageJsonPath = await findPackageJson(startDirectory);
        return path.dirname(packageJsonPath);
    } catch (e) {
        throw new Error("Could not find a relevant package.json to define the project root. " + 
                        "Specify one manually with --root.");
    }
}

// Normalizes the current root if it's valid, throws an exception if not.
export async function normalizeAndVerifyRoot(rootDirectory: string): Promise<string> {
    let absoluteRoot = path.resolve(process.cwd(), rootDirectory);

    if (!await isDirectory(absoluteRoot)) {
        throw new Error(`The DevBot root (${absoluteRoot}) is not a directory`);
    } else if (!await isFileReadable(path.join(absoluteRoot, "package.json"))) {
        throw new Error(`The DevBot root (${absoluteRoot}) doesn't contain a readable package.json`);
    } else {
        return absoluteRoot;
    }
}

// Returns the path to the bot entry point, relative to the root.
// This will fail if there is no package.json in the root directory.
export async function findEntryPoint(rootDirectory: string): Promise<string> {
    let packageJsonPath = path.join(rootDirectory, "package.json");
    if (!await isFileReadable(packageJsonPath)) {
        throw new Error(`No package.json could be read in the root provided (${rootDirectory})`);
    }

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

async function findPackageJson(startDirectory: string): Promise<string> {
    let packageJsonPath = path.join(startDirectory, "package.json");
    if (await isFileReadable(packageJsonPath)) {
        return packageJsonPath;
    } else {
        let parentDirectory = path.join(startDirectory, "..");
        if (parentDirectory === startDirectory) {
            throw new Error(`Could not find package.json for ${startDirectory}`);
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

function isDirectory(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.stat(path, (error, stats) => {
            if (error) reject(error);
            else resolve(stats.isDirectory());
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
