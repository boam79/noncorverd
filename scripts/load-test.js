#!/usr/bin/env node

/**
 * 간이 부하 테스트 스크립트
 *
 * Node.js 20 이상의 fetch API를 사용해 지정된 엔드포인트를 동시에 호출합니다.
 * 실제 부하 테스트 도구(k6, artillery 등)를 사용하기 전에 기본적인 안정성을 점검하는 용도로 사용하세요.
 */

const { setTimeout: sleep } = require('timers/promises');

const TARGET = process.env.LOAD_TEST_TARGET || 'https://example.com/opendata/hospitals?sido=11&sigungu=110000&type=종합병원';
const CONCURRENCY = Number(process.env.LOAD_TEST_CONCURRENCY || 10);
const DURATION_MS = Number(process.env.LOAD_TEST_DURATION || 60_000);

async function worker(id, stats) {
  const endTime = Date.now() + DURATION_MS;
  while (Date.now() < endTime) {
    const start = performance.now();
    try {
      const res = await fetch(TARGET, {
        headers: {
          'X-Client-Token': process.env.LOAD_TEST_TOKEN || 'dev-client-token-12345',
        },
        signal: AbortSignal.timeout(Number(process.env.LOAD_TEST_TIMEOUT || 5000)),
      });
      const duration = performance.now() - start;
      stats.count += 1;
      stats.sum += duration;
      stats.max = Math.max(stats.max, duration);
      if (!res.ok) {
        stats.errors.push({ status: res.status, body: await res.text(), duration });
      }
      if (process.env.LOAD_TEST_MODE === 'light') {
        // 응답 본문을 읽지 않고 헤더만 확인
      } else {
        await res.text();
      }
    } catch (error) {
      const duration = performance.now() - start;
      stats.errors.push({ error: error.message, duration });
    }
    if (process.env.LOAD_TEST_THINK) {
      await sleep(Number(process.env.LOAD_TEST_THINK));
    }
  }
}

async function main() {
  console.log('🚀 Load Test Start');
  console.log(`Target: ${TARGET}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Duration: ${DURATION_MS / 1000}s`);

  const stats = { count: 0, sum: 0, max: 0, errors: [] };
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i += 1) {
    workers.push(worker(i + 1, stats));
  }
  await Promise.all(workers);

  const avg = stats.count > 0 ? stats.sum / stats.count : 0;
  console.log('✅ Load Test Complete');
  console.log(`Requests: ${stats.count}`);
  console.log(`Average latency: ${avg.toFixed(2)} ms`);
  console.log(`Max latency: ${stats.max.toFixed(2)} ms`);
  console.log(`Errors: ${stats.errors.length}`);
  if (stats.errors.length > 0) {
    console.log('--- Error Samples ---');
    stats.errors.slice(0, 5).forEach((err, idx) => {
      console.log(`#${idx + 1}`, err);
    });
  }
}

main().catch((err) => {
  console.error('❌ Load test failed:', err);
  process.exit(1);
});
