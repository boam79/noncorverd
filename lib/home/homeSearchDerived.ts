import type { ClinicalFocusId } from '@/lib/constants/clinicalFocusBuckets';

export interface HomeSearchDerivedInput {
  clinicalFocus: ClinicalFocusId;
  isLoading: boolean;
  error: unknown;
  allHospitalCount: number;
  filteredHospitalCount: number;
  sido?: string;
  hospitalNameCommitted: string;
}

export interface HomeSearchDerived {
  clinicalFocusExcludedAll: boolean;
  searchActive: boolean;
  showEmptySearchGuidance: boolean;
  noApiHospitalRows: boolean;
  noResultsAfterRegionOrNameFilter: boolean;
  orphanSigungu: boolean;
}

export function computeHomeSearchDerived(input: HomeSearchDerivedInput & {
  sigungu?: string;
  sigunguListLength?: number;
  sigunguInList?: boolean;
}): HomeSearchDerived & { orphanSigungu: boolean } {
  const orphanSigungu = Boolean(
    input.sigungu &&
      (input.sigunguListLength ?? 0) > 0 &&
      input.sigunguInList === false
  );

  const clinicalFocusExcludedAll =
    input.clinicalFocus !== 'none' &&
    !input.isLoading &&
    !input.error &&
    input.allHospitalCount > 0 &&
    input.filteredHospitalCount === 0 &&
    !orphanSigungu;

  const searchActive =
    Boolean(input.sido) || Boolean(input.hospitalNameCommitted.trim());

  const showEmptySearchGuidance =
    searchActive &&
    !input.isLoading &&
    !input.error &&
    input.filteredHospitalCount === 0;

  const noApiHospitalRows =
    showEmptySearchGuidance && input.allHospitalCount === 0 && !orphanSigungu;

  const noResultsAfterRegionOrNameFilter =
    showEmptySearchGuidance &&
    input.allHospitalCount > 0 &&
    !clinicalFocusExcludedAll &&
    !orphanSigungu;

  return {
    clinicalFocusExcludedAll,
    searchActive,
    showEmptySearchGuidance,
    noApiHospitalRows,
    noResultsAfterRegionOrNameFilter,
    orphanSigungu,
  };
}
