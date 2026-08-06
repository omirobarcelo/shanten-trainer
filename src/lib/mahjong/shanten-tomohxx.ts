/**
 * Port of tomohxx/shanten-number.
 *
 * References:
 * - https://stackoverflow.com/questions/4239028/how-do-i-calculate-the-shanten-number-in-mahjong
 * - https://github.com/tomohxx/shanten-number
 *
 * Return convention matches upstream: **shanten number + 1**.
 *   0 = winning hand, 1 = tenpai, 2 = 1-shanten, ...
 *
 * The upstream loads two precomputed DP tables (`index_s.bin`, `index_h.bin`)
 * for O(1) sub-hand lookups. This port computes the same per-sub-hand DP on
 * demand and memoizes results, effectively building the lookup tables lazily.
 * Four sub-hand computations per calc; each cheap enough that startup is free
 * and repeated calls quickly become cache hits.
 */

import type { Hand34 } from './types';

const NUM_TIDS = 34;
const MAX_SHT = 14;
const NON_SIMPLES = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33] as const;

export const MODE_LH = 1;
export const MODE_SP = 2;
export const MODE_TO = 4;

interface Delta {
  a: number;
  b: number;
  c: number;
  h: number;
  m: number;
}

const DELTAS_SUIT: readonly Delta[] = [
  { a: 0, b: 0, c: 0, h: 0, m: 0 },
  { a: 1, b: 1, c: 1, h: 0, m: 1 },
  { a: 2, b: 2, c: 2, h: 0, m: 2 },
  { a: 3, b: 0, c: 0, h: 0, m: 1 },
  { a: 4, b: 1, c: 1, h: 0, m: 2 },
  { a: 2, b: 0, c: 0, h: 1, m: 0 },
  { a: 3, b: 1, c: 1, h: 1, m: 1 },
  { a: 4, b: 2, c: 2, h: 1, m: 2 },
];

const DELTAS_HONOR: readonly Delta[] = [
  { a: 0, b: 0, c: 0, h: 0, m: 0 },
  { a: 3, b: 0, c: 0, h: 0, m: 1 },
  { a: 2, b: 0, c: 0, h: 1, m: 0 },
];

// index1[i] = per-tile-count distance table used in three-player mode
// for the terminal manzu suits (only tile 1m and 9m are playable).
const index1: readonly Uint8Array[] = (() => {
  const out: Uint8Array[] = [];
  for (let i = 0; i < 5; i++) {
    const a = new Uint8Array(10);
    a.fill(14);
    a[0] = 0;
    a[1] = Math.max(3 - i, 0);
    a[5] = Math.max(2 - i, 0);
    out.push(a);
  }
  return out;
})();

// Sub-hand DP. `hand` is a length-N array (N = 9 for a suit, 7 for honors).
// Returns a length-10 distance array where index (h * 5 + m) is the minimum
// number of tiles that must be added to this sub-hand to form `m` melds plus
// `h` heads (0 or 1 head).
function dpSubHand(hand: readonly number[], N: number, deltas: readonly Delta[]): Uint8Array {
  const stride_m = 1;
  const stride_h = 5;
  const stride_b = 10;
  const stride_a = 50;
  const stride_n = 250;
  const table = new Uint8Array((N + 1) * stride_n);
  table.fill(MAX_SHT);
  table[0] = 0;

  for (let n = 0; n < N; n++) {
    const baseN = n * stride_n;
    const baseNext = baseN + stride_n;
    const handN = hand[n];
    for (let di = 0; di < deltas.length; di++) {
      const d = deltas[di];
      const aMax = 4 - d.a;
      const bLimit = 4 - d.b;
      const hMax = 1 - d.h;
      const mMax = 4 - d.m;
      const dc = d.c;
      const db = d.b;
      const dh = d.h;
      const dm = d.m;
      for (let a = 0; a <= aMax; a++) {
        const bMax = bLimit < a ? bLimit : a;
        const missBase = a + d.a - handN;
        const miss = missBase > 0 ? missBase : 0;
        const baseA = baseN + a * stride_a;
        for (let b = 0; b <= bMax; b++) {
          const baseB = baseA + b * stride_b;
          for (let h = 0; h <= hMax; h++) {
            const baseH = baseB + h * stride_h;
            for (let m = 0; m <= mMax; m++) {
              const tmp = table[baseH + m];
              if (tmp === MAX_SHT) continue;
              const cost = tmp + miss;
              const j =
                baseNext +
                (b + db) * stride_a +
                dc * stride_b +
                (h + dh) * stride_h +
                (m + dm);
              if (cost < table[j]) table[j] = cost;
            }
          }
        }
      }
    }
  }

  // Copy table[N][0][0][0..1][0..4] into a fresh 10-byte array.
  const out = new Uint8Array(10);
  const baseFinal = N * stride_n;
  for (let h = 0; h < 2; h++) {
    for (let m = 0; m < 5; m++) {
      out[h * 5 + m] = table[baseFinal + h * stride_h + m];
    }
  }
  return out;
}

