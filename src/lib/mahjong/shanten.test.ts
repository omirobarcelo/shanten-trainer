import { describe, it, expect } from 'vitest';
import { calculateShanten } from './shanten';
import { parseTenhou, toHand34 } from './tenhou';

describe('shanten.ts', () => {
  describe('calculateShanten', () => {
    describe('normal shanten', () => {
      it('should calculate -1 for a winning hand (14 tiles)', () => {
        // 1112345678999m5m - winning hand (14 tiles)
        const hand = parseTenhou('1112345678999m5m');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(-1);
      });

      it('should calculate 0 shanten (tenpai) for a ready hand (13 tiles)', () => {
        // 1112345678999m - tenpai (13 tiles)
        const hand = parseTenhou('1112345678999m');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(0);
      });

      it('should calculate 0 shanten (tenpai) for a ready hand (14 tiles)', () => {
        // 1112345678999m1p - tenpai (14 tiles)
        const hand = parseTenhou('1112345678999m1p');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(0);
      });

      it('should calculate 1-shanten (13 tiles)', () => {
        const hand = parseTenhou('55m13p11345567s2z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(1);
      });

      it('should calculate 1-shanten (14 tiles)', () => {
        const hand = parseTenhou('33789m23p2489s16z4p');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(1);
      });

      it('should calculate 2-shanten (13 tiles)', () => {
        const hand = parseTenhou('33789m23p2489s16z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(2);
      });

      it('should calculate 2-shanten (14 tiles)', () => {
        const hand = parseTenhou('478m2056899p569s9m');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(2);
      });

      it('should calculate 3-shanten (13 tiles)', () => {
        const hand = parseTenhou('478m2056899p569s');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(3);
      });

      it('should calculate 3-shanten (14 tiles)', () => {
        const hand = parseTenhou('38m1247p479s5566z1m');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(3);
      });

      it('should calculate 4-shanten (13 tiles)', () => {
        const hand = parseTenhou('38m1247p479s5566z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(4);
      });

      it('should calculate 4-shanten (14 tiles)', () => {
        const hand = parseTenhou('34679m2p3s234457z8m');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(4);
      });

      it('should calculate 5-shanten (13 tiles)', () => {
        const hand = parseTenhou('34679m2p3s234457z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(5);
      });

      it('should calculate 5-shanten (14 tiles)', () => {
        const hand = parseTenhou('459m69p12308s2351z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(5);
      });
    });

    describe('kokushi (13 orphans) shanten', () => {
      it('should calculate -1 for complete kokushi', () => {
        // 19m19p19s1234567z1z - complete kokushi (13 unique + 1 pair = 14 tiles)
        const hand = parseTenhou('19m19p19s1234567z1z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(-1);
      });

      it('should calculate 0 shanten for 13-wait kokushi in tenpai', () => {
        // 19m19p19s1234567z - 13-wait kokushi (13 unique tiles)
        const hand = parseTenhou('19m19p19s1234567z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(0);
      });

      it('should calculate 0 shanten for single-wait kokushi in tenpai', () => {
        // 19m19p19s1123456z - single-wait kokushi (11 unique tiles + 1 pair)
        const hand = parseTenhou('19m19p19s1123456z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(0);
      });

      it('should calculate kokushi 1-shanten (no pair)', () => {
        // 169m19p19s123456z - missing 1 honor, no pair (13 tiles)
        const hand = parseTenhou('169m19p19s123456z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(1);
      });

      it('should calculate kokushi 1-shanten (with pair)', () => {
        // 1699m19p19s12345z - missing 2 honors, has pair (13 tiles)
        const hand = parseTenhou('1699m19p19s12345z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(1);
      });

      it('should calculate kokushi 2-shanten (no pair)', () => {
        // 16m16p19s1234567z - missing 2 terminals, no pair (13 tiles)
        const hand = parseTenhou('16m16p19s1234567z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(2);
      });

      it('should calculate kokushi 2-shanten (with pair)', () => {
        // 16m16p199s123456z - missing 2 terminals and 1 honor, has pair (13 tiles)
        const hand = parseTenhou('16m16p199s123456z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(2);
      });
    });

    describe('chiitoitsu (7 pairs) shanten', () => {
      it('should calculate -1 for complete chiitoitsu', () => {
        // 11m22p33s44z55m66p77s - 7 pairs
        const hand = parseTenhou('11m22p33s44z55m66p77s');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(-1);
      });

      it('should calculate chiitoitsu shanten in tenpai', () => {
        // 11m22p33s44z55m66p1z - 6 pairs, 1 single (13 tiles)
        const hand = parseTenhou('11m22p33s44z55m66p1z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(0);
      });

      it('should calculate chiitoitsu 1-shanten', () => {
        // 11m22p33s44m55p123z - 5 pairs, 3 singles (13 tiles)
        const hand = parseTenhou('11m22p33s44m55p123z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(1);
      });

      it('should calculate chiitoitsu 2-shanten', () => {
        // 11m22p33s44m12345z - 4 pairs, 5 singles (13 tiles)
        const hand = parseTenhou('11m22p33s44m12345z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(2);
      });

      it('should calculate chiitoitsu 3-shanten', () => {
        // 11m22p33s1234567z - 3 pairs, 7 singles (13 tiles)
        const hand = parseTenhou('11m22p33s1234567z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(3);
      });

      it('should calculate chiitoitsu 4-shanten', () => {
        // 11m22p34s1234567z - 2 pairs, 9 singles (13 tiles)
        const hand = parseTenhou('11m22p34s1234567z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(4);
      });

      it('should calculate chiitoitsu 5-shanten', () => {
        // 22m25p36s1234567z - 1 pair, 11 singles (13 tiles)
        const hand = parseTenhou('22m25p36s1234567z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(5);
      });

      it('should calculate chiitoitsu 6-shanten', () => {
        // 25m25p25s1234567z - 13 singles (13 tiles)
        const hand = parseTenhou('25m25p25s1234567z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(6);
      });
    });

    describe('hand size validation', () => {
      it('should throw error for hand with less than 13 tiles', () => {
        const hand34 = new Array(34).fill(0);
        hand34[0] = 12; // Only 12 tiles
        expect(() => calculateShanten(hand34)).toThrow('Invalid hand size');
      });

      it('should throw error for hand with more than 14 tiles', () => {
        const hand34 = new Array(34).fill(0);
        hand34[0] = 15; // 15 tiles
        expect(() => calculateShanten(hand34)).toThrow('Invalid hand size');
      });

      it('should accept 13-tile hand', () => {
        const hand = parseTenhou('123456789m1234p');
        const hand34 = toHand34(hand);
        expect(() => calculateShanten(hand34)).not.toThrow();
      });

      it('should accept 14-tile hand', () => {
        const hand = parseTenhou('123456789m12345p');
        const hand34 = toHand34(hand);
        expect(() => calculateShanten(hand34)).not.toThrow();
      });
    });

    describe('edge cases', () => {
      it('should handle worst case hand (8 shanten), returns 6 as it is the worst case for chiitoitsu', () => {
        // 13 completely unrelated tiles
        const hand = parseTenhou('258m258p258s1357z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(6);
      });

      it('should return minimum shanten among all types', () => {
        // A hand that could be kokushi, chiitoitsu, or normal
        // Should return the best (lowest) shanten
        const hand = parseTenhou('19m19p19s123456z1z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(0);
      });

      it('should handle hand with red 5 tiles', () => {
        // 0m5p0s123456789m1z - includes red 5 tiles (13 tiles: 0m, 5p, 0s, 1-9m, 1z)
        const hand = parseTenhou('0m5p0s123456789m1z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(2);
      });

      it('should handle hand with multiple triplets of same tile', () => {
        // 1111m2222p3333s1z - multiple triplets (13 tiles)
        const hand = parseTenhou('1111m2222p3333s1z');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(2);
      });

      it('should apply correction to shanten for tenpai if needed (13 tiles)', () => {
        // 111m3333456666p - waiting for 36p, impossible
        const hand = parseTenhou('111m3333456666p');
        const hand34 = toHand34(hand);
        const shanten = calculateShanten(hand34);
        expect(shanten).toBe(1);
      });
    });
  });
});
