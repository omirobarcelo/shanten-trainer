#!/usr/bin/env tsx
/**
 * CLI: fetch one Mahjong Soul game record and print the extracted log as JSON.
 *
 *   node --env-file=.env --import tsx scripts/fetch-game.ts <game_uuid>
 */

import { MahjongSoulClient, extractGameLog } from '../src/lib/mahjongsoul';
import { configFromEnv } from './_env';

async function main() {
  const uuid = process.argv[2];
  if (!uuid) {
    console.error('usage: fetch-game.ts <game_uuid>');
    process.exit(1);
  }

  const client = new MahjongSoulClient(configFromEnv());
  try {
    await client.connect();
    const raw = await client.fetchGameRecord(uuid);
    const log = extractGameLog(raw);
    console.log(JSON.stringify(log, null, 2));
  } finally {
    client.close();
  }
}

main().catch(err => {
  console.error(err.stack ?? err);
  process.exit(1);
});