// Cache keyed by a polynomial hash (base 5) matching upstream DefaultHash.
const suitCache = new Map<number, Uint8Array>();
const honorCache = new Map<number, Uint8Array>();

function hash(t: Hand34, offset: number, length: number): number {
  let h = t[offset];
  for (let i = 1; i < length; i++) h = 5 * h + t[offset + i];
  return h;
}

function suitDist(t: Hand34, offset: number): Uint8Array {
  const key = hash(t, offset, 9);
  let v = suitCache.get(key);
  if (!v) {
    v = dpSubHand(t.slice(offset, offset + 9), 9, DELTAS_SUIT);
    suitCache.set(key, v);
  }
  return v;
}

function honorDist(t: Hand34): Uint8Array {
  const key = hash(t, 27, 7);
  let v = honorCache.get(key);
  if (!v) {
    v = dpSubHand(t.slice(27, 34), 7, DELTAS_HONOR);
    honorCache.set(key, v);
  }
  return v;
}

// Min-convolution: lhs[j] = min over splits of lhs[k] + rhs[j-k].
// j = h*5 + m; index 0..4 is "no head", index 5..9 is "with head".
function add1(lhs: Uint8Array, rhs: Uint8Array, m: number): void {
  for (let j = m + 5; j >= 5; j--) {
    let sht = lhs[j] + rhs[0];
    const alt = lhs[0] + rhs[j];
    if (alt < sht) sht = alt;
    for (let k = 5; k < j; k++) {
      const v1 = lhs[k] + rhs[j - k];
      if (v1 < sht) sht = v1;
      const v2 = lhs[j - k] + rhs[k];
      if (v2 < sht) sht = v2;
    }
    lhs[j] = sht;
  }
  for (let j = m; j >= 0; j--) {
    let sht = lhs[j] + rhs[0];
    for (let k = 0; k < j; k++) {
      const v = lhs[k] + rhs[j - k];
      if (v < sht) sht = v;
    }
    lhs[j] = sht;
  }
}

// Same as add1 but only updates lhs[m + 5] — used for the final combine
// since only that slot is read out afterwards.
function add2(lhs: Uint8Array, rhs: Uint8Array, m: number): void {
  const j = m + 5;
  let sht = lhs[j] + rhs[0];
  const alt = lhs[0] + rhs[j];
  if (alt < sht) sht = alt;
  for (let k = 5; k < j; k++) {
    const v1 = lhs[k] + rhs[j - k];
    if (v1 < sht) sht = v1;
    const v2 = lhs[j - k] + rhs[k];
    if (v2 < sht) sht = v2;
  }
  lhs[j] = sht;
}

/**
 * General form (m melds + a pair). Returns shanten + 1.
 * @param m Number of melds already declared (0-4).
 * @param threePlayer Sanma rules (drops 2m-8m).
 */
export function calcLh(t: Hand34, m: number, threePlayer = false): number {
  const ret = new Uint8Array(honorDist(t));

  add1(ret, suitDist(t, 18), m);
  add1(ret, suitDist(t, 9), m);

  if (threePlayer) {
    add1(ret, index1[t[8]], m);
    add2(ret, index1[t[0]], m);
  } else {
    add2(ret, suitDist(t, 0), m);
  }

  return ret[m + 5];
}

