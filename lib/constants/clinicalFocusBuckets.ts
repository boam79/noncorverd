/**
 * 관심 분야(기관 성격) 필터 — 행정 진료과 코드 선택이 아니라
 * 병원명·종별·(가능 시) 진료과목 코드를 조합한 추정 규칙 v0.
 *
 * Executor 메모 (Planner dept-bucket-2): HIRA `getHospBasisList` 응답에
 * `dgsbjtCd` / `deptCd` 등이 올 수 있어 Vercel 프록시 `mapHospital`에서 파싱 시도.
 * 코드→한글 매핑은 심평원 진료과목 코드 일부만 반영(미매핑 코드는 무시).
 */

import type { Hospital } from '@/types';

/** 심평원 병원정보 진료과목 코드 일부 (표준 2자리) */
export const HIRA_DEPT_CODE_LABEL: Record<string, string> = {
  '01': '내과',
  '02': '신경과',
  '03': '정형외과',
  '04': '외과',
  '05': '산부인과',
  '06': '소아청소년과',
  '07': '안과',
  '08': '이비인후과',
  '09': '피부과',
  '10': '비뇨의학과',
  '11': '영상의학과',
  '12': '방사선종양학과',
  '13': '병리과',
  '14': '진단검사의학과',
  '15': '결핵과',
  '16': '재활의학과',
  '17': '핵의학과',
  '18': '가정의학과',
  '19': '응급의학과',
  '20': '직업환경의학과',
  '21': '예방의학과',
  '22': '한의과',
  '50': '구강악안면외과',
  '51': '치과보철과',
  '52': '치과교정과',
  '53': '소아치과',
  '54': '치주과',
  '55': '치과보존과',
  '56': '구강내과',
  '57': '영상치의학과',
  '58': '구강병리과',
  '59': '예방치과',
  '60': '통합치의학과',
};

export type ClinicalFocusId =
  | 'none'
  | 'ophthal_clinic'
  | 'ophthal_hospital'
  | 'orthopedics'
  | 'obstetrics'
  | 'pediatrics'
  | 'spine_joint'
  | 'plastic_surgery';

export interface ClinicalFocusOption {
  id: ClinicalFocusId;
  label: string;
  description: string;
}

export const CLINICAL_FOCUS_OPTIONS: ClinicalFocusOption[] = [
  {
    id: 'none',
    label: '선택 안 함',
    description: '관심 분야 필터를 쓰지 않습니다.',
  },
  {
    id: 'ophthal_clinic',
    label: '안과의원',
    description: '이름에 안과가 있고 의원급(종별)인 경우',
  },
  {
    id: 'ophthal_hospital',
    label: '안과·눈 전문 병원급',
    description: '이름에 안과가 있고 의원이 아닌 병원·종합 등',
  },
  {
    id: 'orthopedics',
    label: '정형외과',
    description: '이름 또는 등록 진료과에 정형외과',
  },
  {
    id: 'obstetrics',
    label: '산부인과',
    description: '이름에 산부인과 또는 진료과목 코드 05',
  },
  {
    id: 'pediatrics',
    label: '소아과',
    description: '이름에 소아과·소아청소년과 등 또는 코드 06(소아치과 제외)',
  },
  {
    id: 'spine_joint',
    label: '척추·관절',
    description: '이름에 척추·관절·척추관절 등 키워드',
  },
  {
    id: 'plastic_surgery',
    label: '성형외과',
    description: '이름에 성형외과·성형 키워드',
  },
];

function normName(h: Pick<Hospital, 'name'>): string {
  return (h.name || '').replace(/\s+/g, '');
}

