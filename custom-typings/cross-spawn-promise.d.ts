/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/es6-promise/index.d.ts" />

declare module "cross-spawn-promise" {
    var spawn: (cmd: string, args?: string[], options?: {}) => Promise<Buffer>;

    export = spawn;
}
