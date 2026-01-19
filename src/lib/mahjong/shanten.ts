/**
 * Shanten calculation for Riichi Mahjong
 *
 * Shanten is the number of tiles needed to complete a hand (reach tenpai).
 * - 0 shanten = tenpai (ready hand)
 * - 1 shanten = 1 tile away from tenpai
 * - etc.
 *
 * Uses the accurate shanten formula:
 * accurateShanten = min(
 *   8 - (2 * groups) - min(pairs + taatsu, 4 - groups) - min(1, max(0, pairs + taatsu + groups - 4)),
 *   6 - pairs,
 *   13 - diffTerminals - min(terminalPairs, 1)
 * )
 */

import type { Hand34 } from './types';

/**
 * Calculate the shanten using the accurate formula
 */
export function calculateShanten(hand34: Hand34): number {
  // Validate hand size (should be 13 or 14 tiles)
  const totalTiles = hand34.reduce((sum, count) => sum + count, 0);
  if (totalTiles < 13 || totalTiles > 14) {
    throw new Error(`Invalid hand size: ${totalTiles} (must be 13 or 14)`);
  }

  // Calculate shanten for the hand (works for both 13 and 14 tiles)
  const normalShanten = calculateNormalShanten(hand34);
  const chiitoitsuShanten = calculateChiitoitsuShanten(hand34);
  const kokushiShanten = calculateKokushiShanten(hand34);

  // Return the minimum (best) shanten
  let shanten = Math.min(normalShanten, chiitoitsuShanten, kokushiShanten);

  // Accurate correction: if shanten is 0, check if there are any possible winning tiles
  if (shanten === 0 && totalTiles === 13) {
    shanten = applyAccurateCorrection(hand34);
  }

  return shanten;
}

/**
 * Calculate normal shanten using the accurate formula:
 * 8 - (2 * groups) - min(pairs + taatsu, 4 - groups) - min(1, max(0, pairs + taatsu + groups - 4))
 */
