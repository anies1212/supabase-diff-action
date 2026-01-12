import { Client } from 'pg';
import * as net from 'net';

// Patch net.connect to force IPv4
const originalConnect = net.connect.bind(net);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(net as any).connect = function (
  ...args: Parameters<typeof net.connect>
): net.Socket {
  const options = args[0];
  if (typeof options === 'object' && options !== null && 'host' in options) {
    (options as net.NetConnectOpts & { family?: number }).family = 4;
  }
  return originalConnect(...args);
};

export function createClient(connectionString: string): Client {
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}
