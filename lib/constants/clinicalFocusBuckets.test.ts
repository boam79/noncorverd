import { describe, expect, it } from 'vitest';
import {
  hospitalMatchesClinicalFocus,
  parseAllDeptCodesFromRaw,
  parseDgsbjtCdToDepartments,
  splitDgsbjtCdNm,
} from '@/lib/constants/clinicalFocusBuckets';
import type { Hospital } from '@/types';

function makeHospital(overrides: Partial<Hospital>): Hospital {
  return {
    id: 'h1',
    name: '테스트병원',
    address: '서울특별시 종로구',
    type: '병원',
    departments: [],
    ...overrides,
  };
}

describe('parseAllDeptCodesFromRaw', () => {
  it('splits a concatenated even-length digit string into 2-digit codes', () => {
    expect(parseAllDeptCodesFromRaw('010305')).toEqual(['01', '03', '05']);
  });

  it('pads a single digit code', () => {
    expect(parseAllDeptCodesFromRaw('5')).toEqual(['05']);
  });

  it('splits on common delimiters', () => {
    expect(parseAllDeptCodesFromRaw('01,03;05 07')).toEqual(['01', '03', '05', '07']);
  });

  it('dedupes repeated codes and returns [] for empty input', () => {
    expect(parseAllDeptCodesFromRaw('01,01,01')).toEqual(['01']);
    expect(parseAllDeptCodesFromRaw()).toEqual([]);
    expect(parseAllDeptCodesFromRaw('')).toEqual([]);
  });
});

describe('splitDgsbjtCdNm', () => {
  it('splits Korean department name strings on common delimiters', () => {
    expect(splitDgsbjtCdNm('내과,외과/소아청소년과')).toEqual(['내과', '외과', '소아청소년과']);
  });

  it('returns [] for empty input', () => {
    expect(splitDgsbjtCdNm()).toEqual([]);
  });
});

describe('parseDgsbjtCdToDepartments', () => {
  it('maps known codes to Korean labels', () => {
    expect(parseDgsbjtCdToDepartments('010305')).toEqual(['내과', '정형외과', '산부인과']);
  });

  it('ignores unmapped codes', () => {
    expect(parseDgsbjtCdToDepartments('99')).toEqual([]);
  });
});

describe('hospitalMatchesClinicalFocus', () => {
  it('always matches when focus is "none"', () => {
    expect(hospitalMatchesClinicalFocus(makeHospital({}), 'none')).toBe(true);
  });

  describe('orthopedics / spine_joint (regression: 정형외과만 있어도 척추·관절 통과)', () => {
    it('matches orthopedics by name', () => {
      const h = makeHospital({ name: '서울정형외과의원' });
      expect(hospitalMatchesClinicalFocus(h, 'orthopedics')).toBe(true);
      expect(hospitalMatchesClinicalFocus(h, 'spine_joint')).toBe(true);
    });

    it('matches orthopedics by dept code 03 alone, without spine keywords in the name', () => {
      const h = makeHospital({ name: '좋은사랑의원', dgsbjtCdRaw: '03' });
      expect(hospitalMatchesClinicalFocus(h, 'orthopedics')).toBe(true);
      expect(hospitalMatchesClinicalFocus(h, 'spine_joint')).toBe(true);
    });

    it('matches spine_joint via marketing name hints even without an ortho code', () => {
      const h = makeHospital({ name: '좋은아침의원' });
      expect(hospitalMatchesClinicalFocus(h, 'spine_joint')).toBe(true);
    });

    it('does not match unrelated hospitals', () => {
      const h = makeHospital({ name: '서울내과의원' });
      expect(hospitalMatchesClinicalFocus(h, 'orthopedics')).toBe(false);
      expect(hospitalMatchesClinicalFocus(h, 'spine_joint')).toBe(false);
    });
  });

  describe('obstetrics (regression: 여성병원 = 산부인과)', () => {
    it('matches "여성병원" in the name', () => {
      expect(hospitalMatchesClinicalFocus(makeHospital({ name: '서울여성병원' }), 'obstetrics')).toBe(true);
    });

    it('matches by department code 05', () => {
      expect(hospitalMatchesClinicalFocus(makeHospital({ dgsbjtCdRaw: '05' }), 'obstetrics')).toBe(true);
    });
  });

  describe('pediatrics', () => {
    it('matches "소아과" but excludes "소아치과"', () => {
      expect(hospitalMatchesClinicalFocus(makeHospital({ name: '아이좋은소아과의원' }), 'pediatrics')).toBe(true);
      expect(hospitalMatchesClinicalFocus(makeHospital({ name: '아이좋은소아치과의원' }), 'pediatrics')).toBe(false);
    });
  });

  describe('plastic_surgery (regression: 성형외과 키워드 검색 병행)', () => {
    it('matches "성형외과" in the name', () => {
      expect(hospitalMatchesClinicalFocus(makeHospital({ name: '강남성형외과의원' }), 'plastic_surgery')).toBe(true);
    });
  });

  describe('dentistry', () => {
    it('matches by 종별(clCdNm) or name', () => {
      expect(hospitalMatchesClinicalFocus(makeHospital({ clCdNm: '치과의원' }), 'dentistry')).toBe(true);
      expect(hospitalMatchesClinicalFocus(makeHospital({ name: '미소치과' }), 'dentistry')).toBe(true);
      expect(hospitalMatchesClinicalFocus(makeHospital({ name: '미소내과' }), 'dentistry')).toBe(false);
    });
  });

  describe('ophthal_clinic vs ophthal_hospital (종별 구분)', () => {
    it('matches clinic-level eye hospitals only for ophthal_clinic', () => {
      const clinic = makeHospital({ name: '밝은안과의원', clCdNm: '의원' });
      expect(hospitalMatchesClinicalFocus(clinic, 'ophthal_clinic')).toBe(true);
      expect(hospitalMatchesClinicalFocus(clinic, 'ophthal_hospital')).toBe(false);
    });

    it('matches hospital-level eye hospitals only for ophthal_hospital', () => {
      const hospital = makeHospital({ name: '밝은안과병원', clCdNm: '병원' });
      expect(hospitalMatchesClinicalFocus(hospital, 'ophthal_hospital')).toBe(true);
      expect(hospitalMatchesClinicalFocus(hospital, 'ophthal_clinic')).toBe(false);
    });
  });

  describe('address boundary matching is out of scope here but focus mismatch returns false by default', () => {
    it('returns false when a hospital has no matching signal for a specific focus', () => {
      const h = makeHospital({ name: '아무개클리닉', departments: [] });
      expect(hospitalMatchesClinicalFocus(h, 'urology')).toBe(false);
      expect(hospitalMatchesClinicalFocus(h, 'dermatology')).toBe(false);
      expect(hospitalMatchesClinicalFocus(h, 'ent')).toBe(false);
      expect(hospitalMatchesClinicalFocus(h, 'neurology')).toBe(false);
      expect(hospitalMatchesClinicalFocus(h, 'internal_medicine')).toBe(false);
    });
  });
});
