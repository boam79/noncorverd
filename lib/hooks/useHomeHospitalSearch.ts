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
    isLoading,
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
