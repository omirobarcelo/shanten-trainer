#!/usr/bin/env tsx
/**
 * Deep diagnostic: try raw oauth2Auth and print full request/response,
 * plus test HTTP-based auth endpoints on the Yostar server.
 */

import pb from 'protobufjs';
// @ts-expect-error mjsoul minimal .d.ts
import MJSoul from 'mjsoul';
import { fetchServerConfig, pickGateway } from '../src/lib/mahjongsoul/server-config';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function tryHttpEndpoints(base: string, yostarToken: string, yostarUid: string) {
  const paths = [
    '/api/auth/yostar/login',
    '/api/yostar_auth',
    '/api/oauth2/yostar',
    '/user/login_yostar',
    '/user/yostar_token_auth',
  ];
  console.log('\n=== HTTP probe ===');
  for (const p of paths) {
    try {
      const r = await fetch(base + p, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
        body: JSON.stringify({ token: yostarToken, uid: yostarUid }),
      });
      console.log(`POST ${p} -> ${r.status}`);
    } catch (e: any) {
      console.log(`POST ${p} -> ERR ${e.message}`);
    }
  }
}

async function main() {
  const base = (process.env.MJSOUL_BASE ?? '').replace(/\/+$/, '');
  const yostarToken = process.env.MJSOUL_YOSTAR_TOKEN!;
  const yostarUid = process.env.MJSOUL_YOSTAR_UID!;
  const accessToken = process.env.MJSOUL_ACCESS_TOKEN;

  console.log('base=', base);

  const server = await fetchServerConfig(base, { userAgent: UA });
  console.log('version=', server.version);
  console.log('clientVersionString=', server.clientVersionString);
  console.log('directGateways=', server.directGateways);

  await tryHttpEndpoints(base, yostarToken, yostarUid);

  const gateway = await pickGateway(server, UA);
  console.log('\ngateway=', gateway);

  const mjsoul = new MJSoul({
    url: gateway,
    timeout: 15000,
    wsOption: { origin: base, headers: { 'User-Agent': UA } },
  });
  await new Promise<void>(res => mjsoul.open(res));
  console.log('WSS connected');

  const attempts: Array<{ label: string; method: string; body: any }> = [
    {
      label: 'oauth2Auth type=8 code=yostarToken uid=yostarUid',
      method: 'oauth2Auth',
      body: {
        type: 8,
        code: yostarToken,
        uid: yostarUid,
        client_version_string: server.clientVersionString,
      },
    },
    {
      label: 'oauth2Auth type=8 code=yostarUid uid=yostarToken (swapped)',
      method: 'oauth2Auth',
      body: {
        type: 8,
        code: yostarUid,
        uid: yostarToken,
        client_version_string: server.clientVersionString,
      },
    },
    {
      label: 'oauth2Check type=8 access_token=yostarToken',
      method: 'oauth2Check',
      body: { type: 8, access_token: yostarToken },
    },
  ];
  if (accessToken) {
    attempts.push({
      label: 'oauth2Check type=8 access_token=MJSOUL_ACCESS_TOKEN',
      method: 'oauth2Check',
      body: { type: 8, access_token: accessToken },
    });
    attempts.push({
      label: 'oauth2Check type=10 access_token=MJSOUL_ACCESS_TOKEN',
      method: 'oauth2Check',
      body: { type: 10, access_token: accessToken },
    });
  }

  for (const a of attempts) {
    console.log(`\n--- ${a.label} ---`);
    console.log('REQ:', JSON.stringify(a.body).slice(0, 200));
    try {
      const res = await mjsoul.sendAsync(a.method, a.body);
      console.log('RES:', JSON.stringify(res).slice(0, 500));
    } catch (e: any) {
      const dump = JSON.stringify(e, Object.getOwnPropertyNames(e));
      const err = e?.error;
      const code = err?.code;
      const u32 = err?.u32_params;
      const str = err?.str_params;
      console.log('ERR:', dump.slice(0, 400));
      console.log('code=', code, 'u32_params=', u32, 'str_params=', str);
    }
  }

  mjsoul.close();
}

main().catch(err => {
  console.error(err.stack ?? err);
  process.exit(1);
});
