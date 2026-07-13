import { useMemo } from 'react';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { useHospitals } from '@/lib/hooks/useHospitals';
import { useRegions } from '@/lib/hooks/useRegions';
import type { ApiResponse } from '@/types';
import type { ClinicalFocusId } from '@/lib/constants/clinicalFocusBuckets';
import { filterHospitalsForHome } from '@/lib/home/filterHospitalsForHome';

export interface UseHomeHospitalSearchParams {
  sido?: string;
  sigungu?: string;
  hospitalNameInput: string;
  /** 시도 없을 때만 엔터로 확정된 병원명 검색에 사용 */
  hospitalNameCommitted: string;
  clinicalFocus: ClinicalFocusId;
}

export function useHomeHospitalSearch({
  sido,
  sigungu,
  hospitalNameInput,
  hospitalNameCommitted,
  clinicalFocus,
}: UseHomeHospitalSearchParams) {
  const debouncedHospitalInput = useDebouncedValue(hospitalNameInput, 400);
  const apiHospitalName = sido ? debouncedHospitalInput.trim() : hospitalNameCommitted.trim();

  const { data: sigunguBundle } = useRegions(sido);
  const sigunguList = useMemo(
    () => sigunguBundle?.regions ?? [],
    [sigunguBundle]
  );

  const {
    data: hospitalsBundle,
    isLoading: hospitalsLoading,
    error,
    refetch: refetchHospitals,
  } = useHospitals({
    sido,
    sigungu,
    hospitalName: apiHospitalName || undefined,
    enabled: !!sido || !!hospitalNameCommitted.trim(),
  });

  const allHospitals = useMemo(
    () => hospitalsBundle?.hospitals ?? [],
    [hospitalsBundle]
  );
  const hospitalsMeta = hospitalsBundle?.meta as ApiResponse['meta'] | undefined;

  // 시군구가 선택됐는데 목록이 아직 없으면 주소 필터 전 로딩으로 간주 (전체 시도 목록 깜빡임 방지)
  const waitingForSigunguMeta = Boolean(sido && sigungu && sigunguList.length === 0);
  const isLoading = hospitalsLoading || waitingForSigunguMeta;

  const hospitals = useMemo(
    () =>
      filterHospitalsForHome({
        allHospitals,
        sigunguList,
        sigungu,
        nameForClientFilter: apiHospitalName,
        clinicalFocus,
      }),
    [allHospitals, sigungu, sigunguList, apiHospitalName, clinicalFocus]
  );

  return {
    apiHospitalName,
    sigunguList,
    allHospitals,
    hospitals,
    hospitalsMeta,
    isLoading,
    error,
    refetchHospitals,
  };
}
