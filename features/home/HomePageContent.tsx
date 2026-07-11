'use client';

import { useState, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { Container } from '@/components/Layout/Container';
import { CompareBar } from '@/components/CompareBar/CompareBar';
import { ServerStatusBanner } from '@/components/ServerStatusBanner/ServerStatusBanner';
import { useHomeHospitalSearch } from '@/lib/hooks/useHomeHospitalSearch';
import { useRegions } from '@/lib/hooks/useRegions';
import { useRecordRecentSearchOnHome } from '@/lib/hooks/useRecordRecentSearchOnHome';
import { useComparisonStore } from '@/lib/stores/comparisonStore';
import { useHomeAutoRecommend } from '@/lib/hooks/useHomeAutoRecommend';
import {
  CLINICAL_FOCUS_OPTIONS,
  type ClinicalFocusId,
} from '@/lib/constants/clinicalFocusBuckets';
import { loadRecentSearches, type RecentSearchEntry } from '@/lib/recentSearches';
import { HomeSearchPanel } from '@/components/HomeSearch/HomeSearchPanel';
import { HomeSearchContextBar } from '@/components/HomeSearch/HomeSearchContextBar';
import { HomeSearchResultsSection } from '@/components/HomeSearch/HomeSearchResultsSection';
import { HomeSearchJourneySteps } from '@/components/HomeSearch/HomeSearchJourneySteps';
import { HomeHero } from '@/components/HomeSearch/HomeHero';
import { SelectedHospitalsStrip } from '@/components/HomeSearch/SelectedHospitalsStrip';
import {
  scrollToHomeSection,
  type HomeSearchScrollTarget,
} from '@/lib/home/homeSearchSectionIds';
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

  const { data: sidoBundle } = useRegions();
  const sidoList = useMemo(() => sidoBundle?.regions ?? [], [sidoBundle]);

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

  const sidoName = useMemo(
    () => (sido ? sidoList.find((r) => r.code === sido)?.name : undefined),
    [sido, sidoList]
  );
  const sigunguName = useMemo(
    () => (sigungu ? sigunguList.find((r) => r.code === sigungu)?.name : undefined),
    [sigungu, sigunguList]
  );

  const filterSummary = useMemo(() => {
    const region =
      sidoName != null
        ? sigunguName != null
          ? `${sidoName} ${sigunguName}`
          : sidoName
        : '지역 미선택';
    const parts: string[] = [region];
    if (hospitalName.trim()) parts.push(`이름 「${hospitalName.trim()}」`);
    if (clinicalFocus !== 'none' && clinicalFocusLabel) {
      parts.push(`관심: ${clinicalFocusLabel}`);
    }
    return parts.join(' · ');
  }, [sidoName, sigunguName, hospitalName, clinicalFocus, clinicalFocusLabel]);

  const handleScrollToHomeSection = useCallback((target: HomeSearchScrollTarget) => {
    scrollToHomeSection(target);
  }, []);

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
      // 시도가 바뀌면 시군구를 버리고, 같은 시도 안에서는 전달된 시군구를 그대로 반영
      if (sido !== newSido) {
        setSido(newSido);
        setSigungu(undefined);
        return;
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

  const scrollToSearch = useCallback(() => {
    scrollToHomeSection('region');
  }, []);

  return (
    <div className="min-h-screen atmosphere pb-28 md:pb-24">
      <Header onHomeClick={handleHomeClick} compact />
      {showBetaRibbon && (
        <div
          className="border-b border-warning-200 bg-warning-50 px-4 py-2 text-center text-sm text-warning-900"
          role="status"
        >
          UI v2 베타 — 단계 안내·맥락 칩·검색·결과 구역 분리가 포함됩니다.
          (`NEXT_PUBLIC_UI_V2_BETA=1`)
        </div>
      )}
      <ServerStatusBanner />

      <HomeHero onStart={scrollToSearch} />

      <Container className="py-section md:py-section-lg">
        <HomeSearchJourneySteps
          hasSido={Boolean(sido)}
          selectedCount={selectedHospitals.length}
        />
        <HomeSearchContextBar
          sido={sido}
          sigungu={sigungu}
          sidoList={sidoList}
          sigunguList={sigunguList}
          clinicalFocusLabel={clinicalFocusLabel}
          hospitalNameCommitted={hospitalName}
          selectedCount={selectedHospitals.length}
          maxSelection={maxSelection}
          onScrollToSection={handleScrollToHomeSection}
        />
        <div className="mt-section space-y-section animate-slide-up">
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

          <SelectedHospitalsStrip
            hospitals={selectedHospitals}
            maxSelection={maxSelection}
            onRemove={(hospital) => {
              toggleHospital(hospital);
            }}
          />

          <HomeSearchResultsSection
            filterSummary={filterSummary}
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
