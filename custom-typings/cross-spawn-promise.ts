declare module "cross-spawn-promise" {
    var spawn: (cmd: string, args?: string[], options?: {}) => Promise<Buffer>;

    export = spawn;
}
