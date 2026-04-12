'use client';

import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { ErrorMessage } from '@/components/Error/ErrorMessage';
import { HospitalCardList } from '@/components/HospitalCard/HospitalCardList';
import { HomeEmptyResultBanners } from '@/components/HomeSearch/HomeEmptyResultBanners';
import type { ApiResponse } from '@/types';
import type { Hospital } from '@/types';

export interface HomeSearchResultsSectionProps {
  filteredCount: number;
  selectedCount: number;
  maxSelection: number;
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
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100 min-h-[260px]">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        검색 결과 ({filteredCount}개)
        {selectedCount > 0 && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            (선택된 {selectedCount}개 병원은 검색 결과와 독립적으로 유지됩니다)
          </span>
        )}
      </h2>
      {hospitalsMeta?.fetchedAt && (
        <p className="text-xs text-gray-500 mb-4" role="status">
          공공데이터 조회 시각:{' '}
          {new Date(hospitalsMeta.fetchedAt).toLocaleString('ko-KR')}
          {hospitalsMeta.source ? ` · ${hospitalsMeta.source}` : ''}
        </p>
      )}
      {isLoading ? (
        <LoadingSpinner />
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
    </div>
  );
}
