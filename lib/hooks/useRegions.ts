import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { ApiResponse, Region } from '@/types';

export interface RegionsQueryResult {
  regions: Region[];
  meta?: ApiResponse['meta'];
}

export function useRegions(sido?: string) {
  return useQuery({
    queryKey: ['regions', sido],
    queryFn: async (): Promise<RegionsQueryResult> => {
      const response = await apiClient.getRegions(sido);
      if (response.ok && response.data) {
        const data = response.data;
        if (Array.isArray(data)) {
          return { regions: data as Region[], meta: response.meta };
        }
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          Array.isArray((data as { data: unknown }).data)
        ) {
          return {
            regions: (data as { data: Region[] }).data,
            meta: response.meta,
          };
        }
        throw new Error('지역 정보 형식이 올바르지 않습니다.');
      }
      throw new Error(response.error?.message || '지역 정보를 불러오는데 실패했습니다.');
    },
    enabled: true,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
    retry: 1,
    retryDelay: 3000,
  });
}
