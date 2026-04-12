import type { Page } from '@playwright/test';

/** 모바일에서 관심 분야 블록이 접혀 있으면 펼친다 */
export async function expandHomeClinicalIfCollapsed(page: Page): Promise<void> {
  const btn = page.getByTestId('home-clinical-toggle');
  if (!(await btn.isVisible().catch(() => false))) return;
  const txt = (await btn.textContent()) ?? '';
  if (txt.includes('펼치기')) await btn.click();
}

/** 모바일에서 추천 블록이 접혀 있으면 펼친다 */
export async function expandHomeRecommendIfCollapsed(page: Page): Promise<void> {
  const btn = page.getByTestId('home-recommend-toggle');
  if (!(await btn.isVisible().catch(() => false))) return;
  const txt = (await btn.textContent()) ?? '';
  if (txt.includes('펼치기')) await btn.click();
}
