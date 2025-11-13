import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { HospitalPricing } from '@/types';

export function usePricing(hospitalIds: string[], enabled = true) {
  return useQuery({
    queryKey: ['pricing', hospitalIds.slice().sort().join(',')],
    queryFn: async (): Promise<HospitalPricing[]> => {
      if (hospitalIds.length === 0) {
        return [];
      }
      const response = await apiClient.getNonCoveredPricing(hospitalIds);
      if (response.ok && Array.isArray(response.data)) {
        return response.data as HospitalPricing[];
      }
      if (response.ok && response.data && Array.isArray((response.data as { data?: unknown }).data)) {
        return (response.data as { data: HospitalPricing[] }).data;
      }
      throw new Error(response.error?.message || '가격 정보를 불러오는데 실패했습니다.');
    },
    enabled: enabled && hospitalIds.length > 0,
    staleTime: 12 * 60 * 60 * 1000, // 12시간
    gcTime: 24 * 60 * 60 * 1000, // 24시간 캐시 유지
    placeholderData: keepPreviousData,
    select: (data) =>
      data.map((pricing) => ({
        ...pricing,
        items: Array.isArray(pricing.items) ? pricing.items : [],
      })),
  });
}

