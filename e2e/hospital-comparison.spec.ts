import { test, expect } from '@playwright/test';
import {
  installComparisonFlowMocks,
  installObstetricsRecommendMocks,
} from './fixtures/opendata-routes';

async function prepareComparisonPage(page: import('@playwright/test').Page) {
  await installComparisonFlowMocks(page);
  await page.goto('/');
  await expect(page).toHaveTitle(/비급여 비교|의료기관/);

  // 시도 선택(서울) — Playwright selectOption의 label은 문자열만 지원(정규식 불가)
  const sidoSelect = page.getByLabel('시도 선택');
  await expect(sidoSelect).toBeVisible();
  await expect(sidoSelect).toBeEnabled({ timeout: 30000 });
  await expect(sidoSelect.locator('option[value="11"]')).toHaveCount(1, {
    timeout: 30000,
  });
  await sidoSelect.selectOption('11');
  await page.waitForTimeout(800);

  // 시군구 선택(종로구) — API 라벨이 "서울특별시 종로구" 등일 수 있어 hasText로 value 확보
  const sigunguSelect = page.getByLabel('시군구 선택');
  await expect(sigunguSelect).toBeEnabled({ timeout: 30000 });
  const jongnoOpt = sigunguSelect.locator('option').filter({ hasText: '종로' }).first();
  await expect(jongnoOpt).toBeAttached({ timeout: 20000 });
  const jongnoVal = await jongnoOpt.getAttribute('value');
  expect(jongnoVal, '종로구 옵션 value').toBeTruthy();
  await sigunguSelect.selectOption(jongnoVal!);
  await page.waitForTimeout(1200);

  // 병원 2개 선택
  const selectButtons = page.locator('[data-testid="hospital-select-button"]');
  await expect(selectButtons.first()).toBeVisible({ timeout: 10000 });
  await selectButtons.nth(0).click();
  await page.waitForTimeout(300);
  await selectButtons.nth(1).click();
  await page.waitForTimeout(300);

  // 비교 페이지 이동 (CompareBar는 Next.js Link → role=link)
  await page.getByRole('link', { name: /비교하기/ }).click();
  await page.waitForURL(/\/comparison/, { timeout: 10000 });
}

/**
 * 병원 비교 핵심 플로우 E2E 테스트
 * 
 * 시나리오:
 *   1. 메인 페이지 접속
 *   2. 지역 선택 (서울 → 종로구)
 *   3. 병원 검색 결과 확인
 *   4. 병원 2개 선택
 *   5. 비교 페이지 이동
 *   6. 비교 테이블 표시 확인
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
    await sortSelect.selectOption({ label: '평균가 높은 순' });
    await page.waitForTimeout(500);

    // 검색 기능 확인
    const searchInput = page.getByPlaceholder(/항목명 또는 코드 검색/);
    await searchInput.fill('초음파');
    await page.waitForTimeout(500);
    await expect(page.locator('tr:has-text("초음파")').first()).toBeVisible();
  });

  test('비용 시뮬레이터 횟수 변경 시 총비용 갱신', async ({ page }) => {
    await prepareComparisonPage(page);

    // 데스크톱 테이블 헤더의 총비용(모바일 md:hidden 블록의 동일 문구는 hidden 처리됨)
    const totalLabel = page.locator('table').getByText('예상 총비용:').first();
    await expect(totalLabel).toBeVisible({ timeout: 15000 });
    const before = (await totalLabel.textContent()) ?? '';

    const quantityInput = page.locator('input[id^="quantity-"]').first();
    await expect(quantityInput).toBeVisible();
    await quantityInput.fill('2');
    await page.waitForTimeout(500);

    const after = (await totalLabel.textContent()) ?? '';
    expect(after).not.toEqual(before);
  });

  test('추천 병원 불러오기 버튼 동작', async ({ page }) => {
    await installComparisonFlowMocks(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/비급여 비교|의료기관/);

    const sido = page.getByLabel('시도 선택');
    await expect(sido.locator('option[value="11"]')).toHaveCount(1, {
      timeout: 30000,
    });
    await sido.selectOption('11');
    await page.waitForTimeout(800);

    const sigunguSelect = page.getByLabel('시군구 선택');
    await expect(sigunguSelect).toBeEnabled({ timeout: 30000 });
    const jongnoOpt = sigunguSelect.locator('option').filter({ hasText: '종로' }).first();
    await expect(jongnoOpt).toBeAttached({ timeout: 20000 });
    const jongnoVal = await jongnoOpt.getAttribute('value');
    expect(jongnoVal).toBeTruthy();
    await sigunguSelect.selectOption(jongnoVal!);
    await page.waitForTimeout(1200);

    const recommendButton = page.getByRole('button', { name: /추천 병원 불러오기/ });
    await expect(recommendButton).toBeVisible();
    await recommendButton.click();

    await expect(
      page.getByText(/추천 병원 \d+곳을 자동 선택했습니다/)
    ).toBeVisible({ timeout: 15000 });
  });

  test('이상치 기준 안내 및 주의 배지 노출', async ({ page }) => {
    await prepareComparisonPage(page);

    await expect(page.getByText(/주의 항목 \d+건/)).toBeVisible();
    await expect(page.getByText(/병원별 Top3 이상치/)).toBeVisible();
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

  test('관심 분야 라디오 그룹 노출', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('radiogroup', { name: '관심 분야 (선택)' })
    ).toBeVisible();
  });

  test('관심 분야 선택 후 추천 병원 불러오기', async ({ page }) => {
    await installObstetricsRecommendMocks(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/비급여 비교|의료기관/);

    const sidoSelect = page.getByLabel('시도 선택');
    await expect(sidoSelect).toBeEnabled({ timeout: 30000 });
    await expect(sidoSelect.locator('option[value="11"]')).toHaveCount(1, {
      timeout: 15000,
    });
    await sidoSelect.selectOption('11');
    await page.waitForTimeout(600);

    const sigunguSelect = page.getByLabel('시군구 선택');
    await expect(sigunguSelect).toBeEnabled({ timeout: 30000 });
    const jongnoOpt = sigunguSelect.locator('option').filter({ hasText: '종로' }).first();
    await expect(jongnoOpt).toBeAttached({ timeout: 20000 });
    const jongnoVal = await jongnoOpt.getAttribute('value');
    expect(jongnoVal).toBeTruthy();
    await sigunguSelect.selectOption(jongnoVal!);
    await page.waitForTimeout(800);

    await page.getByRole('radio', { name: '산부인과' }).check();
    await page.waitForTimeout(200);

    const recommendButton = page.getByRole('button', { name: /추천 병원 불러오기/ });
    await expect(recommendButton).toBeEnabled({ timeout: 15000 });
    await recommendButton.click();

    await expect(
      page.getByText(/추천 병원 \d+곳을 자동 선택했습니다/)
    ).toBeVisible({ timeout: 15000 });
  });
});

