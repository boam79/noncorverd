import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Hospital, HospitalPricing } from '@/types';
import {
  attachQueryErrorMeta,
  isRetryableApiCode,
} from '@/lib/utils/errorHandler';

export interface PricingProgressMeta {
  fetchedAt?: string;
}

/**
 * 병원별로 가격 API를 나눠 호출해, 일부가 먼저 도착하면 표에 반영할 수 있습니다.
 * (공공 API 호출 횟수는 병원 수만큼 증가합니다.)
 */
export function usePricingProgressive(hospitals: Hospital[], enabled: boolean) {
  const queries = useQueries({
    queries: hospitals.map((h) => ({
      queryKey: ['pricing', h.id, h.name],
      queryFn: async (): Promise<{
        row: HospitalPricing;
        meta?: PricingProgressMeta;
      }> => {
        const response = await apiClient.getNonCoveredPricing(
          [h.id],
          [{ id: h.id, name: h.name }]
        );
        if (response.ok && Array.isArray(response.data)) {
          const list = response.data as HospitalPricing[];
          const row =
            list[0] ?? {
              hospitalId: h.id,
              hospitalName: h.name,
              items: [],
            };
          const meta = response.meta as PricingProgressMeta | undefined;
          return { row, meta };
        }
        const code = response.error?.code || 'API_ERROR';
        const msg =
          response.error?.message || '가격 정보를 불러오는데 실패했습니다.';
        throw attachQueryErrorMeta(new Error(msg), {
          code,
          retryable: isRetryableApiCode(code),
        });
      },
      enabled: enabled && hospitals.length > 0,
      staleTime: 12 * 60 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    })),
  });

  const data = useMemo((): HospitalPricing[] => {
    return hospitals.map((h, i) => {
      const q = queries[i];
      const row = q?.data?.row;
      if (row) return row;
      return {
        hospitalId: h.id,
        hospitalName: h.name,
        items: [],
      };
    });
  }, [hospitals, queries]);

  const isLoading = queries.some((q) => q.isPending || q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);
  const progress = useMemo(() => {
    const total = queries.length;
    const done = queries.filter((q) => q.isSuccess || q.isError).length;
    return { done, total };
  }, [queries]);

  const fetchedAt = useMemo(() => {
    let latest: string | undefined;
    for (const q of queries) {
      const t = q.data?.meta?.fetchedAt;
      if (t && (!latest || t > latest)) latest = t;
    }
    return latest;
  }, [queries]);

  const error = queries.find((q) => q.error)?.error ?? null;

  const refetch = () => {
    void Promise.all(queries.map((q) => q.refetch()));
  };

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    fetchedAt,
    progress,
  };
}
