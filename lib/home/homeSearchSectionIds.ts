/** 메인 검색·결과 스크롤 이동용 앵커 id (맥락 바·내부 링크와 공유) */
export const HOME_SECTION_IDS = {
  recent: 'home-section-recent',
  name: 'home-section-name',
  region: 'home-section-region',
  focus: 'home-section-focus',
  recommend: 'home-section-recommend',
  results: 'home-section-results',
  compareBar: 'compare-bar',
} as const;

export type HomeSearchScrollTarget = keyof typeof HOME_SECTION_IDS;

export function scrollToHomeSection(target: HomeSearchScrollTarget): void {
  if (typeof document === 'undefined') return;
  const id = HOME_SECTION_IDS[target];
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
