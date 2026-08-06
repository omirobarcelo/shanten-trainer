#!/usr/bin/env tsx
/**
 * Probe which oauth2 login `type` value works for the given credentials.
 * Tries candidates one by one. Stops on first success.
 *
 *   node --env-file=.env --import tsx scripts/probe-login.ts
 */

import { MahjongSoulClient } from '../src/lib/mahjongsoul';
import { configFromEnv } from './_env';

const CANDIDATES = [8, 10, 12, 11, 13, 7, 3, 0, 1, 2];

async function tryType(type: number, refreshProto = false): Promise<boolean> {
  const client = new MahjongSoulClient({ ...configFromEnv(), loginType: type, refreshProto });
  try {
    await client.connect();
    console.log(`type=${type}${refreshProto ? ' refreshProto' : ''} SUCCESS`);
    client.close();
    return true;
  } catch (err: any) {
    const code = err?.error?.code ?? err?.code;
    const dump = JSON.stringify(err, Object.getOwnPropertyNames(err));
    console.log(`type=${type}${refreshProto ? ' refreshProto' : ''} FAIL code=${code} — ${dump.slice(0, 400)}`);
    try { client.close(); } catch {}
    return false;
  }
}

async function main() {
  const cfg = configFromEnv();
  console.log(`base=${cfg.base}`);
  if (cfg.yostarToken) console.log(`using yostarToken (${cfg.yostarToken.slice(0, 6)}...) + yostarUid=${cfg.yostarUid}`);
  else console.log(`using accessToken (${cfg.accessToken!.slice(0, 8)}...)`);

  for (const t of CANDIDATES) {
    const ok = await tryType(t);
    if (ok) {
      console.log(`\nUse MJSOUL_LOGIN_TYPE=${t}`);
      process.exit(0);
    }
  }
  console.log('\n--- retrying type=8 with refreshProto=true ---');
  const ok8 = await tryType(8, true);
  if (ok8) {
    console.log('\nUse MJSOUL_LOGIN_TYPE=8 and refreshProto in client');
    process.exit(0);
  }
  console.log('\nNone worked. Check credentials or capture the browser WSS login frame for exact type.');
  process.exit(1);
}

main().catch(err => {
  console.error(err.stack ?? err);
  process.exit(1);
});
