# mahjongsoul

Node-only wrapper around the Mahjong Soul WSS + protobuf API. Reverse-engineered — no official support, may break when Majsoul updates.

## Auth

No public API. You need an access token from a logged-in browser session:

1. Log in at https://game.mahjongsoul.com (JP) or https://mahjongsoul.game.yo-star.com (EN).
2. Open devtools console, run: `GameMgr.Inst.access_token`
3. Copy the string into `.env` as `MJSOUL_ACCESS_TOKEN`.

Token expires — grab a fresh one when the client fails to log in.

## Usage

```ts
import { MahjongSoulClient, extractGameLog, startingHandsForSeat } from '$lib/mahjongsoul';

const client = new MahjongSoulClient({
  accessToken: process.env.MJSOUL_ACCESS_TOKEN!,
  base: process.env.MJSOUL_BASE ?? 'https://game.mahjongsoul.com',
});

await client.connect();
const games = await client.listRecentGames(10);
const raw = await client.fetchGameRecord(games[0].uuid);
const log = extractGameLog(raw);
const myStartingHands = startingHandsForSeat(log, 0);
client.close();
```

## CLI scripts

- `npm run list-games -- [count]` — recent game UUIDs
- `npm run fetch-game -- <uuid>` — full log JSON

Both read `.env` via Node's `--env-file`.

## Why Node, not browser

Access tokens are secrets. Putting one in a `VITE_*` var would bake it into the browser bundle — public. Lib is Node-side; the trainer UI can consume saved JSON files or (later) call a small local API.

## ToS risk

Unofficial. Read-only log fetching has been done by community tools for years without reports of mass bans. Do not use for gameplay automation.
