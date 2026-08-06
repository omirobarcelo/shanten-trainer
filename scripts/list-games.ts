#!/usr/bin/env tsx
/**
 * CLI: list recent Mahjong Soul games for the authenticated account.
 *
 *   node --env-file=.env --import tsx scripts/list-games.ts [count]
 */

import { MahjongSoulClient } from '../src/lib/mahjongsoul';
import { configFromEnv } from './_env';

async function main() {
  const count = parseInt(process.argv[2] ?? '10', 10);
  const client = new MahjongSoulClient(configFromEnv());
  try {
    await client.connect();
    const games = await client.listRecentGames(count);
    for (const g of games) {
      console.log(`${g.uuid}\t${new Date((g.start_time ?? 0) * 1000).toISOString()}`);
    }
  } finally {
    client.close();
  }
}

main().catch(err => {
  console.error(err.stack ?? err);
  process.exit(1);
});
