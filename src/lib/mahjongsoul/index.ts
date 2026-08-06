/**
 * Mahjong Soul API wrapper. Node-only.
 *
 * Usage:
 *   import { MahjongSoulClient, extractGameLog } from '$lib/mahjongsoul';
 *   const client = new MahjongSoulClient({
 *     accessToken: process.env.MJSOUL_ACCESS_TOKEN!,
 *     base: process.env.MJSOUL_BASE ?? 'https://game.mahjongsoul.com',
 *   });
 *   await client.connect();
 *   const raw = await client.fetchGameRecord('<uuid>');
 *   const log = extractGameLog(raw);
 *   client.close();
 *
 * Access token: log in on the Mahjong Soul web client, open devtools, run
 * `GameMgr.Inst.access_token` in the console, copy the value into env var
 * MJSOUL_ACCESS_TOKEN.
 */

export * from './types';
export * from './client';
export * from './extract';
export { fetchServerConfig, pickGateway } from './server-config';
