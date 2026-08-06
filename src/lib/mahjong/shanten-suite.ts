import { describe, it, expect } from 'vitest';
import type { Hand34 } from './types';
import { parseTenhou, toHand34 } from './tenhou';

type CalculateShanten = (hand34: Hand34) => number;

export function runShantenSuite(name: string, calculateShanten: CalculateShanten): void {
  describe(name, () => {
    describe('calculateShanten', () => {
      describe('normal shanten', () => {
        const cases: Array<[string, string, number]> = [
          ['-1 for a winning hand (14 tiles)', '1112345678999m5m', -1],
          ['0 shanten (tenpai) for a ready hand (13 tiles)', '1112345678999m', 0],
          ['0 shanten (tenpai) for a ready hand (14 tiles)', '1112345678999m1p', 0],
          ['1-shanten (13 tiles)', '55m13p11345567s2z', 1],
          ['1-shanten (14 tiles)', '33789m23p2489s16z4p', 1],
          ['2-shanten (13 tiles)', '33789m23p2489s16z', 2],
          ['2-shanten (14 tiles)', '478m2056899p569s9m', 2],
          ['3-shanten (13 tiles)', '478m2056899p569s', 3],
          ['3-shanten (14 tiles)', '38m1247p479s5566z1m', 3],
          ['4-shanten (13 tiles)', '38m1247p479s5566z', 4],
          ['4-shanten (14 tiles)', '34679m2p3s234457z8m', 4],
          ['5-shanten (13 tiles)', '34679m2p3s234457z', 5],
          ['5-shanten (14 tiles)', '459m69p12308s2351z', 5],
        ];
        for (const [label, notation, expected] of cases) {
          it(`should calculate ${label}`, () => {
            const hand34 = toHand34(parseTenhou(notation));
            expect(calculateShanten(hand34)).toBe(expected);
          });
        }
      });

      describe('kokushi (13 orphans) shanten', () => {
        const cases: Array<[string, string, number]> = [
          ['-1 for complete kokushi', '19m19p19s1234567z1z', -1],
          ['0 shanten for 13-wait kokushi in tenpai', '19m19p19s1234567z', 0],
          ['0 shanten for single-wait kokushi in tenpai', '19m19p19s1123456z', 0],
          ['kokushi 1-shanten (no pair)', '169m19p19s123456z', 1],
          ['kokushi 1-shanten (with pair)', '1699m19p19s12345z', 1],
          ['kokushi 2-shanten (no pair)', '16m16p19s1234567z', 2],
          ['kokushi 2-shanten (with pair)', '16m16p199s123456z', 2],
        ];
        for (const [label, notation, expected] of cases) {
          it(`should calculate ${label}`, () => {
            const hand34 = toHand34(parseTenhou(notation));
            expect(calculateShanten(hand34)).toBe(expected);
          });
        }
      });

      describe('chiitoitsu (7 pairs) shanten', () => {
        const cases: Array<[string, string, number]> = [
          ['-1 for complete chiitoitsu', '11m22p33s44z55m66p77s', -1],
          ['chiitoitsu shanten in tenpai', '11m22p33s44z55m66p1z', 0],
          ['chiitoitsu 1-shanten', '11m22p33s44m55p123z', 1],
          ['chiitoitsu 2-shanten', '11m22p33s44m12345z', 2],
          ['chiitoitsu 3-shanten', '11m22p33s1234567z', 3],
          ['chiitoitsu 4-shanten', '11m22p34s1234567z', 4],
          ['chiitoitsu 5-shanten', '22m25p36s1234567z', 5],
          ['chiitoitsu 6-shanten', '25m25p25s1234567z', 6],
        ];
        for (const [label, notation, expected] of cases) {
          it(`should calculate ${label}`, () => {
            const hand34 = toHand34(parseTenhou(notation));
            expect(calculateShanten(hand34)).toBe(expected);
          });
        }
      });

      describe('hand size validation', () => {
        it('should throw error for hand with less than 13 tiles', () => {
          const hand34 = new Array(34).fill(0);
          hand34[0] = 12;
          expect(() => calculateShanten(hand34)).toThrow('Invalid hand size');
        });

        it('should throw error for hand with more than 14 tiles', () => {
          const hand34 = new Array(34).fill(0);
          hand34[0] = 15;
          expect(() => calculateShanten(hand34)).toThrow('Invalid hand size');
        });

        it('should accept 13-tile hand', () => {
          const hand34 = toHand34(parseTenhou('123456789m1234p'));
          expect(() => calculateShanten(hand34)).not.toThrow();
        });

        it('should accept 14-tile hand', () => {
          const hand34 = toHand34(parseTenhou('123456789m12345p'));
          expect(() => calculateShanten(hand34)).not.toThrow();
        });
      });

      describe('edge cases', () => {
        const cases: Array<[string, string, number]> = [
          ['worst case hand (8 shanten), returns 6 as it is the worst case for chiitoitsu', '258m258p258s1357z', 6],
          ['minimum shanten among all types', '19m19p19s123456z1z', 0],
          ['hand with red 5 tiles', '0m5p0s123456789m1z', 2],
          ['hand with multiple triplets of same tile', '1111m2222p3333s1z', 2],
          ['apply correction to shanten for tenpai if needed (13 tiles)', '111m3333456666p', 1],
        ];
        for (const [label, notation, expected] of cases) {
          it(`should handle ${label}`, () => {
            const hand34 = toHand34(parseTenhou(notation));
            expect(calculateShanten(hand34)).toBe(expected);
          });
        }
      });
    });
  });
}
