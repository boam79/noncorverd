#!/usr/bin/env node
/**
 * 배포/CI용 최소 HTTP 스모크: 홈·비교 페이지가 200으로 응답하는지 확인합니다.
 * 사용: SMOKE_BASE_URL=http://127.0.0.1:3000 node scripts/smoke-http.mjs
 */

const base = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000').replace(
  /\/+$/u,
  ''
);
const paths = ['/', '/comparison'];

async function main() {
  const failures = [];
  for (const path of paths) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { Accept: 'text/html' },
      });
      if (!res.ok) {
        failures.push(`${url} → ${res.status}`);
      } else {
        console.log(`OK ${res.status} ${url}`);
      }
    } catch (e) {
      failures.push(`${url} → ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (failures.length) {
    console.error('Smoke 실패:\n', failures.join('\n'));
    process.exit(1);
  }
  console.log('Smoke 통과');
}

main();