function calculateNormalShanten(hand34: Hand34): number {
  const memo = new Map<string, number>();

  // Count pairs and taatsu from remaining tiles - try multiple strategies
  function countPairsAndTaatsu(hand: Hand34): {
    pairs: number;
    taatsu: number;
  } {
    let bestPairs = 0;
    let bestTaatsu = 0;
    let bestScore = 0;

    // Try different orders and pick the best
    const orders = [
      // Order 1: All pairs, then all taatsu (12 type first, then 13 type)
      () => {
        const h = [...hand];
        let pairs = 0;
        let taatsu = 0;
        for (let i = 0; i < 34; i++) {
          if (h[i] >= 2) {
            pairs++;
            h[i] -= 2;
          }
        }
        for (let suit = 0; suit < 3 && taatsu < 4; suit++) {
          const start = suit * 9;
          for (let i = start; i < start + 8 && taatsu < 4; i++) {
            if (h[i] >= 1 && h[i + 1] >= 1) {
              taatsu++;
              h[i]--;
              h[i + 1]--;
            }
          }
          for (let i = start; i < start + 7 && taatsu < 4; i++) {
            if (h[i] >= 1 && h[i + 2] >= 1) {
              taatsu++;
              h[i]--;
              h[i + 2]--;
            }
          }
        }
        return { pairs, taatsu, score: pairs + taatsu };
      },
      // Order 2: All taatsu (12 type), then pairs, then taatsu (13 type)
      () => {
        const h = [...hand];
        let pairs = 0;
        let taatsu = 0;
        // 12 type taatsu first
        for (let suit = 0; suit < 3 && taatsu < 4; suit++) {
          const start = suit * 9;
          for (let i = start; i < start + 8 && taatsu < 4; i++) {
            if (h[i] >= 1 && h[i + 1] >= 1) {
              taatsu++;
              h[i]--;
              h[i + 1]--;
            }
          }
        }
        // Then pairs
        for (let i = 0; i < 34; i++) {
          if (h[i] >= 2) {
            pairs++;
            h[i] -= 2;
          }
        }
        // Then 13 type taatsu
        for (let suit = 0; suit < 3 && taatsu < 4; suit++) {
          const start = suit * 9;
          for (let i = start; i < start + 7 && taatsu < 4; i++) {
            if (h[i] >= 1 && h[i + 2] >= 1) {
              taatsu++;
              h[i]--;
              h[i + 2]--;
            }
          }
        }
        return { pairs, taatsu, score: pairs + taatsu };
      },
      // Order 3: All taatsu, then all pairs
      () => {
        const h = [...hand];
        let pairs = 0;
        let taatsu = 0;
        for (let suit = 0; suit < 3 && taatsu < 4; suit++) {
          const start = suit * 9;
          for (let i = start; i < start + 8 && taatsu < 4; i++) {
            if (h[i] >= 1 && h[i + 1] >= 1) {
              taatsu++;
              h[i]--;
              h[i + 1]--;
            }
          }
          for (let i = start; i < start + 7 && taatsu < 4; i++) {
            if (h[i] >= 1 && h[i + 2] >= 1) {
              taatsu++;
              h[i]--;
              h[i + 2]--;
            }
          }
        }
        for (let i = 0; i < 34; i++) {
          if (h[i] >= 2) {
            pairs++;
            h[i] -= 2;
          }
        }
        return { pairs, taatsu, score: pairs + taatsu };
      },
      // Order 4: Pairs first, then taatsu in reverse order
      () => {
        const h = [...hand];
        let pairs = 0;
        let taatsu = 0;
        for (let i = 0; i < 34; i++) {
          if (h[i] >= 2) {
            pairs++;
            h[i] -= 2;
          }
        }
        // Count taatsu in reverse order
        for (let suit = 2; suit >= 0 && taatsu < 4; suit--) {
          const start = suit * 9;
          for (let i = start + 7; i >= start && taatsu < 4; i--) {
            if (h[i] >= 1 && h[i + 1] >= 1) {
              taatsu++;
              h[i]--;
              h[i + 1]--;
            }
          }
          for (let i = start + 6; i >= start && taatsu < 4; i--) {
            if (h[i] >= 1 && h[i + 2] >= 1) {
              taatsu++;
              h[i]--;
              h[i + 2]--;
            }
          }
        }
        return { pairs, taatsu, score: pairs + taatsu };
      },
    ];

    for (const order of orders) {
      const result = order();
      if (result.score > bestScore) {
        bestScore = result.score;
        bestPairs = result.pairs;
        bestTaatsu = result.taatsu;
      }
    }

    return { pairs: bestPairs, taatsu: bestTaatsu };
  }

  // Try all possible combinations of groups
  function search(hand: Hand34, groups: number, pairUsed: boolean): number {
    // Create a key for memoization
    const handKey = hand.join(',');
    const key = `${handKey}-${groups}-${pairUsed}`;
    if (memo.has(key)) {
      return memo.get(key)!;
    }

    // Count pairs and taatsu from remaining tiles
    const { pairs, taatsu } = countPairsAndTaatsu(hand);

    // Calculate shanten using the formula
    // For the formula: pairs + taatsu should include the pair if it's already used
    const totalPairsAndTaatsu = pairUsed ? pairs + taatsu + 1 : pairs + taatsu;
    const term1 = 8 - 2 * groups;
    const term2 = Math.min(totalPairsAndTaatsu, 4 - groups);
    const term3 = Math.min(1, Math.max(0, totalPairsAndTaatsu + groups - 4));
    let shanten = term1 - term2 - term3;
    // Don't clamp to 0 - allow -1 for winning hands

    // If we have 4 groups and a pair, and all tiles are used, we're done
    // For a complete hand, all tiles must be used (no remaining tiles)
    const remainingTiles = hand.reduce((sum, count) => sum + count, 0);
    if (groups === 4 && (pairUsed || pairs > 0)) {
      // Only return if all tiles are used (complete hand)
      // Otherwise continue searching for better arrangements
      if (remainingTiles === 0) {
        memo.set(key, shanten);
        return shanten;
      }
    }

    let bestShanten = shanten;

    // Early termination: if we found a winning hand (-1), we can't do better
    if (bestShanten === -1) {
      memo.set(key, -1);
      return -1;
    }

    // Try to form a group (triplet or sequence)
    // Try triplets
    for (let i = 0; i < 34; i++) {
      if (hand[i] >= 3) {
        const newHand = [...hand];
        newHand[i] -= 3;
        const result = search(newHand, groups + 1, pairUsed);
        bestShanten = Math.min(bestShanten, result);
        if (bestShanten === -1) {
          memo.set(key, -1);
          return -1;
        }
      }
    }

    // Try sequences (only for numbered suits)
    for (let suit = 0; suit < 3; suit++) {
      const start = suit * 9;
      for (let i = start; i < start + 7; i++) {
        if (hand[i] >= 1 && hand[i + 1] >= 1 && hand[i + 2] >= 1) {
          const newHand = [...hand];
          newHand[i]--;
          newHand[i + 1]--;
          newHand[i + 2]--;
          const result = search(newHand, groups + 1, pairUsed);
          bestShanten = Math.min(bestShanten, result);
          if (bestShanten === -1) {
            memo.set(key, -1);
            return -1;
          }
        }
      }
    }

    // Try to form a pair (if not already used)
    if (!pairUsed) {
      for (let i = 0; i < 34; i++) {
        if (hand[i] >= 2) {
          const newHand = [...hand];
          newHand[i] -= 2;
          const result = search(newHand, groups, true);
          bestShanten = Math.min(bestShanten, result);
          if (bestShanten === -1) {
            memo.set(key, -1);
            return -1;
          }
        }
      }
    }

    memo.set(key, bestShanten);
    return bestShanten;
  }

  const result = search(hand34, 0, false);
  return result;
}

