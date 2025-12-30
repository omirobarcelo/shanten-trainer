/**
 * Tenhou notation parser and utilities
 *
 * Tenhou format: "123m456p789s11z"
 * - Numbers represent tile values:
 *   - For numbered suits (m, p, s): 0 = red 5, 1-9 = normal tiles 1-9
 *   - For honors (z): 1-7 = winds 1-4 and dragons 5-7
 * - Letters represent suits: m (manzu), p (pinzu), s (souzu), z (jihai)
 * - Tiles are grouped by suit
 */

import type { Hand, Hand34 } from './types';
import { Suit } from './types';

/**
 * Parse a Tenhou notation string into a Hand
 * Example: "123m456p789s11z" -> array of Tile objects
 */
export function parseTenhou(notation: string): Hand {
  const hand: Hand = [];
  const regex = /(\d+)([mpsz])/g;
  let match;

  while ((match = regex.exec(notation)) !== null) {
    const digits = match[1];
    const suit = match[2] as Suit;

    for (const digit of digits) {
      const value = parseInt(digit, 10);

      // Validate value range
      if (suit === Suit.JIHAI) {
        if (value < 1 || value > 7) {
          throw new Error(`Invalid honor tile value: ${value} (must be 1-7)`);
        }
      } else {
        if (value < 0 || value > 9) {
          throw new Error(
            `Invalid numbered tile value: ${value} (must be 0-9, where 0=red5)`
          );
        }
      }

      hand.push({ suit, value });
    }
  }

  return hand;
}

/**
 * Convert a Hand to Tenhou notation string
 */
export function toTenhou(hand: Hand): string {
  // Group tiles by suit
  const grouped: Record<Suit, number[]> = {
    [Suit.MANZU]: [],
    [Suit.PINZU]: [],
    [Suit.SOUZU]: [],
    [Suit.JIHAI]: [],
  };

  for (const tile of hand) {
    grouped[tile.suit].push(tile.value);
  }

  // Sort each suit's values
  for (const suit of Object.values(Suit)) {
    grouped[suit].sort((a, b) => a - b);
  }

  // Build notation string
  let notation = '';
  const suitOrder: Suit[] = [Suit.MANZU, Suit.PINZU, Suit.SOUZU, Suit.JIHAI];

  for (const suit of suitOrder) {
    if (grouped[suit].length > 0) {
      notation += grouped[suit].join('') + suit;
    }
  }

  return notation;
}

/**
 * Convert a Hand to Hand34 format (compact 34-element array)
 * Note: Red 5 (value 0) and normal 5 (value 5) both map to index 4 in their suit
 */
export function toHand34(hand: Hand): Hand34 {
  const hand34: Hand34 = new Array(34).fill(0);

  for (const tile of hand) {
    let index: number;

    switch (tile.suit) {
      case Suit.MANZU:
        // 0 (red 5) or 5 (normal 5) -> index 4, 1-4 -> 0-3, 6-9 -> 5-8
        index = tile.value === 0 || tile.value === 5 ? 4 : tile.value - 1;
        break;
      case Suit.PINZU:
        // Same mapping, offset by 9
        const pinzuIndex =
          tile.value === 0 || tile.value === 5 ? 4 : tile.value - 1;
        index = 9 + pinzuIndex;
        break;
      case Suit.SOUZU:
        // Same mapping, offset by 18
        const souzuIndex =
          tile.value === 0 || tile.value === 5 ? 4 : tile.value - 1;
        index = 18 + souzuIndex;
        break;
      case Suit.JIHAI:
        // Honors: 1-7 -> indices 27-33 (1-based to 0-based)
        index = 27 + (tile.value - 1);
        break;
    }

    hand34[index]++;
  }

  return hand34;
}

/**
 * Convert Hand34 format back to Hand
 * Note: When converting back, we use normal 5 (value 5) instead of red 5 (value 0)
 * since Hand34 doesn't distinguish between them
 */
export function fromHand34(hand34: Hand34): Hand {
  const hand: Hand = [];

  for (let i = 0; i < 34; i++) {
    const count = hand34[i];

    if (count > 0) {
      let suit: Suit;
      let value: number;

      if (i < 9) {
        suit = Suit.MANZU;
        // Convert index to value: 0-3 -> 1-4, 4 -> 5, 5-8 -> 6-9
        value = i < 4 ? i + 1 : i === 4 ? 5 : i + 1;
      } else if (i < 18) {
        suit = Suit.PINZU;
        const localIndex = i - 9;
        value =
          localIndex < 4
            ? localIndex + 1
            : localIndex === 4
            ? 5
            : localIndex + 1;
      } else if (i < 27) {
        suit = Suit.SOUZU;
        const localIndex = i - 18;
        value =
          localIndex < 4
            ? localIndex + 1
            : localIndex === 4
            ? 5
            : localIndex + 1;
      } else {
        suit = Suit.JIHAI;
        // Honors: indices 27-33 -> values 1-7 (0-based to 1-based)
        value = i - 27 + 1;
      }

      // Add this tile 'count' times
      for (let j = 0; j < count; j++) {
        hand.push({ suit, value });
      }
    }
  }

  return hand;
}
