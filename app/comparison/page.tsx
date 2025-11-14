'use client';

import { Container } from '@/components/Layout/Container';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { ComparisonTable } from '@/components/ComparisonTable/ComparisonTable';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { ErrorMessage } from '@/components/Error/ErrorMessage';
import { useComparisonStore } from '@/lib/stores/comparisonStore';
import { usePricing } from '@/lib/hooks/usePricing';
import Link from 'next/link';

export default function ComparisonPage() {
  const { selectedHospitals, clearHospitals } = useComparisonStore();
  const hospitalIds = selectedHospitals.map((h) => h.id);
  const { data: pricingData, isLoading, error } = usePricing(hospitalIds, selectedHospitals);

  // 메인 타이틀 클릭 시 선택된 병원 초기화
  const handleHomeClick = () => {
    clearHospitals();
  };

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

          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage
              message="가격 정보를 불러오는데 실패했습니다."
              error={error}
              onRetry={() => window.location.reload()}
            />
          ) : pricingData && Array.isArray(pricingData) && pricingData.length > 0 ? (
            <ComparisonTable pricingData={pricingData} />
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

