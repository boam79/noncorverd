import type { HospitalPricing } from '@/types';
import type {
  EstimatedTotalByHospitalId,
  QuantityByItemName,
} from '@/components/ComparisonTable/types';

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
  itemName: string
): number {
  return normalizeQuantity(quantities[itemName]);
}

export function calculateEstimatedTotalForHospital(
  hospital: HospitalPricing,
  quantities: QuantityByItemName
): number {
  return (hospital.items || []).reduce((sum, item) => {
    const quantity = getItemQuantity(quantities, item.name);
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
