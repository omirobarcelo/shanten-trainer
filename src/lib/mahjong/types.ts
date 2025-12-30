/**
 * Mahjong tile types and enums
 */

export enum Suit {
  MANZU = 'm', // Characters
  PINZU = 'p', // Dots
  SOUZU = 's', // Bamboo
  JIHAI = 'z', // Honors (winds + dragons)
}

export enum Wind {
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
  NORTH = 4,
}

export enum Dragon {
  WHITE = 5,
  GREEN = 6,
  RED = 7,
}

/**
 * Represents a single tile
 * For numbered suits (m, p, s): value is 0-9
 *   - 0 = red 5 tile
 *   - 1-9 = normal tiles 1-9
 * For honors (z): value is 1-7
 *   - 1-4 = winds (east, south, west, north)
 *   - 5-7 = dragons (white, green, red)
 */
export interface Tile {
  suit: Suit;
  value: number; // 0-9 for m/p/s (0=red5, 1-9=normal), 1-7 for z
}

/**
 * Represents a hand as an array of tiles
 * A standard hand has 13 tiles (or 14 when in tenpai)
 */
export type Hand = Tile[];

/**
 * Represents a hand in a compact format: array of 34 integers
 * Each index represents a tile type, value is count of that tile
 * Note: Red 5 and normal 5 are treated as the same tile type in Hand34
 * Index mapping:
 * 0-8:   manzu 1-9 (index 4 = tile 5, can be red or normal)
 * 9-17:  pinzu 1-9 (index 13 = tile 5, can be red or normal)
 * 18-26: souzu 1-9 (index 22 = tile 5, can be red or normal)
 * 27-33: jihai (east, south, west, north, white, green, red)
 */
export type Hand34 = number[];
