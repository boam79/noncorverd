import {
  CLINICAL_FOCUS_OPTIONS,
  type ClinicalFocusId,
} from '@/lib/constants/clinicalFocusBuckets';

const FOCUS_IDS = new Set<ClinicalFocusId>(
  CLINICAL_FOCUS_OPTIONS.map((o) => o.id)
);

export function parseClinicalFocusParam(raw: string | null): ClinicalFocusId {
  if (!raw) return 'none';
  if (!FOCUS_IDS.has(raw as ClinicalFocusId)) return 'none';
  return raw as ClinicalFocusId;
}

export type HomeSearchUrlState = {
  sido?: string;
  sigungu?: string;
  /** 확정 검색어(목록 필터에 반영된 값) */
  q?: string;
  focus: ClinicalFocusId;
};

export function parseHomeSearchParams(searchParams: URLSearchParams): HomeSearchUrlState {
  const sidoRaw = searchParams.get('sido');
  const sigunguRaw = searchParams.get('sigungu');
  const qRaw = searchParams.get('q');
  const sido = sidoRaw && sidoRaw.trim() ? sidoRaw.trim() : undefined;
  // 시도 없이 시군구만 있으면 무의미한 상태 → 시군구 무시
  const sigungu =
    sido && sigunguRaw && sigunguRaw.trim() ? sigunguRaw.trim() : undefined;
  return {
    sido,
    sigungu,
    q: qRaw && qRaw.trim() ? qRaw.trim() : undefined,
    focus: parseClinicalFocusParam(searchParams.get('focus')),
  };
}

export function serializeHomeSearchParams(input: {
  sido?: string;
  sigungu?: string;
  hospitalNameCommitted?: string;
  clinicalFocus: ClinicalFocusId;
}): string {
  const usp = new URLSearchParams();
  const sido = input.sido?.trim() || undefined;
  if (sido) usp.set('sido', sido);
  // 시군구는 시도가 있을 때만 직렬화
  if (sido && input.sigungu?.trim()) usp.set('sigungu', input.sigungu.trim());
  if (input.hospitalNameCommitted?.trim()) usp.set('q', input.hospitalNameCommitted.trim());
  if (input.clinicalFocus && input.clinicalFocus !== 'none') {
    usp.set('focus', input.clinicalFocus);
  }
  return usp.toString();
}