function deptTokensFromHospital(h: Hospital): string[] {
  const raw = h.dgsbjtCdRaw;
  if (!raw) return [];
  return String(raw)
    .split(/[,;\s|]+/u)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function parseDgsbjtCdToDepartments(dgsbjtCd?: string): string[] {
  if (!dgsbjtCd) return [];
  const labels: string[] = [];
  for (const tok of String(dgsbjtCd).split(/[,;\s|]+/u)) {
    const t = tok.trim();
    if (!t) continue;
    const key = t.length === 1 ? `0${t}` : t.slice(0, 2).padStart(2, '0');
    const lab = HIRA_DEPT_CODE_LABEL[key];
    if (lab && !labels.includes(lab)) labels.push(lab);
  }
  return labels;
}

function nameHas(h: Hospital, sub: string): boolean {
  return normName(h).includes(sub.replace(/\s+/g, ''));
}

function isClinicLevel(h: Hospital): boolean {
  const cl = h.clCdNm || String(h.type || '');
  return cl === '의원' || cl.includes('치과의원');
}

function isHospitalLevel(h: Hospital): boolean {
  const cl = h.clCdNm || String(h.type || '');
  if (cl === '의원' || cl.includes('의원')) return false;
  return (
    cl.includes('병원') ||
    cl.includes('종합') ||
    cl.includes('상급') ||
    cl.includes('치과') ||
    cl.includes('요양')
  );
}

function deptLabels(h: Hospital): string[] {
  const fromField = h.departments ?? [];
  const fromCodes = deptTokensFromHospital(h).map((code) => {
    const key = code.length === 1 ? `0${code}` : code.slice(0, 2).padStart(2, '0');
    return HIRA_DEPT_CODE_LABEL[key];
  });
  return [...fromField, ...fromCodes.filter(Boolean)] as string[];
}

export function hospitalMatchesClinicalFocus(
  h: Hospital,
  focus: ClinicalFocusId
): boolean {
  if (focus === 'none') return true;

  const name = normName(h);
  const depts = deptLabels(h);

  const hasOrthoInName =
    name.includes('정형외과') || name.includes('정형');
  const hasOrthoInDept = depts.some(
    (d) => d.includes('정형') || d.includes('정형외과')
  );
  const hasOrthoCode = deptTokensFromHospital(h).some((c) => {
    const k = c.length === 1 ? `0${c}` : c.slice(0, 2).padStart(2, '0');
    return k === '03';
  });

  const hasEyeInName = name.includes('안과');
  const hasEyeInDept = depts.some((d) => d.includes('안과'));
  const hasEyeCode = deptTokensFromHospital(h).some((c) => {
    const k = c.length === 1 ? `0${c}` : c.slice(0, 2).padStart(2, '0');
    return k === '07';
  });
  const hasEye = hasEyeInName || hasEyeInDept || hasEyeCode;

  const hasObInName =
    name.includes('산부인과') || name.includes('산부인과의원');
  const hasObInDept = depts.some((d) => d.includes('산부인'));
  const hasObCode = deptTokensFromHospital(h).some((c) => {
    const k = c.length === 1 ? `0${c}` : c.slice(0, 2).padStart(2, '0');
    return k === '05';
  });

  const hasPedInName =
    name.includes('소아과') ||
    name.includes('소아청소년') ||
    (name.includes('소아') && !name.includes('소아치과'));
  const hasPedInDept = depts.some(
    (d) => d.includes('소아청소년') || d === '소아과' || d.includes('소아과')
  );
  const hasPedCode = deptTokensFromHospital(h).some((c) => {
    const k = c.length === 1 ? `0${c}` : c.slice(0, 2).padStart(2, '0');
    return k === '06';
  });

  const notHanui = !name.includes('한의원') && !(h.clCdNm || '').includes('한의');

  switch (focus) {
    case 'ophthal_clinic':
      return (
        hasEye &&
        isClinicLevel(h) &&
        notHanui &&
        !name.includes('치과')
      );
    case 'ophthal_hospital':
      return hasEye && isHospitalLevel(h) && notHanui;
    case 'orthopedics':
      return hasOrthoInName || hasOrthoInDept || hasOrthoCode;
    case 'obstetrics':
      return hasObInName || hasObInDept || hasObCode;
    case 'pediatrics':
      return (
        (hasPedInName || hasPedInDept || hasPedCode) &&
        !name.includes('소아치과')
      );
    case 'spine_joint':
      return (
        name.includes('척추') ||
        name.includes('척추관절') ||
        name.includes('관절병원') ||
        name.includes('척추병원') ||
        (name.includes('관절') && name.includes('척추'))
      );
    case 'plastic_surgery':
      return name.includes('성형외과') || name.includes('성형');
    default:
      return true;
  }
}
