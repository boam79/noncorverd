import type { ComparisonItemEntry, OutlierEntry } from '@/components/ComparisonTable/types';

export const DEFAULT_OUTLIER_THRESHOLD_PERCENT = 30;

export function detectOutliers(
  items: ComparisonItemEntry[],
  thresholdPercent: number = DEFAULT_OUTLIER_THRESHOLD_PERCENT
): OutlierEntry[] {
  const outliers: OutlierEntry[] = [];

  for (const item of items) {
    if (!item.averagePrice || item.averagePrice <= 0) {
      continue;
    }

    for (const [hospitalId, entry] of Object.entries(item.hospitals)) {
      const diffRatio = ((entry.price - item.averagePrice) / item.averagePrice) * 100;
      if (diffRatio >= thresholdPercent) {
        outliers.push({
          hospitalId,
          hospitalName: entry.hospitalName,
          itemName: item.name,
          price: entry.price,
          averagePrice: item.averagePrice,
          ratioPercent: Math.round(diffRatio),
        });
      }
    }
  }

  return outliers;
}

export function getTopOutliersByHospital(
  outliers: OutlierEntry[],
  limitPerHospital: number = 3
): Record<string, OutlierEntry[]> {
  const grouped: Record<string, OutlierEntry[]> = {};

  for (const outlier of outliers) {
    if (!grouped[outlier.hospitalId]) {
      grouped[outlier.hospitalId] = [];
    }
    grouped[outlier.hospitalId].push(outlier);
  }

  for (const hospitalId of Object.keys(grouped)) {
    grouped[hospitalId] = grouped[hospitalId]
      .sort((a, b) => b.ratioPercent - a.ratioPercent)
      .slice(0, limitPerHospital);
  }

  return grouped;
}
