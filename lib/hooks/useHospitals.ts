import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { ApiResponse, Hospital, MedicalInstitutionType } from '@/types';
import {
  attachQueryErrorMeta,
  isRetryableApiCode,
} from '@/lib/utils/errorHandler';

interface UseHospitalsParams {
  sido?: string;
  sigungu?: string;
  types?: MedicalInstitutionType[];
  hospitalName?: string;
  enabled?: boolean;
}

export interface HospitalsQueryResult {
  hospitals: Hospital[];
  meta?: ApiResponse['meta'];
}

export function useHospitals({
  sido,
  sigungu,
  types,
  hospitalName,
  enabled = true,
}: UseHospitalsParams) {
  const typesKey =
    types && types.length > 0 ? [...types].sort().join(',') : '';
  return useQuery({
    queryKey: ['hospitals', sido, sigungu, typesKey, hospitalName],
    queryFn: async (): Promise<HospitalsQueryResult> => {
      const response = await apiClient.getHospitals({
        sido,
        sigungu,
        type: types && types.length > 0 ? types.join(',') : undefined,
        hospitalName,
      });
      if (response.ok && response.data) {
        return {
          hospitals: response.data as Hospital[],
          meta: response.meta,
        };
      }
      const code = response.error?.code || 'API_ERROR';
      const msg =
        response.error?.message || '병원 정보를 불러오는데 실패했습니다.';
      throw attachQueryErrorMeta(new Error(msg), {
        code,
        retryable: isRetryableApiCode(code),
      });
    },
    enabled: enabled && (!!sido || !!hospitalName),
    staleTime: 1 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
