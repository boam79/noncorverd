#!/usr/bin/env node

/**
 * 성능 테스트 스크립트
 * 
 * 비교 페이지의 렌더링 성능을 측정하기 위한 헬퍼 스크립트
 * 브라우저 콘솔에서 실행하거나 Playwright와 함께 사용
 * 
 * 사용 방법:
 *   1. 브라우저 개발자 도구 콘솔에서 실행
 *   2. Playwright 스크립트에서 evaluate로 실행
 */

/**
 * 비교 테이블 렌더링 성능 측정
 * 
 * @param {string} selector - 비교 테이블 선택자 (기본값: 'table, .comparison-table')
 * @returns {Promise<Object>} 성능 메트릭
 */
async function measureComparisonTablePerformance(selector = 'table, .comparison-table') {
  const metrics = {
    renderStart: 0,
    renderEnd: 0,
    renderDuration: 0,
    itemCount: 0,
    memoryUsage: null,
  };

  // Performance API 사용
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('comparison-table-start');
  }

  // 테이블 요소 찾기
  const table = document.querySelector(selector);
  if (!table) {
    return { error: '비교 테이블을 찾을 수 없습니다.' };
  }

  // 항목 수 계산
  const rows = table.querySelectorAll('tbody tr');
  metrics.itemCount = rows.length;

  // 렌더링 완료 대기 (약간의 지연 후 측정)
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('comparison-table-end');
    performance.measure(
      'comparison-table-render',
      'comparison-table-start',
      'comparison-table-end'
    );

    const measure = performance.getEntriesByName('comparison-table-render')[0];
    if (measure) {
      metrics.renderDuration = measure.duration;
    }
  }

  // 메모리 사용량 (Chrome만 지원)
  if (performance.memory) {
    metrics.memoryUsage = {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
    };
  }

  return metrics;
}

/**
 * React Query 캐시 상태 확인
 * 
 * @returns {Object} 캐시 메트릭
 */
function getReactQueryCacheMetrics() {
  // React Query 캐시는 window 객체에 접근해야 함
  // 실제 구현은 앱 구조에 따라 다를 수 있음
  return {
    cacheSize: 0,
    cacheHits: 0,
    cacheMisses: 0,
    note: 'React Query 캐시 메트릭은 앱 구조에 따라 구현 필요',
  };
}

/**
 * 네트워크 요청 분석
 * 
 * @returns {Array} 네트워크 요청 목록
 */
function analyzeNetworkRequests() {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) {
    return [];
  }

  const resources = performance.getEntriesByType('resource');
  const apiRequests = resources.filter(
    (entry) =>
      entry.name.includes('/api/') ||
      entry.name.includes('/opendata/') ||
      entry.name.includes('/pricing')
  );

  return apiRequests.map((entry) => ({
    url: entry.name,
    duration: entry.duration,
    size: entry.transferSize || 0,
    type: entry.initiatorType,
  }));
}

// 브라우저 환경에서 실행 시
if (typeof window !== 'undefined') {
  window.measureComparisonTablePerformance = measureComparisonTablePerformance;
  window.getReactQueryCacheMetrics = getReactQueryCacheMetrics;
  window.analyzeNetworkRequests = analyzeNetworkRequests;

  console.log('✅ 성능 측정 함수가 로드되었습니다.');
  console.log('사용 방법:');
  console.log('  measureComparisonTablePerformance()');
  console.log('  getReactQueryCacheMetrics()');
  console.log('  analyzeNetworkRequests()');
}

// Node.js 환경에서 실행 시 (문서화용)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    measureComparisonTablePerformance,
    getReactQueryCacheMetrics,
    analyzeNetworkRequests,
  };
}

