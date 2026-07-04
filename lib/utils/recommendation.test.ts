import { describe, expect, it } from 'vitest';
import { recommendHospitals } from '@/lib/utils/recommendation';
import type { HospitalPricing } from '@/types';

function pricing(overrides: Partial<HospitalPricing>): HospitalPricing {
  return {
    hospitalId: 'h1',
    hospitalName: '병원',
    items: [],
    ...overrides,
  };
}

describe('recommendHospitals', () => {
  it('returns an empty array for empty or non-array input', () => {
    expect(recommendHospitals([])).toEqual([]);
    // @ts-expect-error 방어 로직 검증(런타임에서 배열이 아닌 값이 들어오는 경우)
    expect(recommendHospitals(null)).toEqual([]);
  });

  it('scores hospitals with more items and closer-to-average price higher', () => {
    const richHospital = pricing({
      hospitalId: 'rich',
      hospitalName: '가나병원',
      items: Array.from({ length: 60 }, (_, i) => ({ id: String(i), name: `항목${i}`, price: 10000 })),
      averagePrice: 10000,
    });
    const sparseHospital = pricing({
      hospitalId: 'sparse',
      hospitalName: '다라병원',
      items: [{ id: '1', name: '항목1', price: 100000 }],
      averagePrice: 100000,
    });

    const result = recommendHospitals([richHospital, sparseHospital]);

    expect(result[0].hospitalId).toBe('rich');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('respects the limit parameter', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      pricing({ hospitalId: `h${i}`, hospitalName: `병원${i}`, items: [{ id: '1', name: 'a', price: 1000 }] })
    );
    expect(recommendHospitals(many, 3)).toHaveLength(3);
  });

  it('breaks ties by Korean hospital name ascending order', () => {
    const same = (id: string, name: string) =>
      pricing({ hospitalId: id, hospitalName: name, items: [] });
    const result = recommendHospitals([same('b', '나병원'), same('a', '가병원')]);
    // 항목이 0개면 completeness/itemCount 점수가 0으로 동점 처리됨
    expect(result.map((r) => r.hospitalName)).toEqual(['가병원', '나병원']);
  });

  it('gives a score of 0 for a hospital with no items and no average price', () => {
    const [result] = recommendHospitals([pricing({ items: [] })]);
    expect(result.score).toBe(0);
  });
});
