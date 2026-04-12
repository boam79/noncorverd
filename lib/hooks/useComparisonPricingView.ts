import { useMemo } from 'react';
import type { HospitalPricing } from '@/types';
import { computeComparisonPricingView } from '@/lib/comparison/comparisonPricingView';

export function useComparisonPricingView(
  pricingData: HospitalPricing[] | undefined,
  excludeZeroItemHospitals: boolean
) {
  return useMemo(
    () => computeComparisonPricingView(pricingData, excludeZeroItemHospitals),
    [pricingData, excludeZeroItemHospitals]
  );
}
