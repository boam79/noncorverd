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
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">가격 비교</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            병원 비교{' '}
            <span className="text-brand-700">({selectedCount}개)</span>
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClearHospitals}
            className="rounded-control border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            초기화
          </button>
          <Link
            href="/"
            className="rounded-control bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            추가 검색
          </Link>
        </div>
      </div>

      {fetchedAt && (
        <p className="mb-3 text-xs text-ink-soft" role="status">
          공공데이터 조회 시각:{' '}
          {new Date(fetchedAt).toLocaleString('ko-KR')} · 건강보험심사평가원 비급여 항목
        </p>
      )}
      {isFetching && progressTotal > 0 && progressDone < progressTotal && (
        <p className="mb-3 text-sm text-ink-muted" role="status">
          병원별 가격을 받는 중입니다 ({progressDone}/{progressTotal})…
        </p>
      )}

      {!isLoading && !error && partialFailureCount > 0 && (
        <div className="mb-4 rounded-control border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
          <p>
            {partialFailureCount}곳의 가격 정보를 불러오지 못했습니다. 성공한 병원만
            비교에 표시합니다.
          </p>
          <button
            type="button"
            onClick={onRetryPricing}
            className="mt-2 text-sm font-medium text-warning-950 underline underline-offset-2"
          >
            실패한 병원 다시 시도
          </button>
        </div>
      )}

      {!isLoading && !error && hospitalsWithNoItems.length > 0 && (
        <div className="mb-4 rounded-control border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
          비급여 항목이 없는 병원이 {hospitalsWithNoItems.length}곳 있습니다:{' '}
          <span className="font-medium">
            {hospitalsWithNoItems.map((hospital) => hospital.hospitalName).join(', ')}
          </span>
          <div className="mt-1 text-warning-700">
            해당 기관은 공공데이터 API에서 비급여 항목이 제공되지 않을 수 있습니다.
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-warning-900">
            <input
              type="checkbox"
              checked={excludeZeroItemHospitals}
              onChange={(event) => onExcludeZeroItemChange(event.target.checked)}
              className="h-4 w-4 rounded border-warning-400 text-warning-700 focus:ring-warning-600"
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
          <div className="py-8 text-center text-ink-soft">
            표시할 비급여 항목이 없습니다. 자동 제외 옵션을 해제하거나 다른 병원을
            선택해주세요.
          </div>
        )
      ) : pricingData && Array.isArray(pricingData) && pricingData.length === 0 ? (
        <div className="py-8 text-center text-ink-soft">선택한 병원의 가격 정보가 없습니다.</div>
      ) : null}
    </div>
  );
}
