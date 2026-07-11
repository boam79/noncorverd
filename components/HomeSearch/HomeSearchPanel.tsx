'use client';

import { useState } from 'react';
import { RegionSelector } from '@/components/RegionSelector/RegionSelector';
import { ClinicalFocusSelector } from '@/components/ClinicalFocusFilter/ClinicalFocusSelector';
import type { ClinicalFocusId } from '@/lib/constants/clinicalFocusBuckets';
import type { HospitalRecommendation } from '@/lib/utils/recommendation';
import type { RecentSearchEntry } from '@/lib/recentSearches';
import { HOME_SECTION_IDS } from '@/lib/home/homeSearchSectionIds';

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
  /** 모바일: 관심 분야·추천·최근 검색은 기본 접음(세로 길이 절약). 데스크톱은 항상 펼침. */
  const [clinicalMobileOpen, setClinicalMobileOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [recommendOpen, setRecommendOpen] = useState(false);

  const namePending =
    hospitalNameInput.trim() !== hospitalNameCommitted.trim();

  return (
    <div
      className="space-y-6 border-t border-line pt-8"
      role="search"
      aria-labelledby="search-heading"
    >
      <div className="space-y-1">
        <h2
          id="search-heading"
          className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl"
        >
          검색 조건
        </h2>
        <p className="text-sm text-ink-muted">
          지역을 먼저 정한 뒤, 필요하면 이름·관심 분야로 좁혀 보세요. 병원명은{' '}
          <strong className="font-semibold text-ink">검색 버튼 또는 Enter</strong>로
          적용됩니다.
        </p>
      </div>

      {recentList.length > 0 && (
        <div id={HOME_SECTION_IDS.recent} className="text-sm text-gray-600">
          <button
            type="button"
            data-testid="home-recent-toggle"
            className="mb-2 flex w-full items-center justify-between rounded-control border border-line bg-surface-muted px-3 py-2 text-left text-sm font-medium text-gray-900 md:hidden"
            onClick={() => setRecentOpen((o) => !o)}
            aria-expanded={recentOpen}
          >
            <span>최근 검색 ({recentList.length})</span>
            <span className="text-xs text-gray-500">{recentOpen ? '접기' : '펼치기'}</span>
          </button>
          <p className="mb-2 hidden font-medium text-gray-800 md:block">최근 검색</p>
          <ul
            className={`flex flex-wrap gap-2 ${recentOpen ? '' : 'max-md:hidden'} md:flex`}
            aria-label="최근 검색 조건"
          >
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

      <div id={HOME_SECTION_IDS.region}>
        <RegionSelector onRegionChange={onRegionChange} sido={sido} sigungu={sigungu} />
      </div>

      <div id={HOME_SECTION_IDS.name}>
        <label
          htmlFor="hospital-name-search"
          className="mb-2 block text-sm font-medium text-gray-800"
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
            className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            aria-label="검색 적용"
          >
            <kbd className="rounded border border-primary-800 bg-primary-700 px-1.5 py-0.5 font-mono text-xs text-white">
              Enter
            </kbd>
            <span>검색</span>
          </button>
        </div>
        {namePending && (
          <p
            className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
            role="status"
          >
            <span className="font-semibold">적용 전 입력이 있어요.</span> 목록에 반영하려면
            오른쪽 <strong>검색</strong> 또는 <kbd className="rounded bg-amber-100 px-1 font-mono text-xs">Enter</kbd>
            를 눌러 주세요.
          </p>
        )}
        {!sido && hospitalNameInput.trim() && (
          <p className="mt-2 text-sm text-amber-700">
            시도를 선택하면 더 정확한 검색이 가능합니다.
          </p>
        )}
      </div>

      <div id={HOME_SECTION_IDS.focus}>
        <button
          type="button"
          data-testid="home-clinical-toggle"
          onClick={() => setClinicalMobileOpen((o) => !o)}
          className="mb-2 flex w-full items-center justify-between gap-2 rounded-control border border-line bg-surface-muted px-4 py-3 text-left text-sm font-medium text-gray-900 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 md:hidden"
          aria-expanded={clinicalMobileOpen}
        >
          <span>
            관심 분야: <span className="font-semibold text-primary-800">{clinicalFocusLabel}</span>
          </span>
          <span className="shrink-0 text-xs text-gray-500">
            {clinicalMobileOpen ? '접기' : '펼치기'}
          </span>
        </button>
        <div className={clinicalMobileOpen ? 'block' : 'max-md:hidden md:block'}>
          <ClinicalFocusSelector value={clinicalFocus} onChange={onClinicalFocusChange} />
        </div>
      </div>

      <div id={HOME_SECTION_IDS.recommend}>
        <button
          type="button"
          data-testid="home-recommend-toggle"
          className="mb-2 flex w-full items-center justify-between rounded-control border border-line bg-surface-muted px-4 py-3 text-left text-sm font-medium text-gray-900 md:hidden"
          onClick={() => setRecommendOpen((o) => !o)}
          aria-expanded={recommendOpen}
          aria-controls="home-recommend-panel"
        >
          <span>추천·자동 선택</span>
          <span className="text-xs text-gray-500">{recommendOpen ? '접기' : '펼치기'}</span>
        </button>
        <div
          id="home-recommend-panel"
          className={recommendOpen ? 'block' : 'max-md:hidden md:block'}
        >
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onAutoRecommend}
                disabled={isRecommending || filteredHospitalCount === 0}
                className="rounded-control bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isRecommending ? '추천 계산 중...' : '추천 병원 불러오기'}
              </button>
              {recommendMessage && <p className="text-sm text-gray-600">{recommendMessage}</p>}
              {recommendBreakdown && recommendBreakdown.length > 0 && (
                <details className="w-full max-w-2xl rounded-lg border border-violet-100 bg-violet-50/40 px-3 py-2 text-sm text-gray-700">
                  <summary className="cursor-pointer font-medium text-violet-900">
                    추천 점수 상세 (완전성·항목수·가격 안정성)
                  </summary>
                  <ul className="mt-2 list-none space-y-2 p-0">
                    {recommendBreakdown.map((row) => (
                      <li
                        key={row.hospitalId}
                        className="rounded-md border border-violet-100 bg-white/80 px-3 py-2"
                      >
                        <div className="font-semibold text-gray-900">
                          {row.hospitalName}{' '}
                          <span className="text-violet-700">종합 {row.score}점</span>
                        </div>
                        <div className="mt-1 grid gap-1 text-xs text-gray-600 sm:grid-cols-3">
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
      </div>

      <p className="border-t border-line pt-4 text-xs text-gray-500">
        공공데이터에 등록된 의료기관·항목에 따라 결과가 달라질 수 있습니다. 진료과·이름 매칭은
        참고용 추정입니다.
      </p>
    </div>
  );
}
