'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { Container } from '@/components/Layout/Container';
import { RegionSelector } from '@/components/RegionSelector/RegionSelector';
import { ClinicalFocusSelector } from '@/components/ClinicalFocusFilter/ClinicalFocusSelector';
import { HospitalCardList } from '@/components/HospitalCard/HospitalCardList';
import { CompareBar } from '@/components/CompareBar/CompareBar';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { ErrorMessage } from '@/components/Error/ErrorMessage';
import { ServerStatusBanner } from '@/components/ServerStatusBanner/ServerStatusBanner';
import { useHospitals } from '@/lib/hooks/useHospitals';
import { useRegions } from '@/lib/hooks/useRegions';
import { useComparisonStore } from '@/lib/stores/comparisonStore';
import { apiClient } from '@/lib/api';
import {
  recommendHospitals,
  type HospitalRecommendation,
} from '@/lib/utils/recommendation';
import type { HospitalPricing } from '@/types';
import {
  CLINICAL_FOCUS_OPTIONS,
  hospitalMatchesClinicalFocus,
  type ClinicalFocusId,
} from '@/lib/constants/clinicalFocusBuckets';
import { hospitalAddressMatchesSigungu } from '@/lib/utils/addressSigunguMatch';

export default function Home() {
  const router = useRouter();
  const [sido, setSido] = useState<string>();
  const [sigungu, setSigungu] = useState<string>();
  const [hospitalNameInput, setHospitalNameInput] = useState<string>(''); // 입력값
  const [hospitalName, setHospitalName] = useState<string>(''); // 실제 검색에 사용되는 값
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendMessage, setRecommendMessage] = useState<string>('');
  const [recommendBreakdown, setRecommendBreakdown] = useState<
    HospitalRecommendation[] | null
  >(null);
  const [clinicalFocus, setClinicalFocus] = useState<ClinicalFocusId>('none');

  const { selectedHospitals, toggleHospital, clearHospitals, maxSelection } = useComparisonStore();

  // 메인 타이틀 클릭 시 모든 상태 초기화
  const handleHomeClick = useCallback(() => {
    setSido(undefined);
    setSigungu(undefined);
    setHospitalNameInput('');
    setHospitalName('');
    setClinicalFocus('none');
    clearHospitals();
  }, [clearHospitals]);
  
  // 시군구 목록 가져오기 (필터링용)
  const { data: sigunguList = [] } = useRegions(sido);
  
  const {
    data: allHospitals = [],
    isLoading,
    error,
    refetch: refetchHospitals,
  } = useHospitals({
    sido,
    sigungu, // 백엔드 매핑이 있으면 백엔드에서 필터링, 없으면 프론트엔드에서 필터링
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
        filtered = filtered.filter((hospital) =>
          hospitalAddressMatchesSigungu(
            hospital.address,
            sigunguName,
            cleanSigunguName
          )
        );
      }
    }

    if (clinicalFocus !== 'none') {
      filtered = filtered.filter((h) =>
        hospitalMatchesClinicalFocus(h, clinicalFocus)
      );
    }

    return filtered;
  }, [allHospitals, sigungu, sigunguList, hospitalName, clinicalFocus]);

  const clinicalFocusExcludedAll =
    clinicalFocus !== 'none' &&
    !isLoading &&
    !error &&
    allHospitals.length > 0 &&
    hospitals.length === 0;

  const clinicalFocusLabel =
    CLINICAL_FOCUS_OPTIONS.find((o) => o.id === clinicalFocus)?.label ?? '';

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
    
    // 지역 변경 시 선택된 병원 목록은 유지 (초기화하지 않음)
  }, [sido]);

  // 비교하기
  const handleCompare = () => {
    if (selectedHospitals.length > 0) {
      router.push('/comparison');
    }
  };

  // 추천 병원 자동 선택
  const handleAutoRecommend = useCallback(async () => {
    const remainingSlots = Math.max(0, maxSelection - selectedHospitals.length);
    if (remainingSlots <= 0) {
      setRecommendMessage(`최대 ${maxSelection}개까지 선택 가능합니다.`);
      return;
    }

    const candidates = hospitals
      .filter((hospital) => !selectedHospitals.some((selected) => selected.id === hospital.id))
      .slice(0, 8); // API 호출 비용 절약을 위해 상위 8개만 분석

    if (candidates.length === 0) {
      setRecommendMessage('추천할 병원 후보가 없습니다.');
      return;
    }

    setIsRecommending(true);
    setRecommendMessage('');
    setRecommendBreakdown(null);
    try {
      const response = await apiClient.getNonCoveredPricing(
        candidates.map((hospital) => hospital.id),
        candidates.map((hospital) => ({ id: hospital.id, name: hospital.name }))
      );

      if (!response.ok || !Array.isArray(response.data)) {
        throw new Error(response.error?.message || '추천 데이터를 가져오지 못했습니다.');
      }

      const pricingData = response.data as HospitalPricing[];
      const recommendations = recommendHospitals(
        pricingData,
        Math.min(3, remainingSlots)
      );
      if (recommendations.length === 0) {
        setRecommendMessage('추천 점수를 계산할 데이터가 부족합니다.');
        return;
      }

      setRecommendBreakdown(recommendations);

      const recommendedHospitals = recommendations
        .map((recommendation) =>
          candidates.find((hospital) => hospital.id === recommendation.hospitalId)
        )
        .filter((hospital): hospital is NonNullable<typeof hospital> => Boolean(hospital));

      recommendedHospitals.forEach((hospital) => {
        if (!selectedHospitals.some((selected) => selected.id === hospital.id)) {
          toggleHospital(hospital);
        }
      });

      setRecommendMessage(`추천 병원 ${recommendedHospitals.length}곳을 자동 선택했습니다.`);
    } catch (error) {
      setRecommendMessage(
        error instanceof Error ? error.message : '추천 병원 선택 중 오류가 발생했습니다.'
      );
    } finally {
      setIsRecommending(false);
    }
  }, [hospitals, maxSelection, selectedHospitals, toggleHospital]);

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-24">
      <Header onHomeClick={handleHomeClick} />
      <ServerStatusBanner />

      <Container className="py-8 md:py-12">
        <div className="space-y-8">
          {/* 검색 필터 섹션 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6 border border-gray-100">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">검색 조건</h2>
              <p className="text-sm text-gray-500">
                지역·관심 분야(선택)·의료기관명으로 비교할 병원을 찾아보세요.
              </p>
            </div>
            
            {/* 의료기관명 검색란 */}
            <div>
              <label htmlFor="hospital-name-search" className="block text-sm font-medium text-gray-800 mb-2">
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
                  className="w-full px-4 py-3.5 pr-36 text-base text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400 bg-white"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-semibold shadow-sm"
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
            
            <RegionSelector 
              onRegionChange={handleRegionChange}
              sido={sido}
              sigungu={sigungu}
            />
            <ClinicalFocusSelector
              value={clinicalFocus}
              onChange={setClinicalFocus}
            />
            <div className="flex flex-col gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAutoRecommend}
                disabled={isRecommending || hospitals.length === 0}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isRecommending ? '추천 계산 중...' : '추천 병원 불러오기'}
              </button>
              {recommendMessage && (
                <p className="text-sm text-gray-600">{recommendMessage}</p>
              )}
              {recommendBreakdown && recommendBreakdown.length > 0 && (
                <details className="w-full max-w-2xl text-sm text-gray-700 border border-violet-100 rounded-lg bg-violet-50/40 px-3 py-2">
                  <summary className="cursor-pointer font-medium text-violet-900">
                    추천 점수 상세 (완전성·항목수·가격 안정성)
                  </summary>
                  <ul className="mt-2 space-y-2 list-none p-0">
                    {recommendBreakdown.map((row) => (
                      <li
                        key={row.hospitalId}
                        className="rounded-md bg-white/80 border border-violet-100 px-3 py-2"
                      >
                        <div className="font-semibold text-gray-900">
                          {row.hospitalName}{' '}
                          <span className="text-violet-700">종합 {row.score}점</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 grid gap-1 sm:grid-cols-3">
                          <span>완전성 {row.completenessScore}점</span>
                          <span>상대 항목수 {row.itemCountScore}점</span>
                          <span>가격 안정성 {row.stabilityScore}점</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
            {clinicalFocusExcludedAll && (
              <p className="text-sm text-amber-800">
                「{clinicalFocusLabel}」 조건에 맞는 병원이 없어 추천을 실행할 수 없습니다.
                관심 분야를 ‘선택 안 함’으로 바꾸거나 지역·병원명을 조정해 보세요.
              </p>
            )}
            </div>
          </div>

          {/* 선택된 병원 표시 (검색 결과와 독립적으로 표시) */}
          {selectedHospitals.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl shadow-sm p-6 md:p-7">
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
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100 min-h-[260px]">
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
                onRetry={() => {
                  void refetchHospitals();
                }}
              />
            ) : (
              <>
                {clinicalFocusExcludedAll && (
                  <div
                    className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                    role="status"
                  >
                    <p className="font-medium">
                      관심 분야 「{clinicalFocusLabel}」에 맞는 병원이 없습니다.
                    </p>
                    <p className="mt-1 text-amber-800">
                      검색 결과 {allHospitals.length}곳 중 조건을 만족하는 기관이 없습니다.
                      이름·진료과 코드 기반 추정이라 실제와 다를 수 있습니다.
                    </p>
                    <button
                      type="button"
                      onClick={() => setClinicalFocus('none')}
                      className="mt-3 text-sm font-semibold text-amber-950 underline decoration-amber-600 hover:text-amber-700"
                    >
                      관심 분야 선택 해제
                    </button>
                  </div>
                )}
                <HospitalCardList
                  hospitals={hospitals}
                  selectedHospitals={selectedHospitals}
                  onToggleHospital={toggleHospital}
                  maxSelection={maxSelection}
                />
              </>
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
