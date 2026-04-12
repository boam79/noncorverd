'use client';

import { useMemo } from 'react';
import type { Region } from '@/types';

export interface HomeSearchContextBarProps {
  sido?: string;
  sigungu?: string;
  sidoList: Region[];
  sigunguList: Region[];
  clinicalFocusLabel: string;
  hospitalNameCommitted: string;
  selectedCount: number;
  maxSelection: number;
}

function chipClass(active: boolean) {
  return [
    'inline-flex max-w-full items-center gap-1 truncate rounded-full border px-3 py-1 text-xs font-medium transition-colors',
    active
      ? 'border-primary-200 bg-primary-50 text-primary-900'
      : 'border-line bg-surface text-gray-600',
  ].join(' ');
}

/**
 * 스크롤 시 상단에 고정되는 검색 맥락 요약(지역·관심 분야·선택 수).
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

  return (
    <div
      className="sticky top-0 z-30 -mx-4 border-b border-line/90 bg-page/95 px-4 py-2.5 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-page/85 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      aria-label="현재 검색 맥락"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <span className={chipClass(!!sido)} title={regionLabel}>
          📍 {regionLabel}
        </span>
        <span className={chipClass(!!focusChip)} title="관심 분야">
          {focusChip ? `🎯 ${clinicalFocusLabel}` : '🎯 관심 분야 없음'}
        </span>
        <span className={chipClass(!!queryChip)} title="병원명 검색">
          {queryChip ? `🔎 “${hospitalNameCommitted.trim()}”` : '🔎 병원명 검색 없음'}
        </span>
        <span
          className={chipClass(selectedCount > 0)}
          title="비교 예정 병원"
        >
          ✅ 선택 {selectedCount}/{maxSelection}
        </span>
      </div>
    </div>
  );
}
