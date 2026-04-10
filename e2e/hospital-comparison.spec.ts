import { test, expect } from '@playwright/test';

async function prepareComparisonPage(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page).toHaveTitle(/비급여 비교|의료기관/);

  // 시도 선택(서울)
  const sidoSelect = page.getByLabel('시도 선택');
  await expect(sidoSelect).toBeVisible();
  await sidoSelect.selectOption({ label: /서울/ });
  await page.waitForTimeout(700);

  // 시군구 선택(종로구)
  const sigunguSelect = page.getByLabel('시군구 선택');
  await expect(sigunguSelect).toBeVisible();
  await sigunguSelect.selectOption({ label: /종로구/ });
  await page.waitForTimeout(700);

  // 종별 선택(종합병원)
  await page.getByLabel('종합병원 선택').check();
  await page.waitForTimeout(1200);

  // 병원 2개 선택
  const selectButtons = page.locator('[data-testid="hospital-select-button"]');
  await expect(selectButtons.first()).toBeVisible({ timeout: 10000 });
  await selectButtons.nth(0).click();
  await page.waitForTimeout(300);
  await selectButtons.nth(1).click();
  await page.waitForTimeout(300);

  // 비교 페이지 이동
  await page.getByRole('button', { name: /비교하기/ }).click();
  await page.waitForURL(/\/comparison/, { timeout: 10000 });
}

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
    await prepareComparisonPage(page);

    // 비교 페이지에서 테이블 표시 확인
    const comparisonTable = page.locator('table').first();
    await expect(comparisonTable).toBeVisible({ timeout: 15000 });

    // 가격 정보 표시 확인
    await expect(page.locator('td:has-text("원")').first()).toBeVisible();
  });

  test('비교 테이블 필터 및 정렬 기능', async ({ page }) => {
    await prepareComparisonPage(page);

    // 공통 항목 필터 확인
    const commonFilter = page.getByRole('button', { name: /공통 항목/ }).first();
    await commonFilter.click();
    await page.waitForTimeout(500);

    // 정렬 옵션 확인
    const sortSelect = page.locator('#pricing-sort');
    await sortSelect.selectOption({ label: /평균가 높은 순/ });
    await page.waitForTimeout(500);

    // 검색 기능 확인
    const searchInput = page.getByPlaceholder(/항목명 또는 코드 검색/);
    await searchInput.fill('초음파');
    await page.waitForTimeout(500);
    await expect(page.locator('tr:has-text("초음파")').first()).toBeVisible();
  });

  test('비용 시뮬레이터 횟수 변경 시 총비용 갱신', async ({ page }) => {
    await prepareComparisonPage(page);

    const totalLabel = page.locator('text=예상 총비용:').first();
    await expect(totalLabel).toBeVisible();
    const before = (await totalLabel.textContent()) ?? '';

    const quantityInput = page.locator('input[id^="quantity-"]').first();
    await expect(quantityInput).toBeVisible();
    await quantityInput.fill('2');
    await page.waitForTimeout(500);

    const after = (await totalLabel.textContent()) ?? '';
    expect(after).not.toEqual(before);
  });

  test('추천 병원 불러오기 버튼 동작', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/비급여 비교|의료기관/);

    await page.getByLabel('시도 선택').selectOption({ label: /서울/ });
    await page.waitForTimeout(700);
    await page.getByLabel('종합병원 선택').check();
    await page.waitForTimeout(1200);

    const recommendButton = page.getByRole('button', { name: /추천 병원 불러오기/ });
    await expect(recommendButton).toBeVisible();
    await recommendButton.click();

    await expect(page.locator('text=추천 병원')).toBeVisible({ timeout: 15000 });
  });

  test('이상치 기준 안내 및 주의 배지 노출', async ({ page }) => {
    await prepareComparisonPage(page);

    await expect(page.locator('text=주의 항목')).toBeVisible();
    await expect(page.locator('text=주의 기준')).toBeVisible();
  });

  test('모바일 스와이프 비교 뷰', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    await prepareComparisonPage(page);

    // 모바일 비교 뷰 확인
    const mobileView = page.locator('text=예상 총비용:').first();
    await expect(mobileView).toBeVisible();

    // 병원 선택 인디케이터 확인
    const indicators = page.getByLabel(/병원 \d+로 이동/).first();
    await expect(indicators).toBeVisible();
  });
});

