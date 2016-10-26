declare module "path-is-inside" {
    function isPathInside(path: string, potentialParent: string): boolean;
    export = isPathInside;
}
