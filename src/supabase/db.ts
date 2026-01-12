import { Client } from 'pg';
import * as dns from 'dns';
import * as core from '@actions/core';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);
const resolve4 = promisify(dns.resolve4);

async function resolveToIPv4(hostname: string): Promise<string> {
  core.info(`Resolving hostname: ${hostname}`);

  // Try resolve4 first (only returns A records)
  try {
    const addresses = await resolve4(hostname);
    if (addresses.length > 0) {
      core.info(`Resolved to IPv4: ${addresses[0]}`);
      return addresses[0];
    }
  } catch (err) {
    core.warning(`resolve4 failed: ${err}`);
  }

  // Fallback to lookup with family: 4
  try {
    const result = await lookup(hostname, { family: 4 });
    core.info(`Lookup resolved to: ${result.address} (family: ${result.family})`);
    return result.address;
  } catch (err) {
    core.error(`IPv4 lookup failed for ${hostname}: ${err}`);
    throw new Error(
      `Failed to resolve ${hostname} to IPv4. The host may only have IPv6 records. ` +
        `GitHub Actions runners do not support IPv6. ` +
        `Please use a direct connection URL (db.[ref].supabase.co) instead of the pooler.`
    );
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
