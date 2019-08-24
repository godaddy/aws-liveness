declare module 'aws-liveness' {
  export interface ServiceProps {
    test(client: any): boolean;
    ping(client: any): Promise<any>;
  }

  export interface AWSLivenessProps {
    services?: ServiceProps[];
  }

  export interface PingParam {
    client: any;
  }

  export interface WaitForServicesParam {
    clients: any[];
    waitSeconds: number;
  }

  export class AWSLiveness {
    constructor(props?: AWSLivenessProps);
    ping(param: PingParam): Promise<any>;
    waitForServices(param: WaitForServicesParam): Promise<any>;
  }

  export default AWSLiveness;
}
