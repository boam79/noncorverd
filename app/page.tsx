'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { useHomeHospitalSearch } from '@/lib/hooks/useHomeHospitalSearch';
import { useRecordRecentSearchOnHome } from '@/lib/hooks/useRecordRecentSearchOnHome';
import { useComparisonStore } from '@/lib/stores/comparisonStore';
import { useHomeAutoRecommend } from '@/lib/hooks/useHomeAutoRecommend';
import {
  CLINICAL_FOCUS_OPTIONS,
  type ClinicalFocusId,
} from '@/lib/constants/clinicalFocusBuckets';
import { loadRecentSearches, type RecentSearchEntry } from '@/lib/recentSearches';
import { HomeEmptyResultBanners } from '@/components/HomeSearch/HomeEmptyResultBanners';

export default function Home() {
  const router = useRouter();
  const [sido, setSido] = useState<string>();
  const [sigungu, setSigungu] = useState<string>();
  const [hospitalNameInput, setHospitalNameInput] = useState<string>(''); // 입력값
  const [hospitalName, setHospitalName] = useState<string>(''); // 실제 검색에 사용되는 값
  const [clinicalFocus, setClinicalFocus] = useState<ClinicalFocusId>('none');
  const [recentList, setRecentList] = useState<RecentSearchEntry[]>([]);

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
  
  const {
    apiHospitalName,
    sigunguList,
    allHospitals,
    hospitals,
    hospitalsMeta,
    isLoading,
    error,
    refetchHospitals,
  } = useHomeHospitalSearch({
    sido,
    sigungu,
    hospitalNameInput,
    hospitalNameCommitted: hospitalName,
    clinicalFocus,
  });

  useEffect(() => {
    setRecentList(loadRecentSearches());
  }, []);

  useRecordRecentSearchOnHome({
    sido,
    sigungu,
    hospitalNameCommitted: hospitalName,
    apiHospitalName,
    sigunguList,
    hospitalsResultCount: hospitals.length,
    isLoading,
    error,
    setRecentList,
  });

  const {
    isRecommending,
    recommendMessage,
    recommendBreakdown,
    handleAutoRecommend,
  } = useHomeAutoRecommend({
    hospitals,
    selectedHospitals,
    maxSelection,
    toggleHospital,
  });

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
                <HomeEmptyResultBanners
                  noApiHospitalRows={noApiHospitalRows}
                  clinicalFocusExcludedAll={clinicalFocusExcludedAll}
                  noResultsAfterRegionOrNameFilter={noResultsAfterRegionOrNameFilter}
                  clinicalFocusLabel={clinicalFocusLabel}
                  allHospitalCount={allHospitals.length}
                  onClearClinicalFocus={() => setClinicalFocus('none')}
                />
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
