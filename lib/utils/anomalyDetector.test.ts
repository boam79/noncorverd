import { describe, expect, it } from 'vitest';
import { DEFAULT_OUTLIER_THRESHOLD_PERCENT, detectOutliers, getTopOutliersByHospital } from '@/lib/utils/anomalyDetector';
import type { ComparisonItemEntry } from '@/components/ComparisonTable/types';

function makeItem(overrides: Partial<ComparisonItemEntry>): ComparisonItemEntry {
  return {
    name: '초음파',
    averagePrice: 10000,
    maxPrice: 10000,
    minPrice: 10000,
    hospitalCount: 1,
    hospitals: {},
    ...overrides,
  };
}

describe('detectOutliers', () => {
  it('flags a price at exactly the default threshold (30%) as an outlier', () => {
    const item = makeItem({
      averagePrice: 10000,
      hospitals: {
        h1: { hospitalId: 'h1', hospitalName: 'A병원', price: 13000, diff: 3000, percentDiff: 30, isHighest: true, isLowest: false },
      },
    });
    const outliers = detectOutliers([item]);
    expect(outliers).toHaveLength(1);
    expect(outliers[0]).toMatchObject({ hospitalId: 'h1', ratioPercent: 30, itemName: '초음파' });
  });

  it('does not flag prices below the threshold', () => {
    const item = makeItem({
      averagePrice: 10000,
      hospitals: {
        h1: { hospitalId: 'h1', hospitalName: 'A병원', price: 10500, diff: 500, percentDiff: 5, isHighest: true, isLowest: false },
      },
    });
    expect(detectOutliers([item])).toEqual([]);
  });

  it('supports a custom threshold', () => {
    const item = makeItem({
      averagePrice: 10000,
      hospitals: {
        h1: { hospitalId: 'h1', hospitalName: 'A병원', price: 10500, diff: 500, percentDiff: 5, isHighest: true, isLowest: false },
      },
    });
    expect(detectOutliers([item], 5)).toHaveLength(1);
    expect(DEFAULT_OUTLIER_THRESHOLD_PERCENT).toBe(30);
  });

  it('ignores items without a positive average price', () => {
    const item = makeItem({
      averagePrice: 0,
      hospitals: {
        h1: { hospitalId: 'h1', hospitalName: 'A병원', price: 99999, diff: 0, percentDiff: 0, isHighest: false, isLowest: false },
      },
    });
    expect(detectOutliers([item])).toEqual([]);
  });
});

describe('getTopOutliersByHospital', () => {
  it('groups by hospital and sorts by ratio descending, limited per hospital', () => {
    const outliers = [
      { hospitalId: 'h1', hospitalName: 'A', itemName: 'x', price: 100, averagePrice: 100, ratioPercent: 40 },
      { hospitalId: 'h1', hospitalName: 'A', itemName: 'y', price: 100, averagePrice: 100, ratioPercent: 80 },
      { hospitalId: 'h1', hospitalName: 'A', itemName: 'z', price: 100, averagePrice: 100, ratioPercent: 60 },
      { hospitalId: 'h2', hospitalName: 'B', itemName: 'w', price: 100, averagePrice: 100, ratioPercent: 35 },
    ];

    const grouped = getTopOutliersByHospital(outliers, 2);

    expect(Object.keys(grouped).sort()).toEqual(['h1', 'h2']);
    expect(grouped.h1.map((o) => o.itemName)).toEqual(['y', 'z']);
    expect(grouped.h2).toHaveLength(1);
  });

  it('returns an empty object for no outliers', () => {
    expect(getTopOutliersByHospital([])).toEqual({});
  });
});
