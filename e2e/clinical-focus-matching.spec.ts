import { test, expect } from '@playwright/test';
import {
  hospitalMatchesClinicalFocus,
  parseAllDeptCodesFromRaw,
  type ClinicalFocusId,
} from '../lib/constants/clinicalFocusBuckets';
import type { Hospital } from '../types';

function h(p: Partial<Hospital> & Pick<Hospital, 'id' | 'name'>): Hospital {
  return {
    address: '',
    type: '병원',
    departments: [],
    ...p,
  };
}

test.describe('관심 분야 매칭(단위)', () => {
  test('연속 숫자 dgsbjtCd에서 모든 2자리 코드 추출', () => {
    expect(parseAllDeptCodesFromRaw('010305')).toEqual(['01', '03', '05']);
    expect(parseAllDeptCodesFromRaw('05')).toEqual(['05']);
    expect(parseAllDeptCodesFromRaw('5')).toEqual(['05']);
    expect(parseAllDeptCodesFromRaw('01, 05')).toEqual(['01', '05']);
  });

  test('이름 없이 연속 코드만으로 산부인과 매칭', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 't1',
          name: '양주시○○의원',
          dgsbjtCdRaw: '010305',
          clCdNm: '의원',
        }),
        'obstetrics'
      )
    ).toBe(true);
  });

  test('departments 한글명만으로 산부인과 매칭', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 't2',
          name: '행복의원',
          departments: ['산부인과'],
          clCdNm: '의원',
        }),
        'obstetrics'
      )
    ).toBe(true);
  });

  test('정형외과: 연속 코드 중 03', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 't3',
          name: '○○의원',
          dgsbjtCdRaw: '0103',
          clCdNm: '의원',
        }),
        'orthopedics'
      )
    ).toBe(true);
  });

  test('선택 안 함(none)은 항상 통과', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'n0', name: '아무의원', clCdNm: '의원' }),
        'none'
      )
    ).toBe(true);
  });

  test('안과의원: 의원급·안과·비한의', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 'e1',
          name: '○○안과의원',
          clCdNm: '의원',
        }),
        'ophthal_clinic'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 'e2',
          name: '○○안과의원',
          clCdNm: '한의원',
        }),
        'ophthal_clinic'
      )
    ).toBe(false);
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 'e3',
          name: '○○종합병원',
          departments: ['안과'],
          clCdNm: '종합병원',
        }),
        'ophthal_clinic'
      )
    ).toBe(false);
  });

  test('안과·병원급: 종합병원 + 안과', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 'e4',
          name: '○○대학교병원',
          departments: ['안과'],
          clCdNm: '종합병원',
        }),
        'ophthal_hospital'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 'e5',
          name: '길안과의원',
          clCdNm: '의원',
        }),
        'ophthal_hospital'
      )
    ).toBe(false);
  });

  test('소아과: 코드 06·이름·소아치과 제외', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 'p1',
          name: '○○의원',
          dgsbjtCdRaw: '0106',
          clCdNm: '의원',
        }),
        'pediatrics'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 'p2',
          name: '○○소아과의원',
          clCdNm: '의원',
        }),
        'pediatrics'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 'p3',
          name: '○○소아치과',
          clCdNm: '치과',
        }),
        'pediatrics'
      )
    ).toBe(false);
  });

  test('척추·관절: 키워드', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 's1', name: '○○척추관절병원', clCdNm: '병원' }),
        'spine_joint'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 's2', name: '일반의원', clCdNm: '의원' }),
        'spine_joint'
      )
    ).toBe(false);
  });

  test('성형외과: 이름 키워드', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'pl1', name: '○○성형외과', clCdNm: '의원' }),
        'plastic_surgery'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'pl2', name: '○○성형클리닉', clCdNm: '의원' }),
        'plastic_surgery'
      )
    ).toBe(true);
  });

  test('안과: 진료과 코드 07만으로 매칭', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 'e6',
          name: '○○의원',
          dgsbjtCdRaw: '0107',
          clCdNm: '의원',
        }),
        'ophthal_clinic'
      )
    ).toBe(true);
  });

  test('정형외과: 이름 정형외과', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'o1', name: '○○정형외과의원', clCdNm: '의원' }),
        'orthopedics'
      )
    ).toBe(true);
  });
});

test.describe('관심 분야 ID 전수(스모크)', () => {
  const ids: ClinicalFocusId[] = [
    'none',
    'ophthal_clinic',
    'ophthal_hospital',
    'orthopedics',
    'obstetrics',
    'pediatrics',
    'spine_joint',
    'plastic_surgery',
  ];

  for (const focus of ids) {
    test(`hospitalMatchesClinicalFocus 호출 가능: ${focus}`, () => {
      const sample = h({
        id: 'any',
        name: '테스트의원',
        clCdNm: '의원',
        dgsbjtCdRaw: '01020304050607080910',
      });
      const r = hospitalMatchesClinicalFocus(sample, focus);
      expect(typeof r).toBe('boolean');
    });
  }
});
