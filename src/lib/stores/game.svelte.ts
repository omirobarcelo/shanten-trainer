/**
 * Game state store
 */

import type { Hand } from '../mahjong/types';
import { generateRandomHand } from '../mahjong/hand-generator';
import { toHand34 } from '../mahjong/tenhou';
import { calculateShanten } from '../mahjong/shanten';

export type GameStatus = 'idle' | 'ongoing' | 'answered';

export interface GameState {
  hand: Hand | null;
  shanten: number | null;
  status: GameStatus;
}

function createInitialState(): GameState {
  const hand = generateRandomHand();
  const hand34 = toHand34(hand);
  const shanten = calculateShanten(hand34);

  return {
    hand,
    shanten,
    status: 'idle',
  };
}

let gameState = $state<GameState>(createInitialState());

export function getHand(): Hand | null {
  return gameState.hand;
}

export function getShanten(): number | null {
  return gameState.shanten;
}

export function getStatus(): GameStatus {
  return gameState.status;
}

export function getGameState(): GameState {
  return { ...gameState };
}

export function generateHand(): void {
  const hand = generateRandomHand();
  const hand34 = toHand34(hand);
  const shanten = calculateShanten(hand34);

  gameState.hand = hand;
  gameState.shanten = shanten;
  gameState.status = 'idle';
}

export function start(): void {
  gameState.status = 'ongoing';
}

export function stop(): void {
  gameState.status = 'answered';
}

export function resetGame(): void {
  gameState = $state<GameState>(createInitialState());
}
