import {
  CLINICAL_FOCUS_OPTIONS,
  type ClinicalFocusId,
} from '@/lib/constants/clinicalFocusBuckets';
import type { MedicalInstitutionType } from '@/types';
import { normalizeAdminSigunguCode } from '@/lib/opendata/normalizeAdminCode';

const FOCUS_IDS = new Set<ClinicalFocusId>(
  CLINICAL_FOCUS_OPTIONS.map((o) => o.id)
);

const INSTITUTION_TYPES = new Set<MedicalInstitutionType>([
  '종합병원',
  '병원',
  '요양병원',
  '치과',
]);

export function parseClinicalFocusParam(raw: string | null): ClinicalFocusId {
  if (!raw) return 'none';
  if (!FOCUS_IDS.has(raw as ClinicalFocusId)) return 'none';
  return raw as ClinicalFocusId;
}

export function parseTypesParam(raw: string | null): MedicalInstitutionType[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter((t): t is MedicalInstitutionType =>
      INSTITUTION_TYPES.has(t as MedicalInstitutionType)
    );
}

export type HomeSearchUrlState = {
  sido?: string;
  sigungu?: string;
  /** 확정 검색어(목록 필터에 반영된 값) */
  q?: string;
  focus: ClinicalFocusId;
  types: MedicalInstitutionType[];
};

export function parseHomeSearchParams(searchParams: URLSearchParams): HomeSearchUrlState {
  const sidoRaw = searchParams.get('sido');
  const sigunguRaw = searchParams.get('sigungu');
  const qRaw = searchParams.get('q');
  const sido = sidoRaw && sidoRaw.trim() ? sidoRaw.trim() : undefined;
  const sigungu =
    sido && sigunguRaw && sigunguRaw.trim()
      ? normalizeAdminSigunguCode(sigunguRaw.trim())
      : undefined;
  return {
    sido,
    sigungu,
    q: qRaw && qRaw.trim() ? qRaw.trim() : undefined,
    focus: parseClinicalFocusParam(searchParams.get('focus')),
    types: parseTypesParam(searchParams.get('types')),
  };
}

export function serializeHomeSearchParams(input: {
  sido?: string;
  sigungu?: string;
  hospitalNameCommitted?: string;
  clinicalFocus: ClinicalFocusId;
  types?: MedicalInstitutionType[];
}): string {
  const usp = new URLSearchParams();
  const sido = input.sido?.trim() || undefined;
  if (sido) usp.set('sido', sido);
  const sigungu = sido ? normalizeAdminSigunguCode(input.sigungu) : undefined;
  if (sido && sigungu) usp.set('sigungu', sigungu);
  if (input.hospitalNameCommitted?.trim()) usp.set('q', input.hospitalNameCommitted.trim());
  if (input.clinicalFocus && input.clinicalFocus !== 'none') {
    usp.set('focus', input.clinicalFocus);
  }
  if (input.types && input.types.length > 0) {
    usp.set('types', input.types.join(','));
  }
  return usp.toString();
}
