import { Client, ClientConfig } from 'pg';
import * as dns from 'dns';

// Force IPv4 resolution for DNS lookups
dns.setDefaultResultOrder('ipv4first');

export function createClient(connectionString: string): Client {
  const config: ClientConfig = {
    connectionString,
  };

  return new Client(config);
}
