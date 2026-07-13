'use client';

import { ErrorMessage } from '@/components/Error/ErrorMessage';
import { HospitalCardList } from '@/components/HospitalCard/HospitalCardList';
import { HomeEmptyResultBanners } from '@/components/HomeSearch/HomeEmptyResultBanners';
import type { ApiResponse } from '@/types';
import type { Hospital } from '@/types';
import { HOME_SECTION_IDS } from '@/lib/home/homeSearchSectionIds';

export interface HomeSearchResultsSectionProps {
  filteredCount: number;
  selectedCount: number;
  maxSelection: number;
  /** 상단 한 줄 요약(지역·이름·관심 분야) */
  filterSummary: string;
  hospitalsMeta?: ApiResponse['meta'];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  noApiHospitalRows: boolean;
  clinicalFocusExcludedAll: boolean;
  noResultsAfterRegionOrNameFilter: boolean;
  clinicalFocusLabel: string;
  allHospitalCount: number;
  onClearClinicalFocus: () => void;
  hospitals: Hospital[];
  selectedHospitals: Hospital[];
  onToggleHospital: (hospital: Hospital) => void;
}

export function HomeSearchResultsSection({
  filteredCount,
  selectedCount,
  maxSelection,
  filterSummary,
  hospitalsMeta,
  isLoading,
  error,
  onRetry,
  noApiHospitalRows,
  clinicalFocusExcludedAll,
  noResultsAfterRegionOrNameFilter,
  clinicalFocusLabel,
  allHospitalCount,
  onClearClinicalFocus,
  hospitals,
  selectedHospitals,
  onToggleHospital,
}: HomeSearchResultsSectionProps) {
  const metaExtra = hospitalsMeta as
    | (ApiResponse['meta'] & {
        appliedSigunguAddressFallback?: boolean;
        addressFallbackTruncated?: boolean;
        listTruncated?: boolean;
        hiraSidoTotalCount?: number;
      })
    | undefined;

  const statusLine = (() => {
    if (isLoading) return '병원 목록을 불러오는 중이에요…';
    if (error) return null;
    return `${filterSummary} · 총 ${filteredCount}곳`;
  })();

  return (
    <section
      id={HOME_SECTION_IDS.results}
      className="min-h-[260px] rounded-2xl border border-gray-200 bg-surface p-6 shadow-md md:p-8"
      aria-labelledby="results-heading"
    >
      <header className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
          <h2
            id="results-heading"
            className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl"
          >
            검색 결과
            {!isLoading && !error && (
              <span className="ml-2 font-semibold text-primary-800"> {filteredCount}곳</span>
            )}
          </h2>
          {isLoading && (
            <span className="text-sm font-medium text-primary-700" aria-live="polite">
              불러오는 중…
            </span>
          )}
        </div>
        {statusLine && !error && (
          <p className="mt-2 text-sm text-gray-600" id="results-summary">
            {statusLine}
          </p>
        )}
        {selectedCount > 0 && !isLoading && !error && (
          <p className="mt-2 text-xs text-gray-500">
            선택된 {selectedCount}곳은 목록과 별도로 유지되며, 하단 비교 바에서 이어갈 수
            있어요 (최대 {maxSelection}곳).
          </p>
        )}
        {hospitalsMeta?.fetchedAt && !isLoading && !error && (
          <p className="mt-2 text-xs text-gray-500" role="status">
            조회 시각 {new Date(hospitalsMeta.fetchedAt).toLocaleString('ko-KR')}
            {hospitalsMeta.source ? ` · ${hospitalsMeta.source}` : ''}
            {metaExtra?.appliedSigunguAddressFallback && (
              <span className="ml-1 text-amber-800">
                · 시군구 코드 폴백(주소 필터) 적용
                {metaExtra.addressFallbackTruncated || metaExtra.listTruncated
                  ? ' · 일부만 수집됨'
                  : ''}
              </span>
            )}
            {!metaExtra?.appliedSigunguAddressFallback && metaExtra?.listTruncated && (
              <span className="ml-1 text-amber-800">
                · 시도 내 병원이 많아 일부만 표시됩니다. 시군구를 고르거나 병원명으로
                좁혀 보세요
                {metaExtra.hiraSidoTotalCount
                  ? ` (전체 약 ${metaExtra.hiraSidoTotalCount.toLocaleString()}곳)`
                  : ''}
              </span>
            )}
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-3 py-2" aria-busy="true" aria-label="검색 결과 로딩 중">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-gray-200/70" />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage
          message="병원 정보를 불러오는데 실패했습니다."
          error={error}
          onRetry={onRetry}
        />
      ) : (
        <>
          <HomeEmptyResultBanners
            noApiHospitalRows={noApiHospitalRows}
            clinicalFocusExcludedAll={clinicalFocusExcludedAll}
            noResultsAfterRegionOrNameFilter={noResultsAfterRegionOrNameFilter}
            clinicalFocusLabel={clinicalFocusLabel}
            allHospitalCount={allHospitalCount}
            onClearClinicalFocus={onClearClinicalFocus}
          />
          <HospitalCardList
            hospitals={hospitals}
            selectedHospitals={selectedHospitals}
            onToggleHospital={onToggleHospital}
            maxSelection={maxSelection}
          />
        </>
      )}
    </section>
  );
}
