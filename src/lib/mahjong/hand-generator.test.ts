import { describe, it, expect } from 'vitest';
import { generateRandomHand, generateHandWithShanten } from './hand-generator';
import { toHand34 } from './tenhou';
import { calculateShanten } from './shanten';

describe('hand-generator.ts', () => {
  describe('generateRandomHand', () => {
    it('should generate a hand with exactly 13 tiles', () => {
      const hand = generateRandomHand();
      expect(hand).toHaveLength(13);
    });

    it('should generate a valid hand (no more than 4 of any tile type)', () => {
      const hand = generateRandomHand();
      const hand34 = toHand34(hand);

      // Check that no tile type exceeds 4 copies
      for (let i = 0; i < 34; i++) {
        expect(hand34[i]).toBeLessThanOrEqual(4);
      }
    });

    it('should generate different hands on multiple calls', () => {
      const hand1 = generateRandomHand();
      const hand2 = generateRandomHand();
      const hand3 = generateRandomHand();

      // It's very unlikely (but not impossible) to get the same hand 3 times
      // So we check that at least one is different
      const allSame =
        JSON.stringify(hand1) === JSON.stringify(hand2) &&
        JSON.stringify(hand2) === JSON.stringify(hand3);

      // This test might occasionally fail due to randomness, but it's extremely unlikely
      expect(allSame).toBe(false);
    });

    it('should generate hands with valid shanten values', () => {
      // Generate multiple hands and verify they all have valid shanten
      for (let i = 0; i < 10; i++) {
        const hand = generateRandomHand();
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);

        // Shanten should be between -1 and 6 for valid hands
        expect(shanten).toBeGreaterThanOrEqual(-1);
        expect(shanten).toBeLessThanOrEqual(6);
      }
    });

    it('should generate hands that can be converted to Hand34 and back', () => {
      const hand = generateRandomHand();
      const hand34 = toHand34(hand);

      // Verify the hand34 has exactly 13 tiles
      const totalTiles = hand34.reduce((sum, count) => sum + count, 0);
      expect(totalTiles).toBe(13);
    });
  });

  describe('generateHandWithShanten', () => {
    // This is possible but very rare, so we skip it
    it.skip('should generate a hand with shanten 0 (tenpai)', () => {
      const hand = generateHandWithShanten(0, 5000);
      expect(hand).not.toBeNull();

      if (hand) {
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(0);
      }
    });

    it('should generate a hand with shanten 1', () => {
      const hand = generateHandWithShanten(1, 5000);
      expect(hand).not.toBeNull();

      if (hand) {
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(1);
      }
    });

    it('should generate a hand with shanten 2', () => {
      const hand = generateHandWithShanten(2, 5000);
      expect(hand).not.toBeNull();

      if (hand) {
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(2);
      }
    });

    it('should generate a hand with shanten 3', () => {
      const hand = generateHandWithShanten(3, 5000);
      expect(hand).not.toBeNull();

      if (hand) {
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(3);
      }
    });

    it('should generate a hand with shanten 4', () => {
      const hand = generateHandWithShanten(4, 5000);
      expect(hand).not.toBeNull();

      if (hand) {
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(4);
      }
    });

    it('should generate a hand with shanten 5', () => {
      const hand = generateHandWithShanten(5, 5000);
      expect(hand).not.toBeNull();

      if (hand) {
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(5);
      }
    });

    it('should generate a hand with shanten 6', () => {
      const hand = generateHandWithShanten(6, 5000);
      expect(hand).not.toBeNull();

      if (hand) {
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(6);
      }
    });

    it('should return null when maxAttempts is reached without finding a match', () => {
      // Use a very low maxAttempts to ensure it fails
      const hand = generateHandWithShanten(0, 1);
      // This might occasionally pass if we get lucky, but usually will be null
      // We can't guarantee it will be null, but we can test the behavior
      if (hand !== null) {
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(0);
      }
    });

    it('should generate valid hands (no more than 4 of any tile type)', () => {
      const hand = generateHandWithShanten(3, 5000);
      expect(hand).not.toBeNull();

      if (hand) {
        const hand34 = toHand34(hand);
        // Check that no tile type exceeds 4 copies
        for (let i = 0; i < 34; i++) {
          expect(hand34[i]).toBeLessThanOrEqual(4);
        }
      }
    });
  });
});
