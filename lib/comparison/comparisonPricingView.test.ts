import { describe, expect, it } from 'vitest';
import { computeComparisonPricingView } from '@/lib/comparison/comparisonPricingView';
import type { HospitalPricing } from '@/types';

const row = (id: string, items: HospitalPricing['items']): HospitalPricing => ({
  hospitalId: id,
  hospitalName: `병원${id}`,
  items,
});

describe('computeComparisonPricingView', () => {
  it('excludes zero-item hospitals when flag is on', () => {
    const data = [row('a', [{ id: '1', name: 'x', price: 1 }]), row('b', [])];
    const { visiblePricingData, hospitalsWithNoItems } = computeComparisonPricingView(
      data,
      true
    );
    expect(visiblePricingData.map((r) => r.hospitalId)).toEqual(['a']);
    expect(hospitalsWithNoItems.map((r) => r.hospitalId)).toEqual(['b']);
  });

  it('returns empty visible when no data', () => {
    const { visiblePricingData } = computeComparisonPricingView(undefined, true);
    expect(visiblePricingData).toEqual([]);
  });
});
