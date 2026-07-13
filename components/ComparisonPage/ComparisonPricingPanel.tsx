'use client';

import Link from 'next/link';
import { ComparisonTable } from '@/components/ComparisonTable/ComparisonTable';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { ErrorMessage } from '@/components/Error/ErrorMessage';
import type { HospitalPricing } from '@/types';

export interface ComparisonPricingPanelProps {
  selectedCount: number;
  onClearHospitals: () => void;
  fetchedAt?: string;
  isFetching: boolean;
  progressDone: number;
  progressTotal: number;
  isLoading: boolean;
  error: unknown;
  /** 일부 병원만 가격 조회 실패했을 때 건수 (전체 실패는 error 로 처리) */
  partialFailureCount?: number;
  onRetryPricing: () => void;
  hospitalsWithNoItems: HospitalPricing[];
  excludeZeroItemHospitals: boolean;
  onExcludeZeroItemChange: (value: boolean) => void;
  pricingData: HospitalPricing[] | undefined;
  visiblePricingData: HospitalPricing[];
}

export function ComparisonPricingPanel({
  selectedCount,
  onClearHospitals,
  fetchedAt,
  isFetching,
  progressDone,
  progressTotal,
  isLoading,
  error,
  partialFailureCount = 0,
  onRetryPricing,
  hospitalsWithNoItems,
  excludeZeroItemHospitals,
  onExcludeZeroItemChange,
  pricingData,
  visiblePricingData,
}: ComparisonPricingPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">병원 비교 ({selectedCount}개)</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClearHospitals}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
          >
            초기화
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            추가 검색
          </Link>
        </div>
      </div>

      {fetchedAt && (
        <p className="text-xs text-gray-500 mb-3" role="status">
          공공데이터 조회 시각:{' '}
          {new Date(fetchedAt).toLocaleString('ko-KR')} · 건강보험심사평가원 비급여 항목
        </p>
      )}
      {isFetching && progressTotal > 0 && progressDone < progressTotal && (
        <p className="text-sm text-gray-600 mb-3" role="status">
          병원별 가격을 받는 중입니다 ({progressDone}/{progressTotal})…
        </p>
      )}

      {!isLoading && !error && partialFailureCount > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            {partialFailureCount}곳의 가격 정보를 불러오지 못했습니다. 성공한 병원만
            비교에 표시합니다.
          </p>
          <button
            type="button"
            onClick={onRetryPricing}
            className="mt-2 text-sm font-medium text-amber-950 underline underline-offset-2"
          >
            실패한 병원 다시 시도
          </button>
        </div>
      )}

      {!isLoading && !error && hospitalsWithNoItems.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          비급여 항목이 없는 병원이 {hospitalsWithNoItems.length}곳 있습니다:{' '}
          <span className="font-medium">
            {hospitalsWithNoItems.map((hospital) => hospital.hospitalName).join(', ')}
          </span>
          <div className="mt-1 text-amber-700">
            해당 기관은 공공데이터 API에서 비급여 항목이 제공되지 않을 수 있습니다.
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-amber-900">
            <input
              type="checkbox"
              checked={excludeZeroItemHospitals}
              onChange={(event) => onExcludeZeroItemChange(event.target.checked)}
              className="h-4 w-4 rounded border-amber-400 text-amber-700 focus:ring-amber-600"
            />
            비급여 항목 0건 병원 자동 제외
          </label>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage
          message="가격 정보를 불러오는데 실패했습니다."
          error={error}
          onRetry={onRetryPricing}
        />
      ) : pricingData && Array.isArray(pricingData) && pricingData.length > 0 ? (
        visiblePricingData.length > 0 ? (
          <ComparisonTable pricingData={visiblePricingData} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            표시할 비급여 항목이 없습니다. 자동 제외 옵션을 해제하거나 다른 병원을
            선택해주세요.
          </div>
        )
      ) : pricingData && Array.isArray(pricingData) && pricingData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">선택한 병원의 가격 정보가 없습니다.</div>
      ) : null}
    </div>
  );
}
