import { describe, expect, it } from 'vitest';
import { filterHospitalsForHome } from '@/lib/home/filterHospitalsForHome';
import type { Hospital, Region } from '@/types';

const h = (partial: Partial<Hospital> & Pick<Hospital, 'id' | 'name'>): Hospital => ({
  id: partial.id,
  name: partial.name,
  address: partial.address ?? '',
  type: partial.type ?? '종합병원',
  departments: partial.departments ?? [],
});

describe('filterHospitalsForHome', () => {
  it('filters by name substring', () => {
    const all = [h({ id: '1', name: '서울대병원' }), h({ id: '2', name: '연세병원' })];
    const out = filterHospitalsForHome({
      allHospitals: all,
      sigunguList: [],
      nameForClientFilter: '서울',
      clinicalFocus: 'none',
    });
    expect(out.map((x) => x.id)).toEqual(['1']);
  });

  it('returns all when no filters', () => {
    const all = [h({ id: '1', name: 'A' })];
    const out = filterHospitalsForHome({
      allHospitals: all,
      sigunguList: [],
      nameForClientFilter: '',
      clinicalFocus: 'none',
    });
    expect(out).toHaveLength(1);
  });

  it('filters by sigungu address when list has official name', () => {
    const sigunguList: Region[] = [{ code: '116800', name: '서울특별시 강남구' }];
    const all = [
      h({ id: '1', name: 'A', address: '서울특별시 강남구 테헤란로 1' }),
      h({ id: '2', name: 'B', address: '서울특별시 종로구 청와대로 1' }),
    ];
    const out = filterHospitalsForHome({
      allHospitals: all,
      sigunguList,
      sigungu: '116800',
      nameForClientFilter: '',
      clinicalFocus: 'none',
    });
    expect(out.map((x) => x.id)).toEqual(['1']);
  });

  it('returns empty when sigungu code is unknown after list loaded', () => {
    const sigunguList: Region[] = [{ code: '116800', name: '서울특별시 강남구' }];
    const all = [h({ id: '1', name: 'A', address: '서울특별시 강남구 테헤란로 1' })];
    const out = filterHospitalsForHome({
      allHospitals: all,
      sigunguList,
      sigungu: '999999',
      nameForClientFilter: '',
      clinicalFocus: 'none',
    });
    expect(out).toHaveLength(0);
  });

  it('skips address filter while sigungu list is still empty (loading)', () => {
    const all = [h({ id: '1', name: 'A', address: '서울특별시 종로구 1' })];
    const out = filterHospitalsForHome({
      allHospitals: all,
      sigunguList: [],
      sigungu: '111100',
      nameForClientFilter: '',
      clinicalFocus: 'none',
    });
    expect(out).toHaveLength(1);
  });

  it('keeps only Sejong addresses when sido is 36', () => {
    const all = [
      h({ id: '1', name: 'A', address: '세종특별자치시 한누리대로 1' }),
      h({ id: '2', name: 'B', address: '전라남도 목포시 1' }),
    ];
    const out = filterHospitalsForHome({
      allHospitals: all,
      sigunguList: [],
      sido: '36',
      nameForClientFilter: '',
      clinicalFocus: 'none',
    });
    expect(out.map((x) => x.id)).toEqual(['1']);
  });

  it('strips 특별자치시 when matching sigungu labels', () => {
    const sigunguList: Region[] = [{ code: '361100', name: '세종특별자치시' }];
    const all = [
      h({ id: '1', name: 'A', address: '세종특별자치시 보람동 1' }),
      h({ id: '2', name: 'B', address: '충청남도 천안시 1' }),
    ];
    const out = filterHospitalsForHome({
      allHospitals: all,
      sigunguList,
      sigungu: '361100',
      sido: '36',
      nameForClientFilter: '',
      clinicalFocus: 'none',
    });
    expect(out.map((x) => x.id)).toEqual(['1']);
  });
});
