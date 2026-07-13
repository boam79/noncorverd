import { useEffect, useRef } from 'react';
import type { Region } from '@/types';
import { pushRecentSearch, loadRecentSearches, type RecentSearchEntry } from '@/lib/recentSearches';

export function useRecordRecentSearchOnHome(options: {
  sido?: string;
  sigungu?: string;
  sidoList?: Region[];
  hospitalNameCommitted: string;
  apiHospitalName: string;
  sigunguList: Region[];
  hospitalsResultCount: number;
  isLoading: boolean;
  error: unknown;
  setRecentList: (entries: RecentSearchEntry[]) => void;
}): void {
  const {
    sido,
    sigungu,
    sidoList = [],
    hospitalNameCommitted,
    apiHospitalName,
    sigunguList,
    hospitalsResultCount,
    isLoading,
    error,
    setRecentList,
  } = options;
  const lastRecordedSearchKey = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isLoading || error) return;
    if (!sido && !hospitalNameCommitted.trim()) return;
    if (hospitalsResultCount === 0) return;

    const sidoName = sidoList.find((s) => s.code === sido)?.name?.trim() ?? '';
    const sigunguName =
      sigunguList.find((s) => s.code === sigungu)?.name?.trim() ?? '';
    const label = [
      sidoName || undefined,
      sigunguName || undefined,
      apiHospitalName || hospitalNameCommitted.trim() || undefined,
    ]
      .filter(Boolean)
      .join(' · ');
    const key = `${sido ?? ''}|${sigungu ?? ''}|${apiHospitalName}|${hospitalNameCommitted}|${hospitalsResultCount}`;
    if (lastRecordedSearchKey.current === key) return;
    lastRecordedSearchKey.current = key;

    pushRecentSearch({
      label: label || '지역 검색',
      sido,
      sigungu,
      hospitalName: apiHospitalName || hospitalNameCommitted.trim() || undefined,
    });
    setRecentList(loadRecentSearches());
  }, [
    apiHospitalName,
    error,
    hospitalNameCommitted,
    hospitalsResultCount,
    isLoading,
    setRecentList,
    sigungu,
    sigunguList,
    sido,
    sidoList,
  ]);
}
