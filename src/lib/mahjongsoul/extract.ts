/**
 * Extract structured info (starting hands, dora, players) from a raw game
 * record returned by MahjongSoulClient.fetchGameRecord().
 */

import type { RawGameRecord } from './client';
import type { GameLog, RoundLog, StartingHand } from './types';
import type { Hand, Tile } from '../mahjong/types';
import { Suit } from '../mahjong/types';

/**
 * Convert a majsoul tile string ("1m", "0p", "1z") to our Tile.
 * Majsoul: 0-9 for numbered (0=red 5), 1-7 for honors — matches our Tile schema.
 */
export function majsoulTileToTile(s: string): Tile {
  if (s.length !== 2) throw new Error(`bad tile: ${s}`);
  const value = parseInt(s[0], 10);
  const suit = s[1] as Suit;
  if (Number.isNaN(value)) throw new Error(`bad tile value: ${s}`);
  if (!Object.values(Suit).includes(suit)) throw new Error(`bad suit: ${s}`);
  return { suit, value };
}

export function majsoulTilesToHand(tiles: string[]): Hand {
  return tiles.map(majsoulTileToTile);
}

export function extractGameLog(raw: RawGameRecord): GameLog {
  const head = raw.head ?? {};
  const uuid: string = head.uuid ?? '';
  const players = (head.accounts ?? []).map((a: any) => ({
    seat: a.seat ?? 0,
    accountId: a.account_id ?? 0,
    nickname: a.nickname ?? '',
  }));

  const rounds: RoundLog[] = [];
  for (const action of raw.data) {
    if (action.name !== '.lq.RecordNewRound') continue;
    const d = action.data;
    const chang: number = d.chang ?? 0;
    const ju: number = d.ju ?? 0;
    const ben: number = d.ben ?? 0;
    const hands: StartingHand[] = [0, 1, 2, 3].map(seat => ({
      round: chang * 4 + ju,
      chang,
      ju,
      ben,
      seat,
      tiles: (d[`tiles${seat}`] ?? []) as string[],
    }));
    rounds.push({
      round: chang * 4 + ju,
      chang,
      ju,
      ben,
      hands,
      doraIndicator: d.dora || (d.doras && d.doras[0]) || undefined,
    });
  }

  return { uuid, players, rounds };
}

/** Convenience: get the starting hand for a specific seat across all rounds. */
export function startingHandsForSeat(log: GameLog, seat: number): Hand[] {
  return log.rounds.map(r => {
    const h = r.hands.find(x => x.seat === seat);
    if (!h) throw new Error(`no hand for seat ${seat} in round ${r.round}`);
    return majsoulTilesToHand(h.tiles);
  });
}
