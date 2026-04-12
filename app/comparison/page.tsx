'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/Layout/Container';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { ComparisonTable } from '@/components/ComparisonTable/ComparisonTable';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { ErrorMessage } from '@/components/Error/ErrorMessage';
import { useComparisonStore } from '@/lib/stores/comparisonStore';
import { usePricingProgressive } from '@/lib/hooks/usePricingProgressive';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { decodeSharePayload, SHARE_PARAM } from '@/lib/utils/shareLink';
import { COMPARISON_QUANTITIES_STORAGE_KEY } from '@/components/ComparisonTable/types';
import type { Hospital, HospitalPricing } from '@/types';

function ShareHydrationFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Container className="py-16 flex flex-col items-center">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-gray-600">공유 링크를 준비하는 중입니다…</p>
      </Container>
      <Footer />
    </div>
  );
}

function ComparisonPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedHospitals, clearHospitals, setSelectedHospitals } =
    useComparisonStore();
  const [excludeZeroItemHospitals, setExcludeZeroItemHospitals] = useState(true);
  const [shareError, setShareError] = useState<string | null>(null);
  /** 공유 링크(s) 처리 완료 여부 — 유효한 s가 있을 때만 fetch 후 true */
  const [shareDone, setShareDone] = useState(false);

  const {
    data: pricingData,
    isLoading,
    isFetching,
    error,
    refetch,
    fetchedAt,
    progress,
  } = usePricingProgressive(
    selectedHospitals,
    shareDone && selectedHospitals.length > 0
  );

  const rawShare = searchParams.get(SHARE_PARAM);
  const decodedPreview = useMemo(
    () => (rawShare ? decodeSharePayload(rawShare) : null),
    [rawShare]
  );

  const shareLoading =
    Boolean(rawShare && decodedPreview) && !shareDone && !shareError;

  useEffect(() => {
    if (rawShare) {
      setShareDone(false);
      setShareError(null);
    }
  }, [rawShare]);

  useEffect(() => {
    if (rawShare && !decodedPreview) {
      setShareError('공유 링크 형식이 올바르지 않습니다.');
      setShareDone(true);
      return;
    }

    if (!rawShare || !decodedPreview) {
      setShareDone(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await apiClient.getNonCoveredPricing(
          decodedPreview.i,
          decodedPreview.i.map((id) => ({ id, name: '' }))
        );

        if (cancelled) return;

        if (!response.ok || !Array.isArray(response.data)) {
          setShareError(
            response.error?.message ||
              '공유된 병원 정보를 불러오지 못했습니다.'
          );
          setShareDone(true);
          return;
        }

        const list = response.data as HospitalPricing[];
        const hospitals: Hospital[] = list.map((p) => ({
          id: p.hospitalId,
          name: p.hospitalName || '이름 미상',
          address: '',
          type: '병원',
          departments: [],
        }));

        setSelectedHospitals(hospitals);

        if (decodedPreview.q && typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(
              COMPARISON_QUANTITIES_STORAGE_KEY,
              JSON.stringify(decodedPreview.q)
            );
          } catch {
            // ignore quota / privacy mode
          }
        }

        router.replace('/comparison', { scroll: false });
        setShareDone(true);
      } catch (e) {
        if (!cancelled) {
          setShareError(
            e instanceof Error ? e.message : '공유 링크 처리 중 오류가 발생했습니다.'
          );
          setShareDone(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawShare, decodedPreview, router, setSelectedHospitals]);

  const hospitalsWithNoItems =
    pricingData?.filter((hospital) => !hospital.items || hospital.items.length === 0) ??
    [];
  const visiblePricingData = useMemo(() => {
    if (!pricingData || !Array.isArray(pricingData)) {
      return [];
    }
    if (!excludeZeroItemHospitals) {
      return pricingData;
    }
    return pricingData.filter(
      (hospital) => hospital.items && hospital.items.length > 0
    );
  }, [pricingData, excludeZeroItemHospitals]);

  const handleHomeClick = () => {
    clearHospitals();
  };

  if (shareLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onHomeClick={handleHomeClick} />
        <Container className="py-16 flex flex-col items-center">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-600">
            공유 링크에서 비교 목록을 불러오는 중입니다…
          </p>
        </Container>
        <Footer />
      </div>
    );
  }

  if (shareError && selectedHospitals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onHomeClick={handleHomeClick} />
        <Container className="py-12">
          <ErrorMessage message={shareError} />
          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              병원 검색하기
            </Link>
          </div>
        </Container>
        <Footer />
      </div>
    );
  }

  if (selectedHospitals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onHomeClick={handleHomeClick} />
        <Container className="py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              비교할 병원이 없습니다
            </h2>
            <p className="text-gray-600 mb-6">
              병원을 선택한 후 비교 기능을 이용해주세요.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              병원 검색하기
            </Link>
          </div>
        </Container>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header onHomeClick={handleHomeClick} />
      <Container className="py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              병원 비교 ({selectedHospitals.length}개)
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearHospitals}
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
          {isFetching && progress.total > 0 && progress.done < progress.total && (
            <p className="text-sm text-gray-600 mb-3" role="status">
              병원별 가격을 받는 중입니다 ({progress.done}/{progress.total})…
            </p>
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
                  onChange={(event) =>
                    setExcludeZeroItemHospitals(event.target.checked)
                  }
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
              onRetry={() => {
                void refetch();
              }}
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
            <div className="text-center py-8 text-gray-500">
              선택한 병원의 가격 정보가 없습니다.
            </div>
          ) : null}
        </div>
      </Container>
      <Footer />
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <Suspense fallback={<ShareHydrationFallback />}>
      <ComparisonPageInner />
    </Suspense>
  );
}