/**
 * Calculate kokushi (13 orphans) shanten
 * Formula: 13 - diffTerminals - min(terminalPairs, 1)
 */
function calculateKokushiShanten(hand34: Hand34): number {
  const terminalsAndHonors = [
    0,
    8, // manzu 1, 9
    9,
    17, // pinzu 1, 9
    18,
    26, // souzu 1, 9
    27,
    28,
    29,
    30,
    31,
    32,
    33, // all honors
  ];

  let unique = 0;
  let pairs = 0;

  for (const index of terminalsAndHonors) {
    if (hand34[index] >= 1) {
      unique++;
    }
    if (hand34[index] >= 2) {
      pairs++;
    }
  }

  // Formula: 13 - unique - min(pairs, 1)
  const shanten = 13 - unique - Math.min(pairs, 1);
  return shanten;
}

/**
 * Calculate chiitoitsu (7 pairs) shanten
 * Formula: 6 - pairs
 */
function calculateChiitoitsuShanten(hand34: Hand34): number {
  let pairs = 0;

  for (let i = 0; i < 34; i++) {
    if (hand34[i] >= 2) {
      pairs++;
    }
  }

  // Formula: 6 - pairs
  const shanten = 6 - pairs;
  return shanten;
}

/**
 * Check if a 14-tile hand is actually a complete (winning) hand
 * Returns true if the hand can form 4 groups + 1 pair (normal), 7 pairs (chiitoitsu), or kokushi
 */
function isCompleteHand(hand34: Hand34): boolean {
  const totalTiles = hand34.reduce((sum, count) => sum + count, 0);
  if (totalTiles !== 14) {
    return false;
  }

  // Check chiitoitsu (7 pairs) - returns -1 for winning hand
  if (calculateChiitoitsuShanten(hand34) === -1) {
    return true;
  }

  // Check kokushi (13 unique terminals/honors + 1 pair) - returns -1 for winning hand
  if (calculateKokushiShanten(hand34) === -1) {
    return true;
  }

  // Check normal hand (4 groups + 1 pair)
  // Try to form 4 groups and 1 pair using all 14 tiles
  function canFormCompleteNormalHand(
    hand: Hand34,
    groups: number,
    pairUsed: boolean
  ): boolean {
    const remainingTiles = hand.reduce((sum, count) => sum + count, 0);

    // If we have 4 groups and a pair, check if all tiles are used
    if (groups === 4 && pairUsed && remainingTiles === 0) {
      return true;
    }

    // If we have 4 groups but no pair yet, try to form a pair
    if (groups === 4 && !pairUsed) {
      for (let i = 0; i < 34; i++) {
        if (hand[i] >= 2) {
          const newHand = [...hand];
          newHand[i] -= 2;
          if (canFormCompleteNormalHand(newHand, groups, true)) {
            return true;
          }
        }
      }
      return false;
    }

    // Try to form a group (triplet or sequence)
    // Try triplets
    for (let i = 0; i < 34; i++) {
      if (hand[i] >= 3) {
        const newHand = [...hand];
        newHand[i] -= 3;
        if (canFormCompleteNormalHand(newHand, groups + 1, pairUsed)) {
          return true;
        }
      }
    }

    // Try sequences (only for numbered suits)
    for (let suit = 0; suit < 3; suit++) {
      const start = suit * 9;
      for (let i = start; i < start + 7; i++) {
        if (hand[i] >= 1 && hand[i + 1] >= 1 && hand[i + 2] >= 1) {
          const newHand = [...hand];
          newHand[i]--;
          newHand[i + 1]--;
          newHand[i + 2]--;
          if (canFormCompleteNormalHand(newHand, groups + 1, pairUsed)) {
            return true;
          }
        }
      }
    }

    // Try to form a pair (if not already used)
    if (!pairUsed) {
      for (let i = 0; i < 34; i++) {
        if (hand[i] >= 2) {
          const newHand = [...hand];
          newHand[i] -= 2;
          if (canFormCompleteNormalHand(newHand, groups, true)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  return canFormCompleteNormalHand(hand34, 0, false);
}

/**
 * Apply accurate correction when shanten is 0
 * Check if there are any possible tiles that could lead to a winning hand
 * If no tile results in a winning hand, return 1 (impossible tenpai)
 * If there is a possible winning hand, return 0 (truly tenpai)
 */
function applyAccurateCorrection(hand34: Hand34): number {
  // Try drawing each possible tile and check if it results in a winning hand
  for (let i = 0; i < 34; i++) {
    // Skip if we already have 4 copies (can't draw more)
    if (hand34[i] >= 4) {
      continue;
    }

    // Try drawing this tile
    const newHand = [...hand34];
    newHand[i]++;

    // Check if this results in a complete (winning) hand
    if (isCompleteHand(newHand)) {
      return 0; // Can win, so it's truly tenpai
    }
  }

  // No tile results in a winning hand, so it's impossible tenpai
  return 1;
}
