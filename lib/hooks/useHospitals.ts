import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Hospital, MedicalInstitutionType } from '@/types';
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

export function useHospitals({
  sido,
  sigungu,
  types,
  hospitalName,
  enabled = true,
}: UseHospitalsParams) {
  return useQuery({
    queryKey: ['hospitals', sido, sigungu, types?.sort().join(','), hospitalName],
    queryFn: async () => {
      const response = await apiClient.getHospitals({
        sido,
        sigungu,
        type: types && types.length > 0 ? types.join(',') : undefined,
        hospitalName,
      });
      if (response.ok && response.data) {
        return response.data as Hospital[];
      }
      const code = response.error?.code || 'API_ERROR';
      const msg =
        response.error?.message || '병원 정보를 불러오는데 실패했습니다.';
      throw attachQueryErrorMeta(new Error(msg), {
        code,
        retryable: isRetryableApiCode(code),
      });
    },
    enabled: enabled && (!!sido || !!hospitalName), // sido 또는 병원명이 있을 때 쿼리 실행
    staleTime: 1 * 60 * 1000, // 1분간 fresh 상태 유지 (검색 결과 빠른 반영)
    gcTime: 10 * 60 * 1000, // 10분 후 캐시 삭제 (검색 결과 빠른 반영)
    refetchOnMount: true, // 마운트 시 최신 데이터 사용 (검색 결과 빠른 반영)
    refetchOnWindowFocus: false, // 포커스 시 리패치 안 함 (API 호출 절약)
    refetchOnReconnect: true, // 네트워크 재연결 시 리패치 (검색 결과 빠른 반영)
  });
}

