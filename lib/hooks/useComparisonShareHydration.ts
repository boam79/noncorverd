import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';

/** 공유 복원 시 `router.replace`만 사용 */
export type ComparisonShareRouter = {
  replace: (href: string, options?: { scroll?: boolean }) => void;
};
import { decodeSharePayload, SHARE_PARAM } from '@/lib/utils/shareLink';
import { COMPARISON_QUANTITIES_STORAGE_KEY } from '@/components/ComparisonTable/types';
import type { Hospital, HospitalPricing } from '@/types';

/**
 * URL `s` 공유 페이로드 복원: 가격 API로 병원 목록 채운 뒤 스토어 반영·URL 정리.
 */
export function useComparisonShareHydration(
  searchParams: URLSearchParams,
  router: ComparisonShareRouter,
  setSelectedHospitals: (hospitals: Hospital[]) => void
): {
  shareDone: boolean;
  shareError: string | null;
  shareLoading: boolean;
} {
  const [shareDone, setShareDone] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const rawShare = searchParams.get(SHARE_PARAM);
  const decodedPreview = useMemo(
    () => (rawShare ? decodeSharePayload(rawShare) : null),
    [rawShare]
  );

  const shareLoading =
    Boolean(rawShare && decodedPreview) && !shareDone && !shareError;

  useEffect(() => {
    if (rawShare) {
      setShareDone(false);
      setShareError(null);
    }
  }, [rawShare]);

  useEffect(() => {
    if (rawShare && !decodedPreview) {
      setShareError('공유 링크 형식이 올바르지 않습니다.');
      setShareDone(true);
      return;
    }

    if (!rawShare || !decodedPreview) {
      setShareDone(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await apiClient.getNonCoveredPricing(
          decodedPreview.i,
          decodedPreview.i.map((id) => ({ id, name: '' }))
        );

        if (cancelled) return;

        if (!response.ok || !Array.isArray(response.data)) {
          setShareError(
            response.error?.message || '공유된 병원 정보를 불러오지 못했습니다.'
          );
          setShareDone(true);
          return;
        }

        const list = response.data as HospitalPricing[];
        const hospitals: Hospital[] = list.map((p) => ({
          id: p.hospitalId,
          name: p.hospitalName || '이름 미상',
          address: '',
          type: '병원',
          departments: [],
        }));

        setSelectedHospitals(hospitals);

        if (decodedPreview.q && typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(
              COMPARISON_QUANTITIES_STORAGE_KEY,
              JSON.stringify(decodedPreview.q)
            );
          } catch {
            // ignore quota / privacy mode
          }
        }

        router.replace('/comparison', { scroll: false });
        setShareDone(true);
      } catch (e) {
        if (!cancelled) {
          setShareError(
            e instanceof Error ? e.message : '공유 링크 처리 중 오류가 발생했습니다.'
          );
          setShareDone(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawShare, decodedPreview, router, setSelectedHospitals]);

  return { shareDone, shareError, shareLoading };
}
