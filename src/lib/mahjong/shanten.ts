/**
 * Shanten calculation for Riichi Mahjong
 *
 * Shanten is the number of tiles needed to complete a hand (reach tenpai).
 * - 0 shanten = tenpai (ready hand)
 * - 1 shanten = 1 tile away from tenpai
 * - etc.
 */

import type { Hand34 } from './types';

/**
 * Calculate the normal shanten (for standard hands)
 * This is the most common type of shanten calculation
 */
export function calculateShanten(hand34: Hand34): number {
  // Validate hand size (should be 13 or 14 tiles)
  const totalTiles = hand34.reduce((sum, count) => sum + count, 0);
  if (totalTiles < 13 || totalTiles > 14) {
    throw new Error(`Invalid hand size: ${totalTiles} (must be 13 or 14)`);
  }

  // Check for kokushi (13 orphans) shanten
  const kokushiShanten = calculateKokushiShanten(hand34);

  // Check for chiitoitsu (7 pairs) shanten
  const chiitoitsuShanten = calculateChiitoitsuShanten(hand34);

  // Calculate normal shanten
  const normalShanten = calculateNormalShanten(hand34);

  // Return the minimum (best) shanten
  return Math.min(kokushiShanten, chiitoitsuShanten, normalShanten);
}

/**
 * Calculate normal shanten using recursive meld formation
 */
function calculateNormalShanten(hand34: Hand34): number {
  // Recursive function to try all combinations
  function search(hand: Hand34, pairsUsed: number, meldsUsed: number): number {
    let minShanten = 8; // Start with worst case

    // Try to form a pair
    if (pairsUsed === 0) {
      for (let i = 0; i < 34; i++) {
        if (hand[i] >= 2) {
          const newHand = [...hand];
          newHand[i] -= 2;
          const shanten = search(newHand, 1, meldsUsed);
          minShanten = Math.min(minShanten, shanten);
        }
      }
    }

    // Try to form a triplet
    for (let i = 0; i < 34; i++) {
      if (hand[i] >= 3) {
        const newHand = [...hand];
        newHand[i] -= 3;
        const shanten = search(newHand, pairsUsed, meldsUsed + 1);
        minShanten = Math.min(minShanten, shanten);
      }
    }

    // Try to form a sequence (only for numbered suits)
    for (let suit = 0; suit < 3; suit++) {
      const start = suit * 9;
      for (let i = start; i < start + 7; i++) {
        if (hand[i] >= 1 && hand[i + 1] >= 1 && hand[i + 2] >= 1) {
          const newHand = [...hand];
          newHand[i]--;
          newHand[i + 1]--;
          newHand[i + 2]--;
          const shanten = search(newHand, pairsUsed, meldsUsed + 1);
          minShanten = Math.min(minShanten, shanten);
        }
      }
    }

    // If no more melds can be formed, calculate remaining shanten
    if (minShanten === 8) {
      const totalTiles = hand.reduce((sum, count) => sum + count, 0);
      const neededMelds = 4 - meldsUsed;
      const neededPairs = pairsUsed === 0 ? 1 : 0;
      const neededTiles = neededMelds * 3 + neededPairs * 2;
      const shanten = neededTiles - totalTiles;
      return Math.max(0, shanten);
    }

    return minShanten;
  }

  return search(hand34, 0, 0);
}

/**
 * Calculate kokushi (13 orphans) shanten
 * Kokushi requires one of each terminal/honor + one pair
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

  // Need 13 unique + 1 pair = 14 tiles total
  // Shanten = 13 - unique + (pairs === 0 ? 1 : 0)
  const shanten = 13 - unique + (pairs === 0 ? 1 : 0);
  return shanten;
}

/**
 * Calculate chiitoitsu (7 pairs) shanten
 * Chiitoitsu requires 7 pairs of different tiles
 */
function calculateChiitoitsuShanten(hand34: Hand34): number {
  let pairs = 0;
  let singles = 0;

  for (let i = 0; i < 34; i++) {
    if (hand34[i] >= 2) {
      pairs++;
    } else if (hand34[i] === 1) {
      singles++;
    }
  }

  // Need 7 pairs
  // Shanten = 6 - pairs + (singles > 0 ? 1 : 0)
  if (pairs >= 7) {
    return 0; // Already complete
  }

  const shanten = 6 - pairs;
  return shanten;
}
