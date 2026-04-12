'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { pushRecentSearch, loadRecentSearches, type RecentSearchEntry } from '@/lib/recentSearches';

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
  const [recentList, setRecentList] = useState<RecentSearchEntry[]>([]);
  const lastRecordedSearchKey = useRef<string>('');

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
  
  const debouncedHospitalInput = useDebouncedValue(hospitalNameInput, 400);
  /** 시도가 있으면 입력을 잠시 디바운스해 API 부하를 줄입니다. 시도 없이 이름만 쓸 때는 엔터 확정값을 씁니다. */
  const apiHospitalName = sido ? debouncedHospitalInput.trim() : hospitalName.trim();
  const nameForClientFilter = apiHospitalName;

  // 시군구 목록 가져오기 (필터링용)
  const { data: sigunguBundle } = useRegions(sido);
  const sigunguList = useMemo(
    () => sigunguBundle?.regions ?? [],
    [sigunguBundle]
  );

  const {
    data: hospitalsBundle,
    isLoading,
    error,
    refetch: refetchHospitals,
  } = useHospitals({
    sido,
    sigungu, // 백엔드 매핑이 있으면 백엔드에서 필터링, 없으면 프론트엔드에서 필터링
    hospitalName: apiHospitalName || undefined,
    enabled: !!sido || !!hospitalName.trim(), // 시도 없을 때는 엔터로 확정된 이름만 조회
  });

  const allHospitals = useMemo(
    () => hospitalsBundle?.hospitals ?? [],
    [hospitalsBundle]
  );
  const hospitalsMeta = hospitalsBundle?.meta;

  useEffect(() => {
    setRecentList(loadRecentSearches());
  }, []);

  // 시군구 및 병원명 필터링 (백엔드 매핑이 없는 경우 프론트엔드에서 추가 필터링)
  // 백엔드에서 이미 필터링된 경우에도 프론트엔드에서 한 번 더 확인하여 정확도 향상
  const hospitals = useMemo(() => {
    let filtered = allHospitals;

    // 병원명 필터링 (프론트엔드에서 추가 필터링으로 정확도 향상)
    if (nameForClientFilter) {
      const searchTerm = nameForClientFilter.toLowerCase();
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
  }, [allHospitals, sigungu, sigunguList, nameForClientFilter, clinicalFocus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isLoading || error) return;
    if (!sido && !hospitalName.trim()) return;
    if (hospitals.length === 0) return;

    const sigunguName =
      sigunguList.find((s) => s.code === sigungu)?.name?.trim() ?? '';
    const label = [sigunguName || undefined, apiHospitalName || hospitalName.trim() || undefined]
      .filter(Boolean)
      .join(' · ');
    const key = `${sido ?? ''}|${sigungu ?? ''}|${apiHospitalName}|${hospitalName}|${hospitals.length}`;
    if (lastRecordedSearchKey.current === key) return;
    lastRecordedSearchKey.current = key;

    pushRecentSearch({
      label: label || '지역 검색',
      sido,
      sigungu,
      hospitalName: apiHospitalName || hospitalName.trim() || undefined,
    });
    setRecentList(loadRecentSearches());
  }, [
    apiHospitalName,
    error,
    hospitalName,
    hospitals.length,
    isLoading,
    sigungu,
    sigunguList,
    sido,
  ]);

  const clinicalFocusExcludedAll =
    clinicalFocus !== 'none' &&
    !isLoading &&
    !error &&
    allHospitals.length > 0 &&
    hospitals.length === 0;

  /** 시도·병원명 등으로 쿼리가 돌아간 상태 */
  const searchActive = Boolean(sido) || Boolean(hospitalName.trim());

  /** 로딩/에러가 아니고, 검색은 했는데 화면 결과가 0건 */
  const showEmptySearchGuidance =
    searchActive && !isLoading && !error && hospitals.length === 0;

  /** 공공 API가 0건 (지역·이름 조건에 맞는 목록 자체가 없음) */
  const noApiHospitalRows = showEmptySearchGuidance && allHospitals.length === 0;

  /** API에는 건이 있는데 시군구 주소·병원명 문자 필터로만 전부 탈락 */
  const noResultsAfterRegionOrNameFilter =
    showEmptySearchGuidance &&
    allHospitals.length > 0 &&
    !clinicalFocusExcludedAll;

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

  const applyRecentSearch = useCallback((entry: RecentSearchEntry) => {
    setSido(entry.sido);
    setSigungu(entry.sigungu);
    const n = entry.hospitalName?.trim() ?? '';
    setHospitalNameInput(n);
    setHospitalName(n);
  }, []);

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
          <div
            className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-6 border border-gray-100"
            role="search"
            aria-labelledby="search-heading"
          >
            <div className="space-y-1">
              <h2 id="search-heading" className="text-2xl font-semibold text-gray-900 tracking-tight">
                검색 조건
              </h2>
              <p className="text-sm text-gray-500">
                지역·관심 분야(선택)·의료기관명으로 비교할 병원을 찾아보세요.
              </p>
              <p className="text-xs text-gray-500">
                많이 찾는 예: 서울 종합병원, 경기 의원 등. 등록된 의료기관에 따라 목록이 달라질 수
                있어요.
              </p>
            </div>

            {recentList.length > 0 && (
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-800 mb-2">최근 검색</p>
                <ul className="flex flex-wrap gap-2" aria-label="최근 검색 조건">
                  {recentList.map((r, i) => (
                    <li key={`${r.at}-${i}`}>
                      <button
                        type="button"
                        onClick={() => applyRecentSearch(r)}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {r.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
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
              {sido ? (
                <p className="mt-2 text-sm text-gray-500">
                  시도를 고르신 뒤에는 이름을 입력하고 잠시만 기다리면 목록이 자동으로 갱신돼요.
                </p>
              ) : (
                hospitalNameInput !== hospitalName &&
                hospitalNameInput.trim() && (
                  <p className="mt-2 text-sm text-blue-600">
                    엔터키를 누르거나 검색 버튼을 클릭하세요
                  </p>
                )
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
                지금 선택하신 「{clinicalFocusLabel}」에 맞는 병원이 목록에 없어 추천을 준비하지
                못했어요. 관심 분야를 잠시 내려두거나, 지역·병원 이름을 바꿔 다시 찾아보시면
                어떨까요.
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              검색 결과 ({hospitals.length}개)
              {selectedHospitals.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (선택된 {selectedHospitals.length}개 병원은 검색 결과와 독립적으로 유지됩니다)
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
                onRetry={() => {
                  void refetchHospitals();
                }}
              />
            ) : (
              <>
                {noApiHospitalRows && (
                  <div
                    className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"
                    role="status"
                  >
                    <p className="font-medium">
                      이 조건으로는 아직 보여드릴 병원이 없어요.
                    </p>
                    <p className="mt-1 text-sky-900/90">
                      시·군·구나 병원 이름을 조금만 바꿔 보시거나, 잠시 뒤에 다시 눌러 주세요.
                      등록된 병원이 적은 지역이거나, 한 번에 가져오는 수에 제한이 있을 수 있어요.
                    </p>
                  </div>
                )}
                {clinicalFocusExcludedAll && (
                  <div
                    className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                    role="status"
                  >
                    <p className="font-medium">
                      「{clinicalFocusLabel}」에 잘 맞는 병원을 목록에서 찾지 못했어요.
                    </p>
                    <p className="mt-1 text-amber-800">
                      가져온 병원 {allHospitals.length}곳 가운데 조건에 딱 맞는 곳이 없었어요.
                      이름·진료 정보로 추정한 부분이라 실제와 다를 수 있으니 가볍게 참고만 해 주세요.
                    </p>
                    <button
                      type="button"
                      onClick={() => setClinicalFocus('none')}
                      className="mt-3 text-sm font-semibold text-amber-950 underline decoration-amber-600 hover:text-amber-700"
                    >
                      관심 분야 접기
                    </button>
                  </div>
                )}
                {noResultsAfterRegionOrNameFilter && (
                  <div
                    className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                    role="status"
                  >
                    <p className="font-medium">
                      찾아온 병원 {allHospitals.length}곳 모두, 선택하신 지역·이름 조건과는 맞지
                      않았어요.
                    </p>
                    <p className="mt-1 text-amber-800">
                      시·군·구를 넓혀 보시거나, 병원 이름 검색을 짧게(또는 비우고) 다시 엔터를 눌러
                      보시면 목록이 나올 수 있어요.
                    </p>
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
