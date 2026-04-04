import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Region } from '@/types';

export function useRegions(sido?: string) {
  return useQuery({
    queryKey: ['regions', sido],
    queryFn: async () => {
      const response = await apiClient.getRegions(sido);
      if (response.ok && response.data) {
        // response.data가 배열인지 확인
        const data = response.data;
        if (Array.isArray(data)) {
          return data as Region[];
        }
        // 백엔드가 { ok: true, data: [...] } 형태로 반환한 경우
        if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
          return (data as { data: Region[] }).data;
        }
        throw new Error('지역 정보 형식이 올바르지 않습니다.');
      }
      throw new Error(response.error?.message || '지역 정보를 불러오는데 실패했습니다.');
    },
    enabled: true,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
    // Vercel 인천 직접 호출 → CDN 캐싱으로 빠름, 재시도 1회
    retry: 1,
    retryDelay: 3000,
  });
}

