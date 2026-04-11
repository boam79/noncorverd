import { test, expect } from '@playwright/test';
import {
  hospitalMatchesClinicalFocus,
  parseAllDeptCodesFromRaw,
  type ClinicalFocusId,
} from '../lib/constants/clinicalFocusBuckets';
import { hospitalAddressMatchesSigungu } from '../lib/utils/addressSigunguMatch';
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

test.describe('시군구 주소 매칭', () => {
  test('전체 행정명 우선: 양주시 O, 남양주시 X', () => {
    expect(
      hospitalAddressMatchesSigungu(
        '경기도 양주시 덕정동 1',
        '경기도 양주시',
        '양주시'
      )
    ).toBe(true);
    expect(
      hospitalAddressMatchesSigungu(
        '경기도 남양주시 진접읍 1',
        '경기도 양주시',
        '양주시'
      )
    ).toBe(false);
  });

  test('행정명 없을 때 공백 경계: 남양주시는 양주시 미포함', () => {
    expect(
      hospitalAddressMatchesSigungu(
        '경기도 남양주시 진접읍',
        '',
        '양주시'
      )
    ).toBe(false);
    expect(
      hospitalAddressMatchesSigungu('경기도 양주시 평동', '', '양주시')
    ).toBe(true);
  });
});

test.describe('관심 분야 보강 키워드', () => {
  test('산부인과: 산전·부인과·여성병원', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'ob', name: '○○산전진단센터', clCdNm: '의원' }),
        'obstetrics'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'ob2', name: '○○부인과의원', clCdNm: '의원' }),
        'obstetrics'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'ob3', name: '나무정원여성병원', clCdNm: '병원' }),
        'obstetrics'
      )
    ).toBe(true);
  });

  test('척추·관절: 디스크·정형외과(이름만)·코드 03', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'sj', name: '○○디스크병원', clCdNm: '병원' }),
        'spine_joint'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'sj2', name: '○○정형외과', clCdNm: '의원' }),
        'spine_joint'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'sj3', name: '○○정형외과요통클리닉', clCdNm: '의원' }),
        'spine_joint'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 'sj4',
          name: '○○의원',
          clCdNm: '의원',
          dgsbjtCdRaw: '03',
        }),
        'spine_joint'
      )
    ).toBe(true);
  });

  test('척추·관절: 시군구 단위 목록에서 정형외과가 한 곳이라도 잡히는지', () => {
    const pool = [
      h({ id: 'p1', name: '구리○○정형외과의원', clCdNm: '의원' }),
      h({ id: 'p2', name: '○○내과의원', clCdNm: '의원' }),
      h({ id: 'p3', name: '○○치과의원', clCdNm: '치과의원' }),
      h({ id: 'p4', name: '○○의원', clCdNm: '의원', dgsbjtCdRaw: '0105' }),
    ];
    const spine = pool.filter((x) => hospitalMatchesClinicalFocus(x, 'spine_joint'));
    expect(spine.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe('관심 분야 전 항목(이름·코드 보강)', () => {
  test('안과의원: 눈만 있는 의원, 눈성형은 안과의원 아님', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'eye1', name: '밝은눈의원', clCdNm: '의원' }),
        'ophthal_clinic'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'eye2', name: '○○눈성형외과', clCdNm: '의원' }),
        'ophthal_clinic'
      )
    ).toBe(false);
  });

  test('안과·병원급: 눈 + 병원', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'eye3', name: '○○눈병원', clCdNm: '병원' }),
        'ophthal_hospital'
      )
    ).toBe(true);
  });

  test('성형외과: 미용외과·미용+성형', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'ps1', name: '○○미용외과', clCdNm: '의원' }),
        'plastic_surgery'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'ps2', name: '○○미용성형센터', clCdNm: '의원' }),
        'plastic_surgery'
      )
    ).toBe(true);
  });

  test('소아과: 아동병원', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'pd1', name: '○○아동병원', clCdNm: '병원' }),
        'pediatrics'
      )
    ).toBe(true);
  });

  test('산부인과: 산후·진료과 산후조리', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'ob4', name: '○○산후조리원', clCdNm: '의원' }),
        'obstetrics'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({
          id: 'ob5',
          name: '행복의원',
          departments: ['산후조리원'],
          clCdNm: '의원',
        }),
        'obstetrics'
      )
    ).toBe(true);
  });

  test('신경과: 신경외과·코드 02', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'nv1', name: '○○신경외과', clCdNm: '의원' }),
        'neurology'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'nv2', name: '○○의원', dgsbjtCdRaw: '02', clCdNm: '의원' }),
        'neurology'
      )
    ).toBe(true);
  });

  test('이비인후과: 이목후·ENT', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'ent1', name: '○○이목후과', clCdNm: '의원' }),
        'ent'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'ent2', name: '서울ENT의원', clCdNm: '의원' }),
        'ent'
      )
    ).toBe(true);
  });

  test('피부과: 피부만 이름', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'dm1', name: '○○피부의원', clCdNm: '의원' }),
        'dermatology'
      )
    ).toBe(true);
  });

  test('비뇨의학과: 전립선·비뇨기과', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'ur1', name: '○○전립선비뇨기과', clCdNm: '의원' }),
        'urology'
      )
    ).toBe(true);
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'ur2', name: '○○비뇨기과의원', clCdNm: '의원' }),
        'urology'
      )
    ).toBe(true);
  });

  test('치과: 치과병원 종별', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'dt1', name: '○○치과', clCdNm: '치과의원' }),
        'dentistry'
      )
    ).toBe(true);
  });

  test('내과: 코드 01만', () => {
    expect(
      hospitalMatchesClinicalFocus(
        h({ id: 'im1', name: '○○의원', dgsbjtCdRaw: '01', clCdNm: '의원' }),
        'internal_medicine'
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
    'internal_medicine',
    'neurology',
    'ent',
    'dermatology',
    'urology',
    'dentistry',
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
