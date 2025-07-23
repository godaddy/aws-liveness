export interface Service<Client = unknown, Return = unknown> {
  test: (client: unknown) => client is Client;
  ping: (client: Client) => Promise<Return>;
}

export interface AWSLivenessOptions<Client> {
  services?: Array<Service<Client>>;
}

export interface PingOptions<Client> {
  client: Client;
}

export interface WaitForServicesOptions<Client> {
  clients: Array<Client>;
  waitSeconds: number;
}

export default class AWSLiveness<Client> {
  constructor(options?: AWSLivenessOptions<Client>);
  ping(options: PingOptions<Client>): Promise<unknown>;
  waitForServices(options: WaitForServicesOptions<Client>): Promise<unknown[]>;
}
