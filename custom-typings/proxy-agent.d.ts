// From https://github.com/types/npm-proxy-agent/blob/master/index.d.ts
// TODO: contribute to DT, and eventually depend on this through @types
declare module "proxy-agent" {
  import { Agent } from 'http';

  class ProxyAgent extends Agent {
    constructor (uri: string | { protocol: string; hostname?: string; host?: string; port?: string; proxies?: any });

    static proxies: { [key: string]: typeof Agent };
  }

  export = ProxyAgent;
}
