import type { HospitalPricing } from '@/types';

export interface HospitalRecommendation {
  hospitalId: string;
  hospitalName: string;
  score: number;
  completenessScore: number;
  itemCountScore: number;
  stabilityScore: number;
}

const WEIGHTS = {
  completeness: 40,
  itemCount: 30,
  stability: 30,
} as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function calculateCompletenessScore(itemCount: number): number {
  if (itemCount <= 0) return 0;
  // 50개 이상이면 만점 처리
  return clampScore((itemCount / 50) * 100);
}

function calculateItemCountScore(itemCount: number, maxItemCount: number): number {
  if (itemCount <= 0 || maxItemCount <= 0) return 0;
  return clampScore((itemCount / maxItemCount) * 100);
}

function calculateStabilityScore(
  averagePrice: number,
  globalAveragePrice: number
): number {
  if (averagePrice <= 0 || globalAveragePrice <= 0) return 0;
  const ratio = Math.abs(averagePrice - globalAveragePrice) / globalAveragePrice;
  // 평균에서 멀수록 감점 (0 차이 = 100점, 100% 차이 = 0점)
  return clampScore(100 - ratio * 100);
}

export function recommendHospitals(
  pricingData: HospitalPricing[],
  limit: number = 3
): HospitalRecommendation[] {
  if (!Array.isArray(pricingData) || pricingData.length === 0) {
    return [];
  }

  const itemCounts = pricingData.map((hospital) => hospital.items?.length ?? 0);
  const maxItemCount = Math.max(...itemCounts, 0);
  const validAverages = pricingData
    .map((hospital) => hospital.averagePrice ?? 0)
    .filter((price) => price > 0);
  const globalAveragePrice =
    validAverages.length > 0
      ? validAverages.reduce((sum, value) => sum + value, 0) / validAverages.length
      : 0;

  const recommendations = pricingData.map((hospital) => {
    const itemCount = hospital.items?.length ?? 0;
    const averagePrice = hospital.averagePrice ?? 0;

    const completenessScore = calculateCompletenessScore(itemCount);
    const itemCountScore = calculateItemCountScore(itemCount, maxItemCount);
    const stabilityScore = calculateStabilityScore(averagePrice, globalAveragePrice);

    const weightedScore =
      completenessScore * (WEIGHTS.completeness / 100) +
      itemCountScore * (WEIGHTS.itemCount / 100) +
      stabilityScore * (WEIGHTS.stability / 100);

    return {
      hospitalId: hospital.hospitalId,
      hospitalName: hospital.hospitalName,
      score: Math.round(weightedScore),
      completenessScore: Math.round(completenessScore),
      itemCountScore: Math.round(itemCountScore),
      stabilityScore: Math.round(stabilityScore),
    };
  });

  return recommendations
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // 동점 시 병원명 오름차순 (일관성)
      return a.hospitalName.localeCompare(b.hospitalName, 'ko');
    })
    .slice(0, limit);
}
