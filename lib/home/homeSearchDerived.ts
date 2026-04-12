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
}

export function computeHomeSearchDerived(input: HomeSearchDerivedInput): HomeSearchDerived {
  const clinicalFocusExcludedAll =
    input.clinicalFocus !== 'none' &&
    !input.isLoading &&
    !input.error &&
    input.allHospitalCount > 0 &&
    input.filteredHospitalCount === 0;

  const searchActive =
    Boolean(input.sido) || Boolean(input.hospitalNameCommitted.trim());

  const showEmptySearchGuidance =
    searchActive &&
    !input.isLoading &&
    !input.error &&
    input.filteredHospitalCount === 0;

  const noApiHospitalRows =
    showEmptySearchGuidance && input.allHospitalCount === 0;

  const noResultsAfterRegionOrNameFilter =
    showEmptySearchGuidance &&
    input.allHospitalCount > 0 &&
    !clinicalFocusExcludedAll;

  return {
    clinicalFocusExcludedAll,
    searchActive,
    showEmptySearchGuidance,
    noApiHospitalRows,
    noResultsAfterRegionOrNameFilter,
  };
}
