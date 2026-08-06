/**
 * Shared env → MahjongSoulConfig helper for CLI scripts.
 */

import type { MahjongSoulConfig } from '../src/lib/mahjongsoul';

export function configFromEnv(): MahjongSoulConfig {
  const base = process.env.MJSOUL_BASE ?? 'https://game.mahjongsoul.com';
  const accessToken = process.env.MJSOUL_ACCESS_TOKEN || undefined;
  const yostarToken = process.env.MJSOUL_YOSTAR_TOKEN || undefined;
  const yostarUid = process.env.MJSOUL_YOSTAR_UID || undefined;
  const loginType = process.env.MJSOUL_LOGIN_TYPE
    ? parseInt(process.env.MJSOUL_LOGIN_TYPE, 10)
    : undefined;

  if (!accessToken && !(yostarToken && yostarUid)) {
    console.error(
      'Env vars required: either MJSOUL_ACCESS_TOKEN (CN/JP) ' +
        'or MJSOUL_YOSTAR_TOKEN + MJSOUL_YOSTAR_UID (EN/US Yostar)'
    );
    process.exit(1);
  }

  return { base, accessToken, yostarToken, yostarUid, loginType };
}
