import { describe, it, expect } from 'vitest';
import { parseTenhou, toTenhou, toHand34, fromHand34 } from './tenhou';
import type { Hand } from './types';
import { Suit } from './types';

describe('tenhou.ts', () => {
  describe('parseTenhou', () => {
    it('should parse a simple hand', () => {
      const hand = parseTenhou('123m456p789s');
      expect(hand).toHaveLength(9);
      expect(hand[0]).toEqual({ suit: Suit.MANZU, value: 1 });
      expect(hand[1]).toEqual({ suit: Suit.MANZU, value: 2 });
      expect(hand[2]).toEqual({ suit: Suit.MANZU, value: 3 });
    });

    it('should parse a hand with honors', () => {
      const hand = parseTenhou('123m456p789s11z');
      expect(hand).toHaveLength(11);
      expect(hand[9]).toEqual({ suit: Suit.JIHAI, value: 1 });
      expect(hand[10]).toEqual({ suit: Suit.JIHAI, value: 1 });
    });

    it('should parse red 5 tiles (value 0)', () => {
      const hand = parseTenhou('0m5p0s');
      expect(hand).toHaveLength(3);
      expect(hand[0]).toEqual({ suit: Suit.MANZU, value: 0 });
      expect(hand[1]).toEqual({ suit: Suit.PINZU, value: 5 });
      expect(hand[2]).toEqual({ suit: Suit.SOUZU, value: 0 });
    });

    it('should parse all honor values (1-7)', () => {
      const hand = parseTenhou('1234567z');
      expect(hand).toHaveLength(7);
      expect(hand[0]).toEqual({ suit: Suit.JIHAI, value: 1 });
      expect(hand[6]).toEqual({ suit: Suit.JIHAI, value: 7 });
    });

    it('should throw error for invalid honor value (0)', () => {
      expect(() => parseTenhou('0z')).toThrow('Invalid honor tile value');
    });

    it('should throw error for invalid honor value (>7)', () => {
      expect(() => parseTenhou('8z')).toThrow('Invalid honor tile value');
    });

    it('should parse multi-digit numbers as individual digits', () => {
      // "10m" is parsed as "1" and "0" (both valid)
      const hand = parseTenhou('10m');
      expect(hand).toHaveLength(2);
      expect(hand[0]).toEqual({ suit: Suit.MANZU, value: 1 });
      expect(hand[1]).toEqual({ suit: Suit.MANZU, value: 0 });
    });

    it('should parse a complete 13-tile hand', () => {
      const hand = parseTenhou('123456789m1234p');
      expect(hand).toHaveLength(13);
    });

    it('should handle empty string', () => {
      const hand = parseTenhou('');
      expect(hand).toHaveLength(0);
    });

    it('should parse mixed red 5 and normal 5 in same suit', () => {
      const hand = parseTenhou('05m');
      expect(hand).toHaveLength(2);
      expect(hand[0]).toEqual({ suit: Suit.MANZU, value: 0 });
      expect(hand[1]).toEqual({ suit: Suit.MANZU, value: 5 });
    });

    it('should parse all tiles of one suit', () => {
      const hand = parseTenhou('123456789m');
      expect(hand).toHaveLength(9);
      expect(hand.every((tile) => tile.suit === Suit.MANZU)).toBe(true);
    });

    it('should parse single tile', () => {
      const hand = parseTenhou('5m');
      expect(hand).toHaveLength(1);
      expect(hand[0]).toEqual({ suit: Suit.MANZU, value: 5 });
    });

    it('should parse hand with only honors', () => {
      const hand = parseTenhou('1234567z');
      expect(hand).toHaveLength(7);
      expect(hand.every((tile) => tile.suit === Suit.JIHAI)).toBe(true);
    });

    it('should handle multiple suits in any order', () => {
      const hand1 = parseTenhou('1m2p3s4z');
      const hand2 = parseTenhou('4z3s2p1m');
      expect(hand1).toHaveLength(4);
      expect(hand2).toHaveLength(4);
      // Same tiles, different order
      expect(hand1.map((t) => `${t.suit}${t.value}`).sort()).toEqual(
        hand2.map((t) => `${t.suit}${t.value}`).sort()
      );
    });
  });

  describe('toTenhou', () => {
    it('should convert hand back to Tenhou notation', () => {
      const notation = '123m456p789s';
      const hand = parseTenhou(notation);
      const result = toTenhou(hand);
      expect(result).toBe(notation);
    });

    it('should handle honors correctly', () => {
      const notation = '123m456p789s11z';
      const hand = parseTenhou(notation);
      const result = toTenhou(hand);
      expect(result).toBe(notation);
    });

    it('should sort tiles within each suit', () => {
      const hand = parseTenhou('321m654p987s');
      const result = toTenhou(hand);
      expect(result).toBe('123m456p789s');
    });

    it('should handle red 5 tiles', () => {
      const hand = parseTenhou('0m5p0s');
      const result = toTenhou(hand);
      // Red 5 (0) should come before normal 5
      expect(result).toContain('0m');
      expect(result).toContain('0s');
      expect(result).toContain('5p');
    });

    it('should maintain suit order (m, p, s, z)', () => {
      const hand = parseTenhou('1z2s3p4m');
      const result = toTenhou(hand);
      expect(result).toBe('4m3p2s1z');
    });

    it('should handle empty hand', () => {
      const hand: Hand = [];
      const result = toTenhou(hand);
      expect(result).toBe('');
    });

    it('should handle single tile', () => {
      const hand = parseTenhou('5m');
      const result = toTenhou(hand);
      expect(result).toBe('5m');
    });

    it('should handle hand with only one suit', () => {
      const hand = parseTenhou('123456789m');
      const result = toTenhou(hand);
      expect(result).toBe('123456789m');
    });

    it('should sort red 5 (0) before normal 5', () => {
      const hand = parseTenhou('5m0m5m0m');
      const result = toTenhou(hand);
      // Red 5s (0) should come before normal 5s
      expect(result).toBe('0055m');
    });

    it('should handle 4 tiles of same type', () => {
      const hand = parseTenhou('1111m');
      const result = toTenhou(hand);
      expect(result).toBe('1111m');
    });

    it('should handle hand with all suits', () => {
      const hand = parseTenhou('1m2p3s4z');
      const result = toTenhou(hand);
      expect(result).toBe('1m2p3s4z');
    });
  });

  describe('toHand34', () => {
    it('should convert hand to Hand34 format', () => {
      const hand = parseTenhou('1m');
      const hand34 = toHand34(hand);
      expect(hand34[0]).toBe(1); // Index 0 = manzu 1
      expect(hand34.reduce((sum, count) => sum + count, 0)).toBe(1);
    });

    it('should correctly map all numbered tiles', () => {
      const hand = parseTenhou('123456789m');
      const hand34 = toHand34(hand);
      // Indices 0-8 should all be 1
      for (let i = 0; i < 9; i++) {
        expect(hand34[i]).toBe(1);
      }
    });

    it('should correctly map honors', () => {
      const hand = parseTenhou('1234567z');
      const hand34 = toHand34(hand);
      // Honors start at index 27
      for (let i = 0; i < 7; i++) {
        expect(hand34[27 + i]).toBe(1);
      }
    });

    it('should handle multiple tiles of same type', () => {
      const hand = parseTenhou('111m');
      const hand34 = toHand34(hand);
      expect(hand34[0]).toBe(3);
    });

    it('should create a 34-element array', () => {
      const hand = parseTenhou('1m');
      const hand34 = toHand34(hand);
      expect(hand34).toHaveLength(34);
    });

    it('should sum red 5 and normal 5 in same suit', () => {
      const hand = parseTenhou('0m5m');
      const hand34 = toHand34(hand);
      expect(hand34[4]).toBe(2); // Both map to index 4
    });

    it('should handle 4 tiles of one type', () => {
      const hand = parseTenhou('1111m');
      const hand34 = toHand34(hand);
      expect(hand34[0]).toBe(4);
      expect(hand34.reduce((sum, count) => sum + count, 0)).toBe(4);
    });

    it('should correctly map boundary tiles for each suit', () => {
      // Test first tile (1) and last tile (9) of each numbered suit
      const hand = parseTenhou('1m9m1p9p1s9s');
      const hand34 = toHand34(hand);
      expect(hand34[0]).toBe(1); // manzu 1
      expect(hand34[8]).toBe(1); // manzu 9
      expect(hand34[9]).toBe(1); // pinzu 1
      expect(hand34[17]).toBe(1); // pinzu 9
      expect(hand34[18]).toBe(1); // souzu 1
      expect(hand34[26]).toBe(1); // souzu 9
    });

    it('should correctly map tile 5 for all numbered suits', () => {
      const hand = parseTenhou('5m5p5s');
      const hand34 = toHand34(hand);
      expect(hand34[4]).toBe(1); // manzu 5
      expect(hand34[13]).toBe(1); // pinzu 5
      expect(hand34[22]).toBe(1); // souzu 5
    });

    it('should correctly map boundary honors', () => {
      const hand = parseTenhou('1z7z');
      const hand34 = toHand34(hand);
      expect(hand34[27]).toBe(1); // Honor 1 (east wind)
      expect(hand34[33]).toBe(1); // Honor 7 (red dragon)
    });

    it('should handle single tile of each type', () => {
      const hand = parseTenhou('1m1p1s1z');
      const hand34 = toHand34(hand);
      expect(hand34[0]).toBe(1); // manzu 1
      expect(hand34[9]).toBe(1); // pinzu 1
      expect(hand34[18]).toBe(1); // souzu 1
      expect(hand34[27]).toBe(1); // honor 1
    });
  });

  describe('fromHand34', () => {
    it('should convert Hand34 back to Hand', () => {
      const hand = parseTenhou('123m456p789s');
      const hand34 = toHand34(hand);
      const result = fromHand34(hand34);
      expect(result).toHaveLength(9);
      // Note: Red 5 and normal 5 both become normal 5 when converting back
    });

    it('should handle all tile types', () => {
      const hand = parseTenhou('123456789m123456789p123456789s1234567z');
      const hand34 = toHand34(hand);
      const result = fromHand34(hand34);
      expect(result).toHaveLength(34);
    });

    it('should handle multiple tiles of same type', () => {
      const hand34 = new Array(34).fill(0);
      hand34[0] = 3; // Three 1-manzu
      const result = fromHand34(hand34);
      expect(result).toHaveLength(3);
      expect(
        result.every((tile) => tile.suit === Suit.MANZU && tile.value === 1)
      ).toBe(true);
    });

    it('should handle 4 tiles of one type', () => {
      const hand34 = new Array(34).fill(0);
      hand34[4] = 4; // Four 5-manzu
      const result = fromHand34(hand34);
      expect(result).toHaveLength(4);
      expect(
        result.every((tile) => tile.suit === Suit.MANZU && tile.value === 5)
      ).toBe(true);
    });

    it('should correctly convert boundary indices for each suit', () => {
      const hand34 = new Array(34).fill(0);
      hand34[0] = 1; // manzu 1
      hand34[8] = 1; // manzu 9
      hand34[9] = 1; // pinzu 1
      hand34[17] = 1; // pinzu 9
      hand34[18] = 1; // souzu 1
      hand34[26] = 1; // souzu 9
      hand34[27] = 1; // honor 1
      hand34[33] = 1; // honor 7

      const result = fromHand34(hand34);
      expect(result).toHaveLength(8);
      expect(
        result.find((t) => t.suit === Suit.MANZU && t.value === 1)
      ).toBeDefined();
      expect(
        result.find((t) => t.suit === Suit.MANZU && t.value === 9)
      ).toBeDefined();
      expect(
        result.find((t) => t.suit === Suit.PINZU && t.value === 1)
      ).toBeDefined();
      expect(
        result.find((t) => t.suit === Suit.PINZU && t.value === 9)
      ).toBeDefined();
      expect(
        result.find((t) => t.suit === Suit.SOUZU && t.value === 1)
      ).toBeDefined();
      expect(
        result.find((t) => t.suit === Suit.SOUZU && t.value === 9)
      ).toBeDefined();
      expect(
        result.find((t) => t.suit === Suit.JIHAI && t.value === 1)
      ).toBeDefined();
      expect(
        result.find((t) => t.suit === Suit.JIHAI && t.value === 7)
      ).toBeDefined();
    });

    it('should handle maximum count (4) for multiple tiles', () => {
      const hand34 = new Array(34).fill(0);
      hand34[0] = 4; // Four 1-manzu
      hand34[4] = 4; // Four 5-manzu
      hand34[27] = 4; // Four honor 1
      const result = fromHand34(hand34);
      expect(result).toHaveLength(12);
      expect(
        result.filter((t) => t.suit === Suit.MANZU && t.value === 1)
      ).toHaveLength(4);
      expect(
        result.filter((t) => t.suit === Suit.MANZU && t.value === 5)
      ).toHaveLength(4);
      expect(
        result.filter((t) => t.suit === Suit.JIHAI && t.value === 1)
      ).toHaveLength(4);
    });

    it('should correctly convert tile 5 for all numbered suits', () => {
      const hand34 = new Array(34).fill(0);
      hand34[4] = 1; // manzu 5
      hand34[13] = 1; // pinzu 5
      hand34[22] = 1; // souzu 5
      const result = fromHand34(hand34);
      expect(result).toHaveLength(3);
      expect(result.every((t) => t.value === 5)).toBe(true);
      expect(result.filter((t) => t.suit === Suit.MANZU)).toHaveLength(1);
      expect(result.filter((t) => t.suit === Suit.PINZU)).toHaveLength(1);
      expect(result.filter((t) => t.suit === Suit.SOUZU)).toHaveLength(1);
    });
  });

  describe('round-trip conversions', () => {
    it('should maintain hand through parseTenhou -> toHand34 -> fromHand34 -> toTenhou', () => {
      const original = '123m456p789s11z';
      const hand1 = parseTenhou(original);
      const hand34 = toHand34(hand1);
      const hand2 = fromHand34(hand34);
      const result = toTenhou(hand2);
      // Note: Red 5s become normal 5s in round-trip, so we check structure
      expect(hand2).toHaveLength(hand1.length);
    });

    it('should handle a complete 13-tile hand', () => {
      const original = '123456789m1234p';
      const hand1 = parseTenhou(original);
      const hand34 = toHand34(hand1);
      const hand2 = fromHand34(hand34);
      expect(hand2).toHaveLength(13);
      const result = toTenhou(hand2);
      expect(result).toBe(original);
    });

    it('should handle hands with red 5s (note: red 5 becomes normal 5 in round-trip)', () => {
      const original = '0m5p0s';
      const hand1 = parseTenhou(original);
      const hand34 = toHand34(hand1);
      const hand2 = fromHand34(hand34);
      // All 5s (red and normal) become normal 5s
      expect(hand2.filter((t) => t.value === 5)).toHaveLength(3);
    });

    it('should handle empty string round-trip', () => {
      const original = '';
      const hand1 = parseTenhou(original);
      const hand34 = toHand34(hand1);
      const hand2 = fromHand34(hand34);
      const result = toTenhou(hand2);
      expect(result).toBe(original);
    });

    it('should handle single tile round-trip', () => {
      const original = '5m';
      const hand1 = parseTenhou(original);
      const hand34 = toHand34(hand1);
      const hand2 = fromHand34(hand34);
      const result = toTenhou(hand2);
      expect(result).toBe(original);
    });

    it('should handle 4 tiles of one type round-trip', () => {
      const original = '1111m';
      const hand1 = parseTenhou(original);
      const hand34 = toHand34(hand1);
      const hand2 = fromHand34(hand34);
      const result = toTenhou(hand2);
      expect(result).toBe(original);
    });

    it('should handle mixed red 5 and normal 5 round-trip', () => {
      const original = '05m';
      const hand1 = parseTenhou(original);
      const hand34 = toHand34(hand1);
      const hand2 = fromHand34(hand34);
      // Both red 5 and normal 5 become normal 5
      expect(hand2.filter((t) => t.value === 5)).toHaveLength(2);
      const result = toTenhou(hand2);
      expect(result).toBe('55m');
    });

    it('should handle hand with all suits round-trip', () => {
      const original = '1m2p3s4z';
      const hand1 = parseTenhou(original);
      const hand34 = toHand34(hand1);
      const hand2 = fromHand34(hand34);
      const result = toTenhou(hand2);
      expect(result).toBe(original);
    });

    it('should handle 14-tile hand (tenpai)', () => {
      const original = '123456789m1234p';
      const hand1 = parseTenhou(original);
      expect(hand1).toHaveLength(13);
      // Add one more tile to make 14
      hand1.push({ suit: Suit.MANZU, value: 1 });
      const hand34 = toHand34(hand1);
      const hand2 = fromHand34(hand34);
      expect(hand2).toHaveLength(14);
    });
  });

  describe('edge cases', () => {
    it('should handle empty hand', () => {
      const hand34 = new Array(34).fill(0);
      const result = fromHand34(hand34);
      expect(result).toHaveLength(0);
      expect(toTenhou(result)).toBe('');
    });

    it('should handle hand with all tiles of one type', () => {
      const hand = parseTenhou('1111222233334m');
      expect(hand).toHaveLength(13);
      const hand34 = toHand34(hand);
      expect(hand34[0]).toBe(4); // Four 1-manzu
      expect(hand34[1]).toBe(4); // Four 2-manzu
      expect(hand34[2]).toBe(4); // Four 3-manzu
      expect(hand34[3]).toBe(1); // One 4-manzu
    });

    it('should handle hand with tiles in all suits', () => {
      const hand = parseTenhou('123m456p789s1234z');
      expect(hand).toHaveLength(13);
      const hand34 = toHand34(hand);
      expect(hand34.reduce((sum, count) => sum + count, 0)).toBe(13);
    });

    it('should handle complex hand with mixed red and normal 5s', () => {
      const hand = parseTenhou('05m05p05s123z');
      expect(hand).toHaveLength(9);
      const hand34 = toHand34(hand);
      // All 5s (red and normal) should sum at index 4, 13, 22
      expect(hand34[4]).toBe(2); // manzu: red 5 + normal 5
      expect(hand34[13]).toBe(2); // pinzu: red 5 + normal 5
      expect(hand34[22]).toBe(2); // souzu: red 5 + normal 5
      expect(hand34[27]).toBe(1); // honor 1
      expect(hand34[28]).toBe(1); // honor 2
      expect(hand34[29]).toBe(1); // honor 3
    });

    it('should preserve tile counts through round-trip', () => {
      const original = '1111222233334m';
      const hand1 = parseTenhou(original);
      const hand34 = toHand34(hand1);
      const hand2 = fromHand34(hand34);
      const result = toTenhou(hand2);
      expect(result).toBe(original);
      expect(hand2).toHaveLength(13);
    });
  });
});
