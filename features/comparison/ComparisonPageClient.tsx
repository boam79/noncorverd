'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/Layout/Container';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { ErrorMessage } from '@/components/Error/ErrorMessage';
import { ComparisonPricingPanel } from '@/components/ComparisonPage/ComparisonPricingPanel';
import { useComparisonStore } from '@/lib/stores/comparisonStore';
import { usePricingProgressive } from '@/lib/hooks/usePricingProgressive';
import { useComparisonShareHydration } from '@/lib/hooks/useComparisonShareHydration';
import { useComparisonPricingView } from '@/lib/hooks/useComparisonPricingView';

export function ComparisonPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedHospitals, clearHospitals, setSelectedHospitals } = useComparisonStore();
  const [excludeZeroItemHospitals, setExcludeZeroItemHospitals] = useState(true);

  const { shareDone, shareError, shareLoading } = useComparisonShareHydration(
    searchParams,
    router,
    setSelectedHospitals
  );

  const {
    data: pricingData,
    isLoading,
    isFetching,
    error,
    refetch,
    fetchedAt,
    progress,
  } = usePricingProgressive(selectedHospitals, shareDone && selectedHospitals.length > 0);

  const { hospitalsWithNoItems, visiblePricingData } = useComparisonPricingView(
    pricingData,
    excludeZeroItemHospitals
  );

  const handleHomeClick = () => {
    clearHospitals();
  };

  if (shareLoading) {
    return (
      <div className="min-h-screen atmosphere">
        <Header onHomeClick={handleHomeClick} compact />
        <Container className="flex flex-col items-center py-16">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-ink-muted">공유 링크에서 비교 목록을 불러오는 중입니다…</p>
        </Container>
        <Footer />
      </div>
    );
  }

  if (shareError && selectedHospitals.length === 0) {
    return (
      <div className="min-h-screen atmosphere">
        <Header onHomeClick={handleHomeClick} compact />
        <Container className="py-12">
          <ErrorMessage message={shareError} />
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-block rounded-control bg-brand-700 px-6 py-3 text-white hover:bg-brand-800"
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
      <div className="min-h-screen atmosphere">
        <Header onHomeClick={handleHomeClick} compact />
        <Container className="py-12">
          <div className="text-center">
            <h2 className="mb-4 font-display text-2xl font-semibold text-ink">비교할 병원이 없습니다</h2>
            <p className="mb-6 text-ink-muted">병원을 선택한 후 비교 기능을 이용해주세요.</p>
            <Link
              href="/"
              className="inline-block rounded-control bg-brand-700 px-6 py-3 text-white hover:bg-brand-800"
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
    <div className="min-h-screen atmosphere pb-24">
      <Header onHomeClick={handleHomeClick} compact />
      <Container className="py-section">
        <ComparisonPricingPanel
          selectedCount={selectedHospitals.length}
          onClearHospitals={clearHospitals}
          fetchedAt={fetchedAt}
          isFetching={isFetching}
          progressDone={progress.done}
          progressTotal={progress.total}
          isLoading={isLoading}
          error={error}
          onRetryPricing={() => {
            void refetch();
          }}
          hospitalsWithNoItems={hospitalsWithNoItems}
          excludeZeroItemHospitals={excludeZeroItemHospitals}
          onExcludeZeroItemChange={setExcludeZeroItemHospitals}
          pricingData={pricingData}
          visiblePricingData={visiblePricingData}
        />
      </Container>
      <Footer />
    </div>
  );
}
