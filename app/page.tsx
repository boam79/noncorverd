'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { useRegions } from '@/lib/hooks/useRegions';
import { useComparisonStore } from '@/lib/stores/comparisonStore';
import type { MedicalInstitutionType } from '@/types';

export default function Home() {
  const router = useRouter();
  const [sido, setSido] = useState<string>();
  const [sigungu, setSigungu] = useState<string>();
  const [selectedTypes, setSelectedTypes] = useState<MedicalInstitutionType[]>([]);
  
  const { selectedHospitals, toggleHospital, clearHospitals, maxSelection } = useComparisonStore();
  
  // 시군구 목록 가져오기 (필터링용)
  const { data: sigunguList = [] } = useRegions(sido);
  
  const { data: allHospitals = [], isLoading, error } = useHospitals({
    sido,
    sigungu, // 백엔드 매핑이 있으면 백엔드에서 필터링, 없으면 프론트엔드에서 필터링
    types: selectedTypes,
    enabled: !!sido,
  });

  // 시군구 필터링 (백엔드 매핑이 없는 경우 프론트엔드에서 추가 필터링)
  // 백엔드에서 이미 필터링된 경우에도 프론트엔드에서 한 번 더 확인하여 정확도 향상
  const hospitals = useMemo(() => {
    if (!sigungu || allHospitals.length === 0) {
      return allHospitals;
    }

    // 시군구명 추출 (예: "경기도 구리시" -> "구리시")
    const sigunguData = Array.isArray(sigunguList) ? sigunguList.find(s => s.code === sigungu) : null;
    const sigunguName = sigunguData?.name || '';
    const cleanSigunguName = sigunguName
      .replace(/.*?특별시\s*/, '')
      .replace(/.*?광역시\s*/, '')
      .replace(/.*?도\s*/, '')
      .trim();

    if (!cleanSigunguName) {
      return allHospitals;
    }

    // 주소에 시군구명이 포함된 병원만 필터링
    // 백엔드 매핑이 있는 경우에도 프론트엔드에서 한 번 더 확인
    const filtered = allHospitals.filter((hospital) => {
      return hospital.address?.includes(cleanSigunguName) || false;
    });

    // 필터링 결과가 너무 적으면 (백엔드 매핑이 작동한 경우) 원본 반환
    // 필터링 결과가 많으면 (백엔드 매핑이 없는 경우) 필터링된 결과 반환
    return filtered.length > 0 ? filtered : allHospitals;
  }, [allHospitals, sigungu, sigunguList]);

  // 지역 변경 핸들러 (useCallback으로 메모이제이션하여 무한 루프 방지)
  const handleRegionChange = useCallback((newSido?: string, newSigungu?: string) => {
    // 시도가 변경되면 시군구도 초기화
    if (sido !== newSido) {
      setSigungu(undefined);
    }
    setSido(newSido);
    setSigungu(newSigungu);
    
    // 지역 변경 시 선택된 병원 목록 초기화
    clearHospitals();
  }, [sido, clearHospitals]);

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
