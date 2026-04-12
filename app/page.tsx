'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

export default function Home() {
  const router = useRouter();
  const [sido, setSido] = useState<string>();
  const [sigungu, setSigungu] = useState<string>();
  const [hospitalNameInput, setHospitalNameInput] = useState<string>('');
  const [hospitalName, setHospitalName] = useState<string>('');
  const [clinicalFocus, setClinicalFocus] = useState<ClinicalFocusId>('none');
  const [recentList, setRecentList] = useState<RecentSearchEntry[]>([]);

  const { selectedHospitals, toggleHospital, clearHospitals, maxSelection } = useComparisonStore();

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

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-24">
      <Header onHomeClick={handleHomeClick} />
      <ServerStatusBanner />

      <Container className="py-8 md:py-12">
        <div className="space-y-8">
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
                    <span className="text-sm font-medium text-gray-900">{hospital.name}</span>
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
