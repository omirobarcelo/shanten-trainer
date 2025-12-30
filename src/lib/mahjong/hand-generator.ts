/**
 * Hand generation utilities
 */

import type { Hand, Hand34 } from './types';
import { fromHand34, toHand34 } from './tenhou';
import { calculateShanten } from './shanten';

/**
 * Generate a random valid hand (13 tiles)
 * A valid hand must not exceed 4 of any tile type
 */
export function generateRandomHand(): Hand {
  const hand34: Hand34 = new Array(34).fill(0);
  let tilesRemaining = 13;

  while (tilesRemaining > 0) {
    const randomIndex = Math.floor(Math.random() * 34);

    // Check if we can add this tile (max 4 of each type)
    if (hand34[randomIndex] < 4) {
      hand34[randomIndex]++;
      tilesRemaining--;
    }
  }

  return fromHand34(hand34);
}

/**
 * Generate a random hand with a specific shanten value
 * This is more complex and may require multiple attempts
 */
export function generateHandWithShanten(
  targetShanten: number,
  maxAttempts: number = 1000
): Hand | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const hand = generateRandomHand();
    const hand34 = toHand34(hand);
    const shanten = calculateShanten(hand34);

    if (shanten === targetShanten) {
      return hand;
    }
  }

  return null; // Could not generate hand with target shanten
}
