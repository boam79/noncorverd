import { describe, expect, it } from 'vitest';
import { computeHospitalDataTrust } from '@/lib/utils/trustScore';
import type { HospitalPricing } from '@/types';

describe('computeHospitalDataTrust', () => {
  it('returns the lowest score/label for a hospital with no items', () => {
    const result = computeHospitalDataTrust({ hospitalId: 'h1', hospitalName: '병원', items: [] });
    expect(result.score).toBe(0);
    expect(result.label).toBe('낮음');
    expect(result.hints[0]).toContain('비급여 항목이 없습니다');
  });

  it('scores a rich, well-documented dataset as "높음"', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      name: `항목${i}`,
      price: 10000,
      code: `C${i}`,
      startDate: '2026-01-01',
    }));
    const result = computeHospitalDataTrust({
      hospitalId: 'h1',
      hospitalName: '병원',
      items,
      averagePrice: 10000,
    });
    expect(result.label).toBe('높음');
    expect(result.score).toBeGreaterThanOrEqual(72);
  });

  it('caps the score at 100', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      name: `항목${i}`,
      price: 10000,
      code: `C${i}`,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    }));
    const result = computeHospitalDataTrust({
      hospitalId: 'h1',
      hospitalName: '병원',
      items,
      averagePrice: 10000,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('gives a sparse dataset a middling score', () => {
    const result = computeHospitalDataTrust({
      hospitalId: 'h1',
      hospitalName: '병원',
      items: [{ id: '1', name: '항목', price: 1000 }],
    });
    expect(result.label).toBe('보통');
    expect(result.score).toBeLessThan(42);
  });
});
