'use client';

import { useState, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { Container } from '@/components/Layout/Container';
import { CompareBar } from '@/components/CompareBar/CompareBar';
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
import { HomeSearchPanel } from '@/components/HomeSearch/HomeSearchPanel';
import { HomeSearchResultsSection } from '@/components/HomeSearch/HomeSearchResultsSection';
import { computeHomeSearchDerived } from '@/lib/home/homeSearchDerived';
import {
  parseHomeSearchParams,
  serializeHomeSearchParams,
} from '@/lib/url/homeSearchParams';
import { isUiV2BetaEnabled } from '@/lib/featureFlags';

/**
 * 메인(홈) 화면 — 검색 조건과 URL 쿼리(`sido`, `sigungu`, `q`, `focus`) 동기화.
 */
export function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  /** 초기 URL 복원 완료 후에만 주소줄을 덮어쓴다(첫 페인트 레이스 방지). */
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);

  const [sido, setSido] = useState<string>();
  const [sigungu, setSigungu] = useState<string>();
  const [hospitalNameInput, setHospitalNameInput] = useState<string>('');
  const [hospitalName, setHospitalName] = useState<string>('');
  const [clinicalFocus, setClinicalFocus] = useState<ClinicalFocusId>('none');
  const [recentList, setRecentList] = useState<RecentSearchEntry[]>([]);

  const { selectedHospitals, toggleHospital, clearHospitals, maxSelection } = useComparisonStore();

  /** 첫 클라이언트 페인트 직전: 주소창 쿼리 → 폼 상태 (공유 링크·북마크) */
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const parsed = parseHomeSearchParams(new URLSearchParams(window.location.search));
    setSido(parsed.sido);
    setSigungu(parsed.sigungu);
    const q = parsed.q ?? '';
    setHospitalNameInput(q);
    setHospitalName(q);
    setClinicalFocus(parsed.focus);
    queueMicrotask(() => setHydratedFromUrl(true));
  }, []);

  /** 브라우저 뒤로가기 등으로 주소만 바뀐 경우 */
  useEffect(() => {
    if (!hydratedFromUrl) return;
    const onPop = () => {
      const parsed = parseHomeSearchParams(new URLSearchParams(window.location.search));
      setSido(parsed.sido);
      setSigungu(parsed.sigungu);
      const q = parsed.q ?? '';
      setHospitalNameInput(q);
      setHospitalName(q);
      setClinicalFocus(parsed.focus);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [hydratedFromUrl]);

  /** 폼·필터 변경 → 주소줄 (공유 가능한 링크 유지) */
  useEffect(() => {
    if (!hydratedFromUrl) return;
    const qs = serializeHomeSearchParams({
      sido,
      sigungu,
      hospitalNameCommitted: hospitalName,
      clinicalFocus,
    });
    if (qs === searchParams.toString()) return;
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }, [sido, sigungu, hospitalName, clinicalFocus, hydratedFromUrl, router, searchParams]);

  const handleHomeClick = useCallback(() => {
    setSido(undefined);
    setSigungu(undefined);
    setHospitalNameInput('');
    setHospitalName('');
    setClinicalFocus('none');
    clearHospitals();
    router.replace('/', { scroll: false });
  }, [clearHospitals, router]);

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

  const derived = useMemo(
    () =>
      computeHomeSearchDerived({
        clinicalFocus,
        isLoading,
        error,
        allHospitalCount: allHospitals.length,
        filteredHospitalCount: hospitals.length,
        sido,
        hospitalNameCommitted: hospitalName,
      }),
    [
      clinicalFocus,
      isLoading,
      error,
      allHospitals.length,
      hospitals.length,
      sido,
      hospitalName,
    ]
  );

  const {
    clinicalFocusExcludedAll,
    noApiHospitalRows,
    noResultsAfterRegionOrNameFilter,
  } = derived;

  const clinicalFocusLabel =
    CLINICAL_FOCUS_OPTIONS.find((o) => o.id === clinicalFocus)?.label ?? '';

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

  const handleRegionChange = useCallback(
    (newSido?: string, newSigungu?: string) => {
      if (sido !== newSido) {
        setSigungu(undefined);
      }
      setSido(newSido);
      setSigungu(newSigungu);
    },
    [sido]
  );

  const handleCompare = () => {
    if (selectedHospitals.length > 0) {
      router.push('/comparison');
    }
  };

  const showBetaRibbon = isUiV2BetaEnabled();

  return (
    <div className="min-h-screen bg-page pb-28 md:pb-24">
      <Header onHomeClick={handleHomeClick} />
      {showBetaRibbon && (
        <div
          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900"
          role="status"
        >
          UI v2 베타 — 피드백 환영합니다. (`NEXT_PUBLIC_UI_V2_BETA=1`)
        </div>
      )}
      <ServerStatusBanner />

      <Container className="py-section md:py-section-lg">
        <div className="space-y-section">
          <HomeSearchPanel
            recentList={recentList}
            onApplyRecent={applyRecentSearch}
            hospitalNameInput={hospitalNameInput}
            onHospitalNameInputChange={setHospitalNameInput}
            hospitalNameCommitted={hospitalName}
            onSearchSubmit={handleSearch}
            sido={sido}
            sigungu={sigungu}
            onRegionChange={handleRegionChange}
            clinicalFocus={clinicalFocus}
            onClinicalFocusChange={setClinicalFocus}
            filteredHospitalCount={hospitals.length}
            isRecommending={isRecommending}
            onAutoRecommend={handleAutoRecommend}
            recommendMessage={recommendMessage}
            recommendBreakdown={recommendBreakdown}
            clinicalFocusExcludedAll={clinicalFocusExcludedAll}
            clinicalFocusLabel={clinicalFocusLabel}
          />

          {selectedHospitals.length > 0 && (
            <div className="rounded-card border border-blue-200 bg-blue-50 p-6 shadow-sm md:p-7">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                선택된 의료기관 ({selectedHospitals.length}개 / 최대 {maxSelection}개)
              </h2>
              <div className="flex flex-wrap gap-2">
                {selectedHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className="flex items-center gap-2 rounded-control border border-blue-300 bg-white px-4 py-2 shadow-sm"
                  >
                    <span className="text-sm font-medium text-gray-900">{hospital.name}</span>
                    <button
                      onClick={() => toggleHospital(hospital)}
                      className="text-lg font-bold text-red-500 hover:text-red-700"
                      aria-label={`${hospital.name} 선택 해제`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <HomeSearchResultsSection
            filteredCount={hospitals.length}
            selectedCount={selectedHospitals.length}
            maxSelection={maxSelection}
            hospitalsMeta={hospitalsMeta}
            isLoading={isLoading}
            error={error}
            onRetry={() => {
              void refetchHospitals();
            }}
            noApiHospitalRows={noApiHospitalRows}
            clinicalFocusExcludedAll={clinicalFocusExcludedAll}
            noResultsAfterRegionOrNameFilter={noResultsAfterRegionOrNameFilter}
            clinicalFocusLabel={clinicalFocusLabel}
            allHospitalCount={allHospitals.length}
            onClearClinicalFocus={() => setClinicalFocus('none')}
            hospitals={hospitals}
            selectedHospitals={selectedHospitals}
            onToggleHospital={toggleHospital}
          />
        </div>
      </Container>

      <CompareBar
        selectedHospitals={selectedHospitals}
        onCompare={handleCompare}
        onClear={clearHospitals}
        onRemoveHospital={(hospitalId) => {
          const hospital = selectedHospitals.find((h) => h.id === hospitalId);
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
