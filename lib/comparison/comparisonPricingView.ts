import type { HospitalPricing } from '@/types';

export function computeComparisonPricingView(
  pricingData: HospitalPricing[] | undefined,
  excludeZeroItemHospitals: boolean
): {
  hospitalsWithNoItems: HospitalPricing[];
  visiblePricingData: HospitalPricing[];
} {
  const hospitalsWithNoItems =
    pricingData?.filter((hospital) => !hospital.items || hospital.items.length === 0) ?? [];

  if (!pricingData || !Array.isArray(pricingData)) {
    return { hospitalsWithNoItems, visiblePricingData: [] };
  }

  const visiblePricingData = excludeZeroItemHospitals
    ? pricingData.filter((hospital) => hospital.items && hospital.items.length > 0)
    : pricingData;

  return { hospitalsWithNoItems, visiblePricingData };
}
