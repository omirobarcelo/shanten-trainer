#!/usr/bin/env tsx
/**
 * Probe .lq.Route.requestConnection param combinations.
 */

import { randomUUID } from 'crypto';
// @ts-expect-error mjsoul minimal .d.ts
import MJSoul from 'mjsoul';
import pb from 'protobufjs';
import { fetchServerConfig, pickGateway } from '../src/lib/mahjongsoul/server-config';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function main() {
  const base = (process.env.MJSOUL_BASE ?? '').replace(/\/+$/, '');
  const server = await fetchServerConfig(base, { userAgent: UA, withLiqi: true });
  const gateway = await pickGateway(server, UA);
  console.log('gateway=', gateway, 'version=', server.version);

  const root = pb.Root.fromJSON(server.liqi as any);
  const wrapper = root.lookupType('Wrapper');
  const mjsoul = new MJSoul({
    url: gateway,
    timeout: 10000,
    root,
    wrapper,
    wsOption: { origin: base, headers: { 'User-Agent': UA } },
  });
  await new Promise<void>(r => mjsoul.open(r));

  const cases = [
    { type: 0, route_id: '', timestamp: Date.now() },
    { type: 1, route_id: '', timestamp: Date.now() },
    { type: 2, route_id: '', timestamp: Date.now() },
    { type: 3, route_id: '', timestamp: Date.now() },
    { type: 1, route_id: randomUUID(), timestamp: Date.now() },
    { type: 1, route_id: randomUUID().replace(/-/g, ''), timestamp: Date.now() },
    { type: 0, route_id: randomUUID(), timestamp: Date.now() },
    { type: 2, route_id: randomUUID(), timestamp: Date.now() },
    { type: 1, timestamp: Date.now() },
    { route_id: '', timestamp: Date.now() },
    {},
  ];

  mjsoul.service = '.lq.Route.';
  for (const c of cases) {
    try {
      const res = await mjsoul.sendAsync('requestConnection', c);
      console.log('OK', JSON.stringify(c), '=>', JSON.stringify(res));
      break;
    } catch (e: any) {
      const code = e?.error?.code;
      console.log('FAIL code=' + code, JSON.stringify(c));
    }
  }
  mjsoul.close();
}

main().catch(e => {
  console.error(e.stack ?? e);
  process.exit(1);
});
