'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { Container } from '@/components/Layout/Container';
import { RegionSelector } from '@/components/RegionSelector/RegionSelector';
import { InstitutionFilter } from '@/components/InstitutionFilter/InstitutionFilter';
import { HospitalCardList } from '@/components/HospitalCard/HospitalCardList';
import { CompareBar } from '@/components/CompareBar/CompareBar';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { ErrorMessage } from '@/components/Error/ErrorMessage';
import { useHospitals } from '@/lib/hooks/useHospitals';
import { useComparisonStore } from '@/lib/stores/comparisonStore';
import type { MedicalInstitutionType } from '@/types';

export default function Home() {
  const router = useRouter();
  const [sido, setSido] = useState<string>();
  const [sigungu, setSigungu] = useState<string>();
  const [selectedTypes, setSelectedTypes] = useState<MedicalInstitutionType[]>([]);
  
  const { selectedHospitals, toggleHospital, clearHospitals, maxSelection } = useComparisonStore();
  
  const { data: hospitals = [], isLoading, error } = useHospitals({
    sido,
    sigungu,
    types: selectedTypes,
    enabled: !!sido,
  });

  // 지역 변경 핸들러
  const handleRegionChange = (newSido?: string, newSigungu?: string) => {
    // 시도가 변경되면 시군구도 초기화
    if (sido !== newSido) {
      setSigungu(undefined);
    }
    setSido(newSido);
    setSigungu(newSigungu);
    
    // 지역 변경 시 선택된 병원 목록 초기화
    clearHospitals();
  };

  // 비교하기
  const handleCompare = () => {
    if (selectedHospitals.length > 0) {
      router.push('/comparison');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-24">
      <Header />
      <Container className="py-8">
        <div className="space-y-6">
          {/* 검색 필터 섹션 */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">검색 조건</h2>
            <RegionSelector onRegionChange={handleRegionChange} />
            <InstitutionFilter
              selectedTypes={selectedTypes}
              onChange={setSelectedTypes}
            />
          </div>

          {/* 검색 결과 섹션 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              검색 결과 ({hospitals.length}개)
            </h2>
            {isLoading ? (
              <LoadingSpinner />
            ) : error ? (
              <ErrorMessage
                message="병원 정보를 불러오는데 실패했습니다."
                error={error}
                onRetry={() => window.location.reload()}
              />
            ) : (
              <HospitalCardList
                hospitals={hospitals}
                selectedHospitals={selectedHospitals}
                onToggleHospital={toggleHospital}
                maxSelection={maxSelection}
              />
            )}
          </div>
        </div>
      </Container>

      {/* Floating Compare Bar */}
      <CompareBar
        selectedHospitals={selectedHospitals}
        onCompare={handleCompare}
        onClear={clearHospitals}
        maxSelection={maxSelection}
      />
      <Footer />
    </div>
  );
}
