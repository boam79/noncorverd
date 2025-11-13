#!/usr/bin/env node

/**
 * 시군구 자동 검증 스크립트
 * - 백엔드 `/opendata/regions` 엔드포인트를 호출하여 전 시도의 시군구 데이터를 확인
 * - 누락/빈 목록을 콘솔에 표시하고 종료 코드로 상태를 반환
 *
 * 실행 방법:
 *   node scripts/check-sigungu.js --base http://54.180.251.93:3000 --token dev-client-token-12345
 */

const { argv } = process;

const DEFAULT_BASE_URL = 'http://54.180.251.93:3000';
const DEFAULT_TOKEN = process.env.CLIENT_OPENDATA_TOKEN || 'dev-client-token-12345';

function parseArgs() {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      args[key] = value;
      if (value !== true) {
        i += 1;
      }
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const baseUrl = args.base || DEFAULT_BASE_URL;
  const token = args.token || DEFAULT_TOKEN;

  const summary = [];
  const errors = [];

  const fetchJson = async (url) => {
    const res = await fetch(url, {
      headers: {
        'X-Client-Token': token,
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return res.json();
  };

  // 1. 시도 목록 호출
  console.log(`🔍 Fetching sido list from ${baseUrl}/opendata/regions`);
  let sidoList;
  try {
    const json = await fetchJson(`${baseUrl}/opendata/regions`);
    sidoList = Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error('❌ Failed to fetch sido list:', error.message);
    process.exit(1);
  }

  console.log(`✅ Received ${sidoList.length} sido entries`);

  // 2. 시군구 목록 검증
  for (const sido of sidoList) {
    const code = sido.code;
    const name = sido.name;
    const url = `${baseUrl}/opendata/regions?sido=${code}`;

    try {
      const json = await fetchJson(url);
      const data = Array.isArray(json.data) ? json.data : [];
      const count = data.length;

      summary.push({ code, name, count });

      if (count === 0) {
        errors.push({ code, name, reason: 'EMPTY_SIGUNGU_LIST' });
        console.warn(`⚠️ ${code} ${name}: no sigungu entries returned`);
      } else {
        console.log(`✅ ${code} ${name}: ${count} entries`);
      }
    } catch (error) {
      errors.push({ code, name, reason: error.message });
      console.error(`❌ ${code} ${name}: ${error.message}`);
    }
  }

  // 3. 요약 출력
  console.log('\n=== Summary ===');
  summary.forEach((item) => {
    console.log(`${item.code}\t${item.count}\t${item.name}`);
  });

  if (errors.length > 0) {
    console.log('\n=== Issues Found ===');
    errors.forEach((err) => console.log(`${err.code} ${err.name}: ${err.reason}`));
    process.exitCode = 2;
  } else {
    console.log('\n🎉 All sigungu data fetched successfully!');
    process.exitCode = 0;
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
