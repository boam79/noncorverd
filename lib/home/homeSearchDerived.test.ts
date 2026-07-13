import { describe, expect, it } from 'vitest';
import { computeHomeSearchDerived } from '@/lib/home/homeSearchDerived';

describe('computeHomeSearchDerived', () => {
  it('detects clinical focus excluding all visible rows', () => {
    const d = computeHomeSearchDerived({
      clinicalFocus: 'orthopedics',
      isLoading: false,
      error: null,
      allHospitalCount: 5,
      filteredHospitalCount: 0,
      sido: '11',
      hospitalNameCommitted: '',
    });
    expect(d.clinicalFocusExcludedAll).toBe(true);
    expect(d.showEmptySearchGuidance).toBe(true);
    expect(d.noApiHospitalRows).toBe(false);
  });

  it('noApiHospitalRows when API empty', () => {
    const d = computeHomeSearchDerived({
      clinicalFocus: 'none',
      isLoading: false,
      error: null,
      allHospitalCount: 0,
      filteredHospitalCount: 0,
      sido: '11',
      hospitalNameCommitted: '',
    });
    expect(d.noApiHospitalRows).toBe(true);
  });

  it('search inactive when no sido and empty name', () => {
    const d = computeHomeSearchDerived({
      clinicalFocus: 'none',
      isLoading: false,
      error: null,
      allHospitalCount: 0,
      filteredHospitalCount: 0,
      sido: undefined,
      hospitalNameCommitted: '   ',
    });
    expect(d.searchActive).toBe(false);
  });

  it('flags orphan sigungu separately from empty filters', () => {
    const d = computeHomeSearchDerived({
      clinicalFocus: 'none',
      isLoading: false,
      error: null,
      allHospitalCount: 3,
      filteredHospitalCount: 0,
      sido: '11',
      hospitalNameCommitted: '',
      sigungu: '999999',
      sigunguListLength: 5,
      sigunguInList: false,
    });
    expect(d.orphanSigungu).toBe(true);
    expect(d.noResultsAfterRegionOrNameFilter).toBe(false);
  });
});
