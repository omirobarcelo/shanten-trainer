import { describe, it, expect } from 'vitest';
import { extractGameLog, majsoulTileToTile, majsoulTilesToHand, startingHandsForSeat } from './extract';
import { Suit } from '../mahjong/types';

describe('majsoulTileToTile', () => {
  it('parses numbered tiles', () => {
    expect(majsoulTileToTile('1m')).toEqual({ suit: Suit.MANZU, value: 1 });
    expect(majsoulTileToTile('9s')).toEqual({ suit: Suit.SOUZU, value: 9 });
    expect(majsoulTileToTile('5p')).toEqual({ suit: Suit.PINZU, value: 5 });
  });

  it('parses red 5 as value 0', () => {
    expect(majsoulTileToTile('0m')).toEqual({ suit: Suit.MANZU, value: 0 });
    expect(majsoulTileToTile('0p')).toEqual({ suit: Suit.PINZU, value: 0 });
    expect(majsoulTileToTile('0s')).toEqual({ suit: Suit.SOUZU, value: 0 });
  });

  it('parses honors', () => {
    expect(majsoulTileToTile('1z')).toEqual({ suit: Suit.JIHAI, value: 1 });
    expect(majsoulTileToTile('7z')).toEqual({ suit: Suit.JIHAI, value: 7 });
  });

  it('rejects bad input', () => {
    expect(() => majsoulTileToTile('')).toThrow();
    expect(() => majsoulTileToTile('10m')).toThrow();
    expect(() => majsoulTileToTile('xm')).toThrow();
    expect(() => majsoulTileToTile('1x')).toThrow();
  });
});

describe('majsoulTilesToHand', () => {
  it('converts a starting hand', () => {
    const hand = majsoulTilesToHand(['1m', '2m', '3m', '4p', '5p', '0p', '7s', '8s', '9s', '1z', '2z', '3z', '4z']);
    expect(hand).toHaveLength(13);
    expect(hand[5]).toEqual({ suit: Suit.PINZU, value: 0 });
  });
});

describe('extractGameLog', () => {
  const raw = {
    head: {
      uuid: 'test-uuid-123',
      accounts: [
        { seat: 0, account_id: 111, nickname: 'A' },
        { seat: 1, account_id: 222, nickname: 'B' },
        { seat: 2, account_id: 333, nickname: 'C' },
        { seat: 3, account_id: 444, nickname: 'D' },
      ],
    },
    data: [
      {
        name: '.lq.RecordNewRound',
        data: {
          chang: 0,
          ju: 0,
          ben: 0,
          dora: '5z',
          tiles0: ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '1p', '2p', '3p', '4p'],
          tiles1: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '1z', '2z', '3z', '4z'],
          tiles2: ['5p', '6p', '7p', '8p', '9p', '1m', '2m', '3m', '4m', '5m', '5z', '6z', '7z'],
          tiles3: ['0m', '0p', '0s', '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '1z'],
        },
      },
      { name: '.lq.RecordDealTile', data: { seat: 0, tile: '5m' } },
      {
        name: '.lq.RecordNewRound',
        data: {
          chang: 0,
          ju: 1,
          ben: 1,
          doras: ['6z'],
          tiles0: ['1m', '1m', '2m', '2m', '3m', '3m', '4m', '4m', '5m', '5m', '6m', '6m', '7m'],
          tiles1: [], tiles2: [], tiles3: [],
        },
      },
    ],
  };

  it('extracts uuid and players', () => {
    const log = extractGameLog(raw);
    expect(log.uuid).toBe('test-uuid-123');
    expect(log.players).toHaveLength(4);
    expect(log.players[0]).toEqual({ seat: 0, accountId: 111, nickname: 'A' });
  });

  it('extracts rounds from RecordNewRound only', () => {
    const log = extractGameLog(raw);
    expect(log.rounds).toHaveLength(2);
    expect(log.rounds[0].round).toBe(0);
    expect(log.rounds[1].round).toBe(1);
    expect(log.rounds[1].ben).toBe(1);
  });

  it('collects hands per seat', () => {
    const log = extractGameLog(raw);
    expect(log.rounds[0].hands).toHaveLength(4);
    expect(log.rounds[0].hands[0].tiles).toHaveLength(13);
    expect(log.rounds[0].hands[3].tiles[0]).toBe('0m');
  });

  it('reads dora indicator from either dora or doras[0]', () => {
    const log = extractGameLog(raw);
    expect(log.rounds[0].doraIndicator).toBe('5z');
    expect(log.rounds[1].doraIndicator).toBe('6z');
  });

  it('startingHandsForSeat returns parsed hands per round', () => {
    const log = extractGameLog(raw);
    const seat0 = startingHandsForSeat(log, 0);
    expect(seat0).toHaveLength(2);
    expect(seat0[0]).toHaveLength(13);
    expect(seat0[0][0]).toEqual({ suit: Suit.MANZU, value: 1 });
  });
});
