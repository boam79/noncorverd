import type { HospitalPricing } from '@/types';
import type {
  EstimatedTotalByHospitalId,
  QuantityByItemName,
} from '@/components/ComparisonTable/types';
import { comparisonItemKey } from '@/lib/opendata/mapPricingItem';

function normalizeQuantity(value: number | undefined): number {
  if (!Number.isFinite(value) || value === undefined) {
    return 1;
  }
  if (value < 0) {
    return 0;
  }
  return Math.floor(value);
}

export function getItemQuantity(
  quantities: QuantityByItemName,
  itemKey: string,
  legacyName?: string
): number {
  if (Object.prototype.hasOwnProperty.call(quantities, itemKey)) {
    return normalizeQuantity(quantities[itemKey]);
  }
  if (legacyName && Object.prototype.hasOwnProperty.call(quantities, legacyName)) {
    return normalizeQuantity(quantities[legacyName]);
  }
  return normalizeQuantity(undefined);
}

export function calculateEstimatedTotalForHospital(
  hospital: HospitalPricing,
  quantities: QuantityByItemName
): number {
  return (hospital.items || []).reduce((sum, item) => {
    const key = comparisonItemKey(item);
    const quantity = getItemQuantity(quantities, key, item.name);
    return sum + item.price * quantity;
  }, 0);
}

export function calculateEstimatedTotalsByHospital(
  pricingData: HospitalPricing[],
  quantities: QuantityByItemName
): EstimatedTotalByHospitalId {
  return pricingData.reduce<EstimatedTotalByHospitalId>((acc, hospital) => {
    acc[hospital.hospitalId] = calculateEstimatedTotalForHospital(
      hospital,
      quantities
    );
    return acc;
  }, {});
}
