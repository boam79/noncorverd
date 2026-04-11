import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { HospitalPricing, Hospital } from '@/types';
import {
  attachQueryErrorMeta,
  isRetryableApiCode,
} from '@/lib/utils/errorHandler';

export function usePricing(hospitalIds: string[], hospitals?: Hospital[], enabled = true) {
  return useQuery({
    queryKey: ['pricing', hospitalIds.slice().sort().join(','), hospitals?.map(h => h.id).sort().join(',')],
    queryFn: async (): Promise<HospitalPricing[]> => {
      if (hospitalIds.length === 0) {
        return [];
      }
      // 병원 정보 배열 생성 (id, name만 포함)
      const hospitalInfo = hospitals?.map(h => ({ id: h.id, name: h.name })) || undefined;
      const response = await apiClient.getNonCoveredPricing(hospitalIds, hospitalInfo);
      if (response.ok && Array.isArray(response.data)) {
        return response.data as HospitalPricing[];
      }
      if (response.ok && response.data && Array.isArray((response.data as { data?: unknown }).data)) {
        return (response.data as { data: HospitalPricing[] }).data;
      }
      const code = response.error?.code || 'API_ERROR';
      const msg =
        response.error?.message || '가격 정보를 불러오는데 실패했습니다.';
      throw attachQueryErrorMeta(new Error(msg), {
        code,
        retryable: isRetryableApiCode(code),
      });
    },
    enabled: enabled && hospitalIds.length > 0,
    staleTime: 12 * 60 * 60 * 1000, // 12시간간 fresh 상태 유지 (API 호출 절약)
    gcTime: 24 * 60 * 60 * 1000, // 24시간 후 캐시 삭제 (API 호출 절약)
    placeholderData: keepPreviousData,
    select: (data) =>
      data.map((pricing) => ({
        ...pricing,
        items: Array.isArray(pricing.items) ? pricing.items : [],
      })),
  });
}

