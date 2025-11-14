import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Hospital, MedicalInstitutionType } from '@/types';

interface UseHospitalsParams {
  sido?: string;
  sigungu?: string;
  types?: MedicalInstitutionType[];
  enabled?: boolean;
}

export function useHospitals({
  sido,
  sigungu,
  types,
  enabled = true,
}: UseHospitalsParams) {
  return useQuery({
    queryKey: ['hospitals', sido, sigungu, types?.sort().join(',')],
    queryFn: async () => {
      const response = await apiClient.getHospitals({
        sido,
        sigungu,
        type: types && types.length > 0 ? types.join(',') : undefined,
      });
      if (response.ok && response.data) {
        return response.data as Hospital[];
      }
      throw new Error(response.error?.message || '병원 정보를 불러오는데 실패했습니다.');
    },
        enabled: enabled && !!sido, // sido가 있을 때만 쿼리 실행
        staleTime: 60 * 60 * 1000, // 1시간간 fresh 상태 유지 (API 호출 절약)
        gcTime: 2 * 60 * 60 * 1000, // 2시간 후 캐시 삭제 (API 호출 절약)
        refetchOnMount: false, // 마운트 시 캐시된 데이터 사용 (API 호출 절약)
        refetchOnWindowFocus: false, // 포커스 시 리패치 안 함 (API 호출 절약)
  });
}

