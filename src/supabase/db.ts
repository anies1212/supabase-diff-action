import { Client } from 'pg';
import * as dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

async function resolveToIPv4(hostname: string): Promise<string> {
  try {
    const result = await lookup(hostname, { family: 4 });
    return result.address;
  } catch {
    return hostname;
  }
}

export async function createClientWithIPv4(
  connectionString: string
): Promise<Client> {
  const url = new URL(connectionString);
  const ipv4Address = await resolveToIPv4(url.hostname);

  return new Client({
    user: url.username,
    password: decodeURIComponent(url.password),
    host: ipv4Address,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });
}
