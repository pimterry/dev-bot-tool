// TODO: Contribute this to the world (as a standalone typings repo, added to the registry?)
declare module "es6-promisify" {
    function promisify<T>(func: (callback: (err: any, result?: T) => void) => void): () => Promise<T>;
    function promisify<T, A1>(func: (arg1: A1, callback: (err: any, result?: T) => void) => void): (arg1: A1) => Promise<T>;
    function promisify<T, A1, A2>(func: (arg1: A1, arg2: A2, callback: (err: any, result?: T) => void) => void): (arg1: A1, arg2: A2) => Promise<T>;
    function promisify<T, A1, A2, A3>(func: (arg1: A1, arg2: A2, arg3: A3, callback: (err: any, result?: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3) => Promise<T>;
    function promisify<T, A1, A2, A3, A4>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, callback: (err: any, result?: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Promise<T>;
    function promisify<T, A1, A2, A3, A4, A5>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, callback: (err: any, result?: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Promise<T>;

    function promisify(nodeFunction: Function): Function;

    export = promisify;
}