/** Seven pairs. Returns shanten + 1. */
export function calcSp(t: Hand34, threePlayer = false): number {
  let pair = 0;
  let kind = 0;
  for (let i = 0; i < NUM_TIDS; i++) {
    if (threePlayer && i > 0 && i < 8) continue;
    if (t[i] > 0) kind++;
    if (t[i] >= 2) pair++;
  }
  return 7 - pair + (kind < 7 ? 7 - kind : 0);
}

/** Thirteen orphans. Returns shanten + 1. */
export function calcTo(t: Hand34): number {
  let pair = 0;
  let kind = 0;
  for (const i of NON_SIMPLES) {
    if (t[i] >= 1) kind++;
    if (t[i] >= 2) pair++;
  }
  return 14 - kind - (pair > 0 ? 1 : 0);
}

export interface CalshtOptions {
  /** Number of melds already declared (0-4). Defaults to 4. */
  m?: number;
  /** Bitmask of MODE_LH | MODE_SP | MODE_TO. Defaults to all three. */
  mode?: number;
  /** Validate hand tile counts, meld count, and mode bits. */
  checkHand?: boolean;
  /** Sanma (three-player) rules. */
  threePlayer?: boolean;
}

export interface CalshtResult {
  /** Shanten + 1 (0 = win, 1 = tenpai). */
  shanten: number;
  /** Bitmask of the winning-pattern(s) that achieved the minimum. */
  mode: number;
}

/**
 * Standard entry point. Returns the minimum shanten + 1 across the requested
 * winning patterns, plus a bitmask of which patterns hit that minimum.
 */
export function calsht(t: Hand34, options: CalshtOptions = {}): CalshtResult {
  const m = options.m ?? 4;
  const mode = options.mode ?? (MODE_LH | MODE_SP | MODE_TO);
  const checkHand = options.checkHand ?? false;
  const threePlayer = options.threePlayer ?? false;

  if (checkHand) {
    for (let i = 0; i < NUM_TIDS; i++) {
      if (t[i] < 0 || t[i] > 4) {
        throw new Error(`Invalid number of hand's tiles at ${i}: ${t[i]}`);
      }
    }
    if (m < 0 || m > 4) {
      throw new Error(`Invalid sum of hand's melds: ${m}`);
    }
    if (mode < 0 || mode > 7) {
      throw new Error(`Invalid calculation mode: ${mode}`);
    }
  }

  let bestSht = 1024;
  let bestMode = 0;

  if (mode & MODE_LH) {
    const sht = calcLh(t, m, threePlayer);
    if (sht < bestSht) {
      bestSht = sht;
      bestMode = MODE_LH;
    } else if (sht === bestSht) {
      bestMode |= MODE_LH;
    }
  }
  if (mode & MODE_SP && m === 4) {
    const sht = calcSp(t, threePlayer);
    if (sht < bestSht) {
      bestSht = sht;
      bestMode = MODE_SP;
    } else if (sht === bestSht) {
      bestMode |= MODE_SP;
    }
  }
  if (mode & MODE_TO && m === 4) {
    const sht = calcTo(t);
    if (sht < bestSht) {
      bestSht = sht;
      bestMode = MODE_TO;
    } else if (sht === bestSht) {
      bestMode |= MODE_TO;
    }
  }

  return { shanten: bestSht, mode: bestMode };
}

/**
 * Drop-in replacement for `calculateShanten` from `./shanten`.
 * Returns standard shanten: -1 for a winning hand, 0 for tenpai, N for N-shanten.
 * Accepts a 13- or 14-tile hand.
 */
export function calculateShanten(hand34: Hand34): number {
  const totalTiles = hand34.reduce((sum, count) => sum + count, 0);
  if (totalTiles < 13 || totalTiles > 14) {
    throw new Error(`Invalid hand size: ${totalTiles} (must be 13 or 14)`);
  }
  const { shanten } = calsht(hand34, { m: 4, mode: MODE_LH | MODE_SP | MODE_TO });
  return shanten - 1;
}
