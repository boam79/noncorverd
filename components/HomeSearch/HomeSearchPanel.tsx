'use client';

import { useState } from 'react';
import { RegionSelector } from '@/components/RegionSelector/RegionSelector';
import { ClinicalFocusSelector } from '@/components/ClinicalFocusFilter/ClinicalFocusSelector';
import type { ClinicalFocusId } from '@/lib/constants/clinicalFocusBuckets';
import type { HospitalRecommendation } from '@/lib/utils/recommendation';
import type { RecentSearchEntry } from '@/lib/recentSearches';

export interface HomeSearchPanelProps {
  recentList: RecentSearchEntry[];
  onApplyRecent: (entry: RecentSearchEntry) => void;
  hospitalNameInput: string;
  onHospitalNameInputChange: (value: string) => void;
  hospitalNameCommitted: string;
  onSearchSubmit: () => void;
  sido?: string;
  sigungu?: string;
  onRegionChange: (newSido?: string, newSigungu?: string) => void;
  clinicalFocus: ClinicalFocusId;
  onClinicalFocusChange: (value: ClinicalFocusId) => void;
  filteredHospitalCount: number;
  isRecommending: boolean;
  onAutoRecommend: () => void;
  recommendMessage: string;
  recommendBreakdown: HospitalRecommendation[] | null;
  clinicalFocusExcludedAll: boolean;
  clinicalFocusLabel: string;
}

export function HomeSearchPanel({
  recentList,
  onApplyRecent,
  hospitalNameInput,
  onHospitalNameInputChange,
  hospitalNameCommitted,
  onSearchSubmit,
  sido,
  sigungu,
  onRegionChange,
  clinicalFocus,
  onClinicalFocusChange,
  filteredHospitalCount,
  isRecommending,
  onAutoRecommend,
  recommendMessage,
  recommendBreakdown,
  clinicalFocusExcludedAll,
  clinicalFocusLabel,
}: HomeSearchPanelProps) {
  /** 모바일: 기본 펼침(접근성·E2E), 사용자가 접어 높이 절약 가능 */
  const [clinicalMobileOpen, setClinicalMobileOpen] = useState(true);

  return (
    <div
      className="space-y-6 rounded-card border border-line bg-surface p-6 shadow-sm md:p-8"
      role="search"
      aria-labelledby="search-heading"
    >
      <div className="space-y-1">
        <h2
          id="search-heading"
          className="text-xl font-semibold tracking-tight text-gray-900 md:text-2xl"
        >
          검색 조건
        </h2>
        <p className="text-sm text-gray-500">
          지역·관심 분야(선택)·의료기관명으로 비교할 병원을 찾아보세요.
        </p>
        <p className="text-xs text-gray-500">
          많이 찾는 예: 서울 종합병원, 경기 의원 등. 등록된 의료기관에 따라 목록이 달라질 수
          있어요.
        </p>
      </div>

      {recentList.length > 0 && (
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-2">최근 검색</p>
          <ul className="flex flex-wrap gap-2" aria-label="최근 검색 조건">
            {recentList.map((r, i) => (
              <li key={`${r.at}-${i}`}>
                <button
                  type="button"
                  onClick={() => onApplyRecent(r)}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label
          htmlFor="hospital-name-search"
          className="block text-sm font-medium text-gray-800 mb-2"
        >
          의료기관명 검색
        </label>
        <div className="relative">
          <input
            id="hospital-name-search"
            type="text"
            value={hospitalNameInput}
            onChange={(e) => onHospitalNameInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchSubmit();
              }
            }}
            placeholder="의료기관명을 입력하세요 (예: 서울대학교병원)"
            className="w-full rounded-control border border-gray-300 bg-surface px-4 py-3.5 pr-36 text-base text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1"
          />
          <button
            type="button"
            onClick={onSearchSubmit}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-semibold shadow-sm"
            aria-label="검색 실행"
          >
            <kbd className="px-1.5 py-0.5 bg-primary-700 border border-primary-800 rounded text-white font-mono text-xs">
              Enter
            </kbd>
            <span>검색</span>
          </button>
        </div>
        {sido ? (
          <p className="mt-2 text-sm text-gray-500">
            시도를 고르신 뒤에는 이름을 입력하고 잠시만 기다리면 목록이 자동으로 갱신돼요.
          </p>
        ) : (
          hospitalNameInput !== hospitalNameCommitted &&
          hospitalNameInput.trim() && (
            <p className="mt-2 text-sm text-blue-600">
              엔터키를 누르거나 검색 버튼을 클릭하세요
            </p>
          )
        )}
        {!sido && hospitalNameInput.trim() && (
          <p className="mt-2 text-sm text-amber-600">
            ⚠️ 시도를 선택하면 더 정확한 검색이 가능합니다
          </p>
        )}
      </div>

      <RegionSelector onRegionChange={onRegionChange} sido={sido} sigungu={sigungu} />

      <button
        type="button"
        onClick={() => setClinicalMobileOpen((o) => !o)}
        className="mb-2 flex w-full items-center justify-between gap-2 rounded-control border border-line bg-surface-muted px-4 py-3 text-left text-sm font-medium text-gray-900 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 md:hidden"
        aria-expanded={clinicalMobileOpen}
      >
        <span>
          관심 분야: <span className="font-semibold text-primary-800">{clinicalFocusLabel}</span>
        </span>
        <span className="shrink-0 text-xs text-gray-500">{clinicalMobileOpen ? '접기' : '펼치기'}</span>
      </button>
      <div
        className={
          clinicalMobileOpen ? 'block' : 'max-md:hidden md:block'
        }
      >
        <ClinicalFocusSelector value={clinicalFocus} onChange={onClinicalFocusChange} />
      </div>
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onAutoRecommend}
            disabled={isRecommending || filteredHospitalCount === 0}
            className="rounded-control px-4 py-2 text-sm font-semibold text-white transition-colors bg-violet-600 hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isRecommending ? '추천 계산 중...' : '추천 병원 불러오기'}
          </button>
          {recommendMessage && (
            <p className="text-sm text-gray-600">{recommendMessage}</p>
          )}
          {recommendBreakdown && recommendBreakdown.length > 0 && (
            <details className="w-full max-w-2xl text-sm text-gray-700 border border-violet-100 rounded-lg bg-violet-50/40 px-3 py-2">
              <summary className="cursor-pointer font-medium text-violet-900">
                추천 점수 상세 (완전성·항목수·가격 안정성)
              </summary>
              <ul className="mt-2 space-y-2 list-none p-0">
                {recommendBreakdown.map((row) => (
                  <li
                    key={row.hospitalId}
                    className="rounded-md bg-white/80 border border-violet-100 px-3 py-2"
                  >
                    <div className="font-semibold text-gray-900">
                      {row.hospitalName}{' '}
                      <span className="text-violet-700">종합 {row.score}점</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 grid gap-1 sm:grid-cols-3">
                      <span>완전성 {row.completenessScore}점</span>
                      <span>상대 항목수 {row.itemCountScore}점</span>
                      <span>가격 안정성 {row.stabilityScore}점</span>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
        {clinicalFocusExcludedAll && (
          <p className="text-sm text-amber-800">
            지금 선택하신 「{clinicalFocusLabel}」에 맞는 병원이 목록에 없어 추천을 준비하지
            못했어요. 관심 분야를 잠시 내려두거나, 지역·병원 이름을 바꿔 다시 찾아보시면
            어떨까요.
          </p>
        )}
      </div>
    </div>
  );
}
