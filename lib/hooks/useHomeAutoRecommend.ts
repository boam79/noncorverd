import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import {
  recommendHospitals,
  type HospitalRecommendation,
} from '@/lib/utils/recommendation';
import type { Hospital, HospitalPricing } from '@/types';

export function useHomeAutoRecommend(options: {
  hospitals: Hospital[];
  selectedHospitals: Hospital[];
  maxSelection: number;
  toggleHospital: (hospital: Hospital) => void;
}) {
  const { hospitals, selectedHospitals, maxSelection, toggleHospital } = options;
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendMessage, setRecommendMessage] = useState('');
  const [recommendBreakdown, setRecommendBreakdown] = useState<
    HospitalRecommendation[] | null
  >(null);

  const handleAutoRecommend = useCallback(async () => {
    const remainingSlots = Math.max(0, maxSelection - selectedHospitals.length);
    if (remainingSlots <= 0) {
      setRecommendMessage(`최대 ${maxSelection}개까지 선택 가능합니다.`);
      return;
    }

    const candidates = hospitals
      .filter((hospital) => !selectedHospitals.some((selected) => selected.id === hospital.id))
      .slice(0, 8);

    if (candidates.length === 0) {
      setRecommendMessage('추천할 병원 후보가 없습니다.');
      return;
    }

    setIsRecommending(true);
    setRecommendMessage('');
    setRecommendBreakdown(null);
    try {
      const response = await apiClient.getNonCoveredPricing(
        candidates.map((hospital) => hospital.id),
        candidates.map((hospital) => ({ id: hospital.id, name: hospital.name }))
      );

      if (!response.ok || !Array.isArray(response.data)) {
        throw new Error(response.error?.message || '추천 데이터를 가져오지 못했습니다.');
      }

      const pricingData = (response.data as Array<HospitalPricing & { ok?: boolean }>).filter(
        (row) => row.ok !== false
      );
      if (pricingData.length === 0) {
        setRecommendMessage('추천에 사용할 가격 정보를 불러오지 못했습니다.');
        return;
      }

      const recommendations = recommendHospitals(
        pricingData,
        Math.min(3, remainingSlots)
      );
      if (recommendations.length === 0) {
        setRecommendMessage('추천 점수를 계산할 데이터가 부족합니다.');
        return;
      }

      setRecommendBreakdown(recommendations);

      const recommendedHospitals = recommendations
        .map((recommendation) =>
          candidates.find((hospital) => hospital.id === recommendation.hospitalId)
        )
        .filter((hospital): hospital is NonNullable<typeof hospital> => Boolean(hospital));

      recommendedHospitals.forEach((hospital) => {
        if (!selectedHospitals.some((selected) => selected.id === hospital.id)) {
          toggleHospital(hospital);
        }
      });

      setRecommendMessage(`추천 병원 ${recommendedHospitals.length}곳을 자동 선택했습니다.`);
    } catch (err) {
      setRecommendMessage(
        err instanceof Error ? err.message : '추천 병원 선택 중 오류가 발생했습니다.'
      );
    } finally {
      setIsRecommending(false);
    }
  }, [hospitals, maxSelection, selectedHospitals, toggleHospital]);

  return {
    isRecommending,
    recommendMessage,
    recommendBreakdown,
    handleAutoRecommend,
  };
}
