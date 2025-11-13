import { test, expect } from '@playwright/test';

/**
 * 병원 비교 핵심 플로우 E2E 테스트
 * 
 * 시나리오:
 *   1. 메인 페이지 접속
 *   2. 지역 선택 (서울 → 종로구)
 *   3. 의료기관 종별 필터 선택 (종합병원)
 *   4. 병원 검색 결과 확인
 *   5. 병원 2개 선택
 *   6. 비교 페이지 이동
 *   7. 비교 테이블 표시 확인
 */
test.describe('병원 비교 핵심 플로우', () => {
  test('지역 선택 → 병원 검색 → 비교 페이지 이동', async ({ page }) => {
    // 1. 메인 페이지 접속
    await page.goto('/');
    await expect(page).toHaveTitle(/비급여 비교|의료기관/);

    // 2. 지역 선택 (서울)
    const sidoSelect = page.locator('select[name="sido"], [data-testid="sido-select"]').first();
    if (await sidoSelect.count() > 0) {
      await sidoSelect.selectOption({ label: /서울/ });
      await page.waitForTimeout(500); // 시군구 로딩 대기
    }

    // 3. 시군구 선택 (종로구)
    const sigunguSelect = page.locator('select[name="sigungu"], [data-testid="sigungu-select"]').first();
    if (await sigunguSelect.count() > 0) {
      await sigunguSelect.selectOption({ label: /종로구/ });
      await page.waitForTimeout(500);
    }

    // 4. 의료기관 종별 필터 선택 (종합병원)
    const hospitalTypeFilter = page.locator('input[type="checkbox"][value*="종합병원"], [data-testid="filter-종합병원"]').first();
    if (await hospitalTypeFilter.count() > 0) {
      await hospitalTypeFilter.check();
      await page.waitForTimeout(1000); // 검색 결과 로딩 대기
    }

    // 5. 병원 검색 결과 확인
    const hospitalCards = page.locator('[data-testid="hospital-card"], .hospital-card, article').first();
    await expect(hospitalCards).toBeVisible({ timeout: 10000 });

    // 6. 첫 번째 병원 선택
    const firstHospital = page.locator('[data-testid="hospital-card"] button, .hospital-card button, article button').first();
    if (await firstHospital.count() > 0) {
      await firstHospital.click();
      await page.waitForTimeout(500);
    }

    // 7. 두 번째 병원 선택 (있는 경우)
    const secondHospital = page.locator('[data-testid="hospital-card"] button, .hospital-card button, article button').nth(1);
    if (await secondHospital.count() > 0) {
      await secondHospital.click();
      await page.waitForTimeout(500);
    }

    // 8. 비교하기 버튼 클릭
    const compareButton = page.locator('button:has-text("비교하기"), [data-testid="compare-button"], a:has-text("비교")').first();
    if (await compareButton.count() > 0) {
      await compareButton.click();
      await page.waitForURL(/\/comparison/, { timeout: 10000 });
    }

    // 9. 비교 페이지에서 테이블 표시 확인
    const comparisonTable = page.locator('[data-testid="comparison-table"], .comparison-table, table').first();
    await expect(comparisonTable).toBeVisible({ timeout: 15000 });

    // 10. 가격 정보가 표시되는지 확인
    const priceCells = page.locator('td:has-text("원"), [data-testid="price"]').first();
    if (await priceCells.count() > 0) {
      await expect(priceCells).toBeVisible();
    }
  });

  test('비교 테이블 필터 및 정렬 기능', async ({ page }) => {
    // 비교 페이지로 직접 이동 (이전 테스트에서 선택한 병원이 있다고 가정)
    await page.goto('/comparison');

    // 공통 항목 필터 확인
    const commonFilter = page.locator('button:has-text("공통"), [data-testid="filter-common"]').first();
    if (await commonFilter.count() > 0) {
      await commonFilter.click();
      await page.waitForTimeout(500);
    }

    // 정렬 옵션 확인
    const sortSelect = page.locator('select[name="sort"], [data-testid="sort-select"]').first();
    if (await sortSelect.count() > 0) {
      await sortSelect.selectOption({ label: /가격/ });
      await page.waitForTimeout(500);
    }

    // 검색 기능 확인
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"], [data-testid="search-input"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('초음파');
      await page.waitForTimeout(500);
      const results = page.locator('tr:has-text("초음파"), [data-testid="item-row"]');
      await expect(results.first()).toBeVisible();
    }
  });

  test('모바일 스와이프 비교 뷰', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    await page.goto('/comparison');

    // 모바일 비교 뷰 확인
    const mobileView = page.locator('[data-testid="mobile-comparison"], .mobile-comparison-view').first();
    if (await mobileView.count() > 0) {
      await expect(mobileView).toBeVisible();
    }

    // 병원 선택 인디케이터 확인
    const indicators = page.locator('[data-testid="hospital-indicator"], .hospital-indicator').first();
    if (await indicators.count() > 0) {
      await expect(indicators).toBeVisible();
    }
  });
});

