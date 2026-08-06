/**
 * Mahjong Soul API wrapper types.
 * Node-only. Do not import from browser bundle.
 */

export interface MahjongSoulConfig {
  /**
   * Direct majsoul session token. Use for CN/JP servers.
   * For Yostar (EN/US) prefer yostarToken + yostarUid — they mint a fresh
   * session token per connect via oauth2Auth, avoiding staleness.
   */
  accessToken?: string;
  /** Yostar SDK token from localStorage `yostar_token` (EN/US). */
  yostarToken?: string;
  /** Yostar UID from localStorage `yostar_uid` (EN/US). */
  yostarUid?: string;
  /**
   * Server base URL. Determines which server's account the token belongs to.
   * - JP: https://game.mahjongsoul.com
   * - EN: https://mahjongsoul.game.yo-star.com
   * - CN: https://game.maj-soul.com
   */
  base: string;
  /** Override auto-discovered WSS gateway. */
  gateway?: string;
  /** RPC timeout in ms. Default 15000. */
  timeoutMs?: number;
  /** User agent for HTTP + WSS handshakes. */
  userAgent?: string;
  /**
   * If true, fetch a fresh liqi.json from the game CDN instead of using the
   * one bundled with the `mjsoul` npm dep. Slower but survives proto updates.
   */
  refreshProto?: boolean;
  /**
   * oauth2 login type. Auto-detected from server shape if omitted:
   *   - Yostar (EN/US, direct gateways): 8
   *   - CN/JP (service discovery): 10
   */
  loginType?: number;
}

export interface ServerBundle {
  version: string;
  clientVersionString: string;
  liqi: object | null;
  /** Indirect service-discovery URLs (JP/CN shape). */
  serviceDiscoveryServers: string[];
  /** Direct https gateway URLs (EN/US Yostar shape). */
  directGateways: string[];
}

export interface GameSummary {
  uuid: string;
  startTime: number;
  endTime: number;
  mode: number;
  players: Array<{
    seat: number;
    accountId: number;
    nickname: string;
    finalPoint: number;
  }>;
}

export interface StartingHand {
  /** Round index. chang*4 + ju. 0=E1, 4=S1, etc. */
  round: number;
  /** Round wind: 0=East, 1=South, 2=West. */
  chang: number;
  /** Dealer seat (0-3). */
  ju: number;
  /** Honba count. */
  ben: number;
  /** Seat this hand belongs to (0-3). */
  seat: number;
  /** 13 tiles as majsoul strings, e.g. "1m", "0p" (red 5), "1z". */
  tiles: string[];
}

export interface RoundLog {
  round: number;
  chang: number;
  ju: number;
  ben: number;
  /** Starting hands for all four seats. */
  hands: StartingHand[];
  /** Dora indicator tile (majsoul string). */
  doraIndicator?: string;
}

export interface GameLog {
  uuid: string;
  players: Array<{ seat: number; accountId: number; nickname: string }>;
  rounds: RoundLog[];
}
