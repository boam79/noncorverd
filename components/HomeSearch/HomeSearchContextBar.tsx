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
    'inline-flex max-w-full items-center gap-1 truncate rounded-full border px-3 py-1 text-xs font-medium transition-colors',
    active
      ? 'border-primary-200 bg-primary-50 text-primary-900'
      : 'border-line bg-surface text-gray-600',
    interactive
      ? 'cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1'
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
      className="sticky top-0 z-30 -mx-4 border-b border-line/90 bg-page/95 px-4 py-2.5 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-page/85 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
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
            📍 {regionLabel}
          </button>
        ) : (
          <span className={chipClass(!!sido, false)} title={regionLabel}>
            📍 {regionLabel}
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
            {focusChip ? `🎯 ${clinicalFocusLabel}` : '🎯 관심 분야 없음'}
          </button>
        ) : (
          <span className={chipClass(!!focusChip, false)} title="관심 분야">
            {focusChip ? `🎯 ${clinicalFocusLabel}` : '🎯 관심 분야 없음'}
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
            {queryChip ? `🔎 “${hospitalNameCommitted.trim()}”` : '🔎 병원명 검색 없음'}
          </button>
        ) : (
          <span className={chipClass(!!queryChip, false)} title="병원명 검색">
            {queryChip ? `🔎 “${hospitalNameCommitted.trim()}”` : '🔎 병원명 검색 없음'}
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
            ✅ 선택 {selectedCount}/{maxSelection}
          </button>
        ) : (
          <span className={chipClass(selectedCount > 0, false)} title="비교 예정 병원">
            ✅ 선택 {selectedCount}/{maxSelection}
          </span>
        )}
      </div>
    </div>
  );
}
