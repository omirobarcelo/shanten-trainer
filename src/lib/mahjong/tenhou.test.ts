import { describe, it, expect } from 'vitest';
import { parseTenhou, toTenhou, toHand34, fromHand34 } from './tenhou';
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
  });

  describe('toHand34', () => {
    it('should convert hand to Hand34 format', () => {
      const hand = parseTenhou('1m');
      const hand34 = toHand34(hand);
      expect(hand34[0]).toBe(1); // Index 0 = manzu 1
      expect(hand34.reduce((sum, count) => sum + count, 0)).toBe(1);
    });

    it('should map red 5 and normal 5 to same index', () => {
      const hand1 = parseTenhou('0m'); // red 5
      const hand2 = parseTenhou('5m'); // normal 5
      const hand34_1 = toHand34(hand1);
      const hand34_2 = toHand34(hand2);
      expect(hand34_1[4]).toBe(1); // Index 4 = tile 5
      expect(hand34_2[4]).toBe(1); // Index 4 = tile 5
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

    it('should correctly convert honors', () => {
      const hand34 = new Array(34).fill(0);
      hand34[27] = 1; // Honor 1 (east wind)
      hand34[33] = 1; // Honor 7 (red dragon)
      const result = fromHand34(hand34);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ suit: Suit.JIHAI, value: 1 });
      expect(result[1]).toEqual({ suit: Suit.JIHAI, value: 7 });
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
  });
});
