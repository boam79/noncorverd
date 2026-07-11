'use client';

import { useMemo } from 'react';
import type { Region } from '@/types';
import type { HomeSearchScrollTarget } from '@/lib/home/homeSearchSectionIds';

export interface HomeSearchContextBarProps {
  sido?: string;
  sigungu?: string;
  sidoList: Region[];
  sigunguList: Region[];
  clinicalFocusLabel: string;
  hospitalNameCommitted: string;
  selectedCount: number;
  maxSelection: number;
  /** 칩 클릭 시 해당 블록으로 스크롤 */
  onScrollToSection?: (target: HomeSearchScrollTarget) => void;
}

function chipClass(active: boolean, interactive: boolean) {
  return [
    'inline-flex max-w-full items-center gap-1 truncate rounded-control border px-3 py-1.5 text-xs font-medium transition-colors',
    active
      ? 'border-brand-200 bg-brand-50 text-brand-900'
      : 'border-line bg-surface text-ink-muted',
    interactive
      ? 'cursor-pointer hover:border-brand-300 hover:bg-brand-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1'
      : '',
  ].join(' ');
}

/**
 * 스크롤 시 상단에 고정되는 검색 맥락 요약(지역·관심 분야·선택 수).
 * 칩은 클릭 시 해당 입력 블록으로 이동할 수 있음.
 */
export function HomeSearchContextBar({
  sido,
  sigungu,
  sidoList,
  sigunguList,
  clinicalFocusLabel,
  hospitalNameCommitted,
  selectedCount,
  maxSelection,
  onScrollToSection,
}: HomeSearchContextBarProps) {
  const sidoName = useMemo(
    () => (sido ? sidoList.find((r) => r.code === sido)?.name : undefined),
    [sido, sidoList]
  );
  const sigunguName = useMemo(
    () => (sigungu ? sigunguList.find((r) => r.code === sigungu)?.name : undefined),
    [sigungu, sigunguList]
  );

  const regionLabel = useMemo(() => {
    if (!sido && !sigungu) return '지역 미선택';
    const a = sidoName ?? sido ?? '';
    const b = sigunguName ?? sigungu ?? '';
    if (b) return `${a} · ${b}`;
    return a || '지역 설정됨';
  }, [sido, sigungu, sidoName, sigunguName]);

  const focusChip = clinicalFocusLabel && clinicalFocusLabel !== '선택 안 함';
  const queryChip = hospitalNameCommitted.trim().length > 0;
  const interactive = Boolean(onScrollToSection);

  const go = (target: HomeSearchScrollTarget) => {
    onScrollToSection?.(target);
  };

  return (
    <div
      className="sticky top-14 z-30 -mx-4 border-b border-line/90 bg-surface-glass px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      aria-label="현재 검색 맥락"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        {interactive ? (
          <button
            type="button"
            className={chipClass(!!sido, true)}
            title={regionLabel}
            aria-label="지역 조건으로 스크롤"
            onClick={() => go('region')}
          >
            지역 · {regionLabel}
          </button>
        ) : (
          <span className={chipClass(!!sido, false)} title={regionLabel}>
            지역 · {regionLabel}
          </span>
        )}
        {interactive ? (
          <button
            type="button"
            className={chipClass(!!focusChip, true)}
            title="관심 분야"
            aria-label="관심 분야로 스크롤"
            onClick={() => go('focus')}
          >
            {focusChip ? `관심 · ${clinicalFocusLabel}` : '관심 분야 없음'}
          </button>
        ) : (
          <span className={chipClass(!!focusChip, false)} title="관심 분야">
            {focusChip ? `관심 · ${clinicalFocusLabel}` : '관심 분야 없음'}
          </span>
        )}
        {interactive ? (
          <button
            type="button"
            className={chipClass(!!queryChip, true)}
            title="병원명 검색"
            aria-label="의료기관명 검색으로 스크롤"
            onClick={() => go('name')}
          >
            {queryChip ? `이름 · ${hospitalNameCommitted.trim()}` : '병원명 검색 없음'}
          </button>
        ) : (
          <span className={chipClass(!!queryChip, false)} title="병원명 검색">
            {queryChip ? `이름 · ${hospitalNameCommitted.trim()}` : '병원명 검색 없음'}
          </span>
        )}
        {interactive ? (
          <button
            type="button"
            className={chipClass(selectedCount > 0, true)}
            title="비교 예정 병원"
            aria-label={
              selectedCount > 0 ? '비교 바로 스크롤' : '검색 결과 목록으로 스크롤'
            }
            onClick={() => go(selectedCount > 0 ? 'compareBar' : 'results')}
          >
            선택 {selectedCount}/{maxSelection}
          </button>
        ) : (
          <span className={chipClass(selectedCount > 0, false)} title="비교 예정 병원">
            선택 {selectedCount}/{maxSelection}
          </span>
        )}
      </div>
    </div>
  );
}
