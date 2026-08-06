/**
 * Mahjong Soul WSS client. Wraps `mjsoul` npm package with:
 *  - server config discovery (version + gateway)
 *  - oauth2Login using an access token
 *  - fetchGameRecord with protobuf decoding of the game action stream
 *
 * Node-only. Do not import from browser code — access tokens must not ship
 * in the browser bundle.
 */

import { randomUUID } from 'crypto';
import pb from 'protobufjs';
import MJSoul from 'mjsoul';

import type { MahjongSoulConfig, ServerBundle } from './types';
import { fetchServerConfig, pickGateway } from './server-config';

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface RawGameRecord {
  head: any;
  data: any[];
}

export class MahjongSoulClient {
  private cfg: {
    accessToken?: string;
    yostarToken?: string;
    yostarUid?: string;
    base: string;
    gateway?: string;
    timeoutMs: number;
    userAgent: string;
    refreshProto: boolean;
    loginType?: number;
  };
  private mjsoul: any = null;
  private server?: ServerBundle;
  private loggedIn = false;
  /** Minted majsoul session token (via oauth2Auth) if using Yostar creds. */
  private mintedToken?: string;

  constructor(cfg: MahjongSoulConfig) {
    if (!cfg.base) throw new Error('base required');
    const hasYostar = cfg.yostarToken && cfg.yostarUid;
    if (!cfg.accessToken && !hasYostar) {
      throw new Error('either accessToken or (yostarToken + yostarUid) required');
    }
    this.cfg = {
      accessToken: cfg.accessToken,
      yostarToken: cfg.yostarToken,
      yostarUid: cfg.yostarUid,
      base: cfg.base.replace(/\/+$/, ''),
      gateway: cfg.gateway,
      timeoutMs: cfg.timeoutMs ?? 15000,
      userAgent: cfg.userAgent ?? DEFAULT_UA,
      refreshProto: cfg.refreshProto ?? false,
      loginType: cfg.loginType,
    };
  }

  async connect(): Promise<void> {
    this.server = await fetchServerConfig(this.cfg.base, {
      userAgent: this.cfg.userAgent,
      withLiqi: true,
    });

    const gateway =
      this.cfg.gateway ?? (await pickGateway(this.server, this.cfg.userAgent));

    const mjsoulOpts: any = {
      url: gateway,
      timeout: this.cfg.timeoutMs,
      wsOption: {
        origin: this.cfg.base,
        headers: { 'User-Agent': this.cfg.userAgent },
      },
    };
    if (this.server.liqi) {
      const root = pb.Root.fromJSON(this.server.liqi as any);
      mjsoulOpts.root = root;
      mjsoulOpts.wrapper = root.lookupType('Wrapper');
    }

    this.mjsoul = new MJSoul(mjsoulOpts);
    await new Promise<void>((resolve, reject) => {
      const onErr = (e: any) => reject(e);
      this.mjsoul.once('error', onErr);
      this.mjsoul.open(() => {
        this.mjsoul.off('error', onErr);
        resolve();
      });
    });

    await this.requestRouteConnection();
    await this.login();
  }

  /**
   * Pre-handshake required by Mahjong Soul post-2026 protocol.
   * Calls .lq.Route.requestConnection before any Lobby method. Best-effort:
   * if the current proto (bundled) lacks the Route service, skip silently.
   */
  private async requestRouteConnection(): Promise<void> {
    const root = this.mjsoul.root as pb.Root;
    try {
      root.lookup('.lq.Route.requestConnection');
    } catch {
      return;
    }
    const prev = this.mjsoul.service;
    this.mjsoul.service = '.lq.Route.';
    try {
      await this.mjsoul.sendAsync('requestConnection', {
        type: 1,
        route_id: randomUUID(),
        timestamp: Date.now(),
      });
    } catch (err: any) {
      const code = err?.error?.code;
      if (code !== undefined) {
        throw new Error(`requestConnection failed: code=${code}`);
      }
      throw err;
    } finally {
      this.mjsoul.service = prev;
    }
  }

