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
  const [hospitalNameInput, setHospitalNameInput] = useState<string>(''); // 입력값
  const [hospitalName, setHospitalName] = useState<string>(''); // 실제 검색에 사용되는 값
  
  const { selectedHospitals, toggleHospital, clearHospitals, maxSelection } = useComparisonStore();

  // 메인 타이틀 클릭 시 모든 상태 초기화
  const handleHomeClick = useCallback(() => {
    setSido(undefined);
    setSigungu(undefined);
    setSelectedTypes([]);
    setHospitalNameInput('');
    setHospitalName('');
    clearHospitals();
  }, [clearHospitals]);
  
  // 시군구 목록 가져오기 (필터링용)
  const { data: sigunguList = [] } = useRegions(sido);
  
  const { data: allHospitals = [], isLoading, error } = useHospitals({
    sido,
    sigungu, // 백엔드 매핑이 있으면 백엔드에서 필터링, 없으면 프론트엔드에서 필터링
    types: selectedTypes,
    hospitalName: hospitalName.trim() || undefined,
    enabled: !!sido || !!hospitalName.trim(), // sido 또는 병원명이 있을 때 쿼리 실행
  });

  // 시군구 및 병원명 필터링 (백엔드 매핑이 없는 경우 프론트엔드에서 추가 필터링)
  // 백엔드에서 이미 필터링된 경우에도 프론트엔드에서 한 번 더 확인하여 정확도 향상
  const hospitals = useMemo(() => {
    let filtered = allHospitals;

    // 병원명 필터링 (프론트엔드에서 추가 필터링으로 정확도 향상)
    if (hospitalName && hospitalName.trim()) {
      const searchTerm = hospitalName.trim().toLowerCase();
      filtered = filtered.filter((hospital) => {
        const hospitalNameLower = hospital.name?.toLowerCase() || '';
        return hospitalNameLower.includes(searchTerm);
      });
    }

    // 시군구 필터링
    if (sigungu && filtered.length > 0) {
      // 시군구명 추출 (예: "경기도 구리시" -> "구리시")
      const sigunguData = Array.isArray(sigunguList) ? sigunguList.find(s => s.code === sigungu) : null;
      const sigunguName = sigunguData?.name || '';
      const cleanSigunguName = sigunguName
        .replace(/.*?특별시\s*/, '')
        .replace(/.*?광역시\s*/, '')
        .replace(/.*?도\s*/, '')
        .trim();

      if (cleanSigunguName) {
        // 주소에 시군구명이 포함된 병원만 필터링
        filtered = filtered.filter((hospital) => {
          return hospital.address?.includes(cleanSigunguName) || false;
        });
      }
    }

    return filtered;
  }, [allHospitals, sigungu, sigunguList, hospitalName]);

  // 검색 실행 핸들러
  const handleSearch = useCallback(() => {
    if (hospitalNameInput.trim()) {
      setHospitalName(hospitalNameInput.trim());
    } else {
      setHospitalName('');
    }
  }, [hospitalNameInput]);

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
      <Header onHomeClick={handleHomeClick} />
      <Container className="py-8">
        <div className="space-y-6">
          {/* 검색 필터 섹션 */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">검색 조건</h2>
            
            {/* 의료기관명 검색란 */}
            <div>
              <label htmlFor="hospital-name-search" className="block text-sm font-medium text-gray-700 mb-2">
                의료기관명 검색
              </label>
              <div className="relative">
                <input
                  id="hospital-name-search"
                  type="text"
                  value={hospitalNameInput}
                  onChange={(e) => setHospitalNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="의료기관명을 입력하세요 (예: 서울대학교병원)"
                  className="w-full px-4 py-3 pr-32 text-base text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-medium"
                  aria-label="검색 실행"
                >
                  <kbd className="px-1.5 py-0.5 bg-primary-700 border border-primary-800 rounded text-white font-mono text-xs">
                    Enter
                  </kbd>
                  <span>검색</span>
                </button>
              </div>
              {hospitalNameInput !== hospitalName && hospitalNameInput.trim() && (
                <p className="mt-2 text-sm text-blue-600">
                  엔터키를 누르거나 검색 버튼을 클릭하세요
                </p>
              )}
              {!sido && hospitalNameInput.trim() && (
                <p className="mt-2 text-sm text-amber-600">
                  ⚠️ 시도를 선택하면 더 정확한 검색이 가능합니다
                </p>
              )}
            </div>
            
            <RegionSelector onRegionChange={handleRegionChange} />
            <InstitutionFilter
              selectedTypes={selectedTypes}
              onChange={setSelectedTypes}
            />
          </div>

          {/* 선택된 병원 표시 (검색 결과와 독립적으로 표시) */}
          {selectedHospitals.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                선택된 의료기관 ({selectedHospitals.length}개 / 최대 {maxSelection}개)
              </h2>
              <div className="flex flex-wrap gap-2">
                {selectedHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 rounded-lg shadow-sm"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {hospital.name}
                    </span>
                    <button
                      onClick={() => toggleHospital(hospital)}
                      className="text-red-500 hover:text-red-700 text-lg font-bold"
                      aria-label={`${hospital.name} 선택 해제`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 검색 결과 섹션 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              검색 결과 ({hospitals.length}개)
              {selectedHospitals.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (선택된 {selectedHospitals.length}개 병원은 검색 결과와 독립적으로 유지됩니다)
                </span>
              )}
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
        onRemoveHospital={(hospitalId) => {
          const hospital = selectedHospitals.find(h => h.id === hospitalId);
          if (hospital) {
            toggleHospital(hospital);
          }
        }}
        maxSelection={maxSelection}
      />
      <Footer />
    </div>
  );
}
