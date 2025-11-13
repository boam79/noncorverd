import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { HospitalPricing } from '@/types';

export function usePricing(hospitalIds: string[], enabled = true) {
  return useQuery({
    queryKey: ['pricing', hospitalIds.sort().join(',')],
    queryFn: async () => {
      if (hospitalIds.length === 0) {
        return [];
      }
      const response = await apiClient.getNonCoveredPricing(hospitalIds);
      if (response.ok && response.data) {
        return response.data as HospitalPricing[];
      }
      throw new Error(response.error?.message || '가격 정보를 불러오는데 실패했습니다.');
    },
    enabled: enabled && hospitalIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

