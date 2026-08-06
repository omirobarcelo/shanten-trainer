/**
 * Fetch Mahjong Soul server config: current version, liqi.json proto schema,
 * and gateway endpoints. Mirrors what the web client does on load.
 *
 * Two server shapes exist:
 *  - JP/CN: `config.ip[0].region_urls[]` — indirect service-discovery URLs
 *    that must be queried again with ?service=ws-gateway to yield a WSS host.
 *  - EN/US (Yostar): `config.ip[0].gateways[]` — direct https URLs; convert
 *    to wss + /gateway to get the endpoint.
 */

import type { ServerBundle } from './types';

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getJson(url: string, ua: string): Promise<any> {
  const res = await fetch(url, { headers: { 'User-Agent': ua } });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

export async function fetchServerConfig(
  base: string,
  opts: { userAgent?: string; withLiqi?: boolean } = {}
): Promise<ServerBundle> {
  const ua = opts.userAgent ?? DEFAULT_UA;

  const versionResp = await getJson(
    `${base}/version.json?randv=${Math.floor((1 + Math.random()) * Date.now())}`,
    ua
  );
  const version: string = versionResp.version;
  const clientVersionString = 'web-' + version.replace(/\.w$/, '');

  const resVer = await getJson(`${base}/resversion${version}.json`, ua);
  const liqiPrefix = resVer.res['res/proto/liqi.json'].prefix;

  let liqi: object | null = null;
  if (opts.withLiqi) {
    liqi = await getJson(`${base}/${liqiPrefix}/res/proto/liqi.json`, ua);
  }

  const svcCfg = await getJson(`${base}/v${version}/config.json`, ua);
  const ip = svcCfg.ip?.[0] ?? {};
  const serviceDiscoveryServers: string[] = (ip.region_urls ?? []).map(
    (o: any) => o.url
  );
  const directGateways: string[] = (ip.gateways ?? []).map((g: any) => g.url);

  return {
    version,
    clientVersionString,
    liqi,
    serviceDiscoveryServers,
    directGateways,
  };
}

export async function pickGateway(
  server: ServerBundle,
  ua: string = DEFAULT_UA
): Promise<string> {
  if (server.directGateways.length > 0) {
    return httpsToWss(server.directGateways[0]);
  }
  if (server.serviceDiscoveryServers.length === 0) {
    throw new Error('no gateways or service-discovery servers in config');
  }

  const fastest = await Promise.any(
    server.serviceDiscoveryServers.map(async url => {
      const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': ua } });
      if (res.ok) return url;
      throw new Error(`bad status ${res.status}`);
    })
  );

  const url = new URL(fastest);
  url.searchParams.set('protocol', 'ws');
  url.searchParams.set('ssl', 'true');
  url.searchParams.set('service', 'ws-gateway');

  const res = await fetch(url.toString(), { headers: { 'User-Agent': ua } });
  if (!res.ok) throw new Error(`gateway lookup failed: ${res.status}`);
  const body: any = await res.json();
  const wsHost: string = body.servers[0];
  return `wss://${wsHost}/gateway`;
}

function httpsToWss(url: string): string {
  const u = new URL(url);
  u.protocol = 'wss:';
  if (u.pathname === '/' || u.pathname === '') u.pathname = '/gateway';
  return u.toString();
}