  private async login(): Promise<void> {
    if (!this.server) throw new Error('connect() first');
    const type =
      this.cfg.loginType ?? (this.server.directGateways.length > 0 ? 8 : 10);

    let token: string;
    if (this.cfg.yostarToken && this.cfg.yostarUid) {
      const authRes = await this.mjsoul.sendAsync('oauth2Auth', {
        type,
        code: this.cfg.yostarToken,
        uid: this.cfg.yostarUid,
        client_version_string: this.server.clientVersionString,
      });
      if (!authRes.access_token) {
        throw new Error(`oauth2Auth failed (type=${type}) — yostar creds invalid or wrong type`);
      }
      token = authRes.access_token;
      this.mintedToken = token;
    } else {
      token = this.cfg.accessToken!;
    }

    const check = await this.mjsoul.sendAsync('oauth2Check', {
      type,
      access_token: token,
    });
    if (!check.has_account) {
      throw new Error(
        `oauth2Check: has_account=false (token invalid or wrong login type=${type})`
      );
    }

    const payload = {
      type,
      access_token: token,
      client_version_string: this.server.clientVersionString,
      client_version: { resource: this.server.version },
      device: {
        hardware: 'pc',
        is_browser: true,
        os: 'windows',
        os_version: 'win10',
        platform: 'pc',
        sale_platform: 'web',
        software: 'Chrome',
      },
      random_key: randomUUID(),
      reconnect: false,
    };
    const res = await this.mjsoul.sendAsync('oauth2Login', payload);
    if (!res.account_id) throw new Error('oauth2Login: no account_id (token invalidated)');
    this.loggedIn = true;
  }

  /** Fresh majsoul session token minted this run. Only set if using Yostar creds. */
  getMintedAccessToken(): string | undefined {
    return this.mintedToken;
  }

  private ensureReady() {
    if (!this.loggedIn) throw new Error('not logged in; call connect() first');
  }

  /**
   * Fetch and decode a game record by Majsoul UUID (the log id, e.g.
   * `240101-abcdef12-3456-...`). Some very old logs use `data_url` — fetched
   * via HTTP when present.
   */
  async fetchGameRecord(uuid: string): Promise<RawGameRecord> {
    this.ensureReady();
    if (!this.server) throw new Error('no server config');

    const log = await this.mjsoul.sendAsync('fetchGameRecord', {
      game_uuid: uuid,
      client_version_string: this.server.clientVersionString,
    });

    let raw: Uint8Array = log.data;
    if (log.data_url) {
      const res = await fetch(log.data_url, {
        headers: { 'User-Agent': this.cfg.userAgent },
      });
      if (!res.ok) throw new Error(`data_url fetch failed: ${res.status}`);
      raw = new Uint8Array(await res.arrayBuffer());
    }

    const root = this.mjsoul.root as pb.Root;
    const wrapper = this.mjsoul.wrapper;
    const detailRecords = wrapper.decode(raw) as any;
    const payloadName = detailRecords.name.substring(4);
    const payload: any = root
      .lookupType(payloadName)
      .decode(detailRecords.data);

    let actions: any[];
    if (payload.version < 210715 && payload.records?.length > 0) {
      actions = payload.records.map((buf: Uint8Array) => {
        const w = wrapper.decode(buf) as any;
        return { name: w.name, data: root.lookupType(w.name).decode(w.data) };
      });
    } else {
      actions = (payload.actions ?? [])
        .filter((a: any) => a.result && a.result.length > 0)
        .map((a: any) => {
          const w = wrapper.decode(a.result) as any;
          return { name: w.name, data: root.lookupType(w.name).decode(w.data) };
        });
    }

    return { head: log.head, data: actions };
  }

  /**
   * List the caller's recent game records. `count` defaults to 10 (majsoul cap
   * is around 30 per call).
   */
  async listRecentGames(count = 10): Promise<any[]> {
    this.ensureReady();
    const res = await this.mjsoul.sendAsync('fetchGameRecordList', {
      start: 0,
      count,
      type: 0,
    });
    return res.record_list ?? [];
  }

  close(): void {
    if (this.mjsoul) this.mjsoul.close();
    this.loggedIn = false;
  }
}
