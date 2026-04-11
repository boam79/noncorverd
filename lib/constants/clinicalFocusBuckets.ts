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
  | 'plastic_surgery'
  | 'internal_medicine'
  | 'neurology'
  | 'ent'
  | 'dermatology'
  | 'urology'
  | 'dentistry';

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
    description:
      '이름에 산부인·여성병원·산부전문·분만·산전·산후·임신·출산·부인과 등, 진료과명, 또는 코드 05',
  },
  {
    id: 'pediatrics',
    label: '소아과',
    description:
      '이름에 소아과·소아청소년·아동(아동치과 제외) 등 또는 코드 06(소아치과 제외)',
  },
  {
    id: 'spine_joint',
    label: '척추·관절',
    description:
      '정형외과(이름·진료과·코드 03), 진료과명에 척추·디스크 등, 또는 마디·허리·관절염·좋은아침·굿모닝 등 흔한 척추·관절 표기(이름 기준 추정)',
  },
  {
    id: 'plastic_surgery',
    label: '성형외과',
    description:
      '이름에 성형외과·성형·성형미용·미용외과 등, 또는 미용+성형 조합',
  },
  {
    id: 'internal_medicine',
    label: '내과',
    description: '이름·진료과에 내과(가정의학과 제외), 또는 코드 01',
  },
  {
    id: 'neurology',
    label: '신경과',
    description: '이름·진료과에 신경과, 또는 코드 02',
  },
  {
    id: 'ent',
    label: '이비인후과',
    description:
      '이름·진료과에 이비인후과·이목후(구칭) 등, 영문 ENT, 또는 코드 08',
  },
  {
    id: 'dermatology',
    label: '피부과',
    description: '이름·진료과에 피부과·피부 클리닉 등, 또는 코드 09',
  },
  {
    id: 'urology',
    label: '비뇨의학과',
    description: '이름·진료과에 비뇨의학·비뇨기 등, 또는 코드 10',
  },
  {
    id: 'dentistry',
    label: '치과',
    description: '종별·이름에 치과, 또는 치과 진료과 코드(50~60대)',
  },
];

function normName(h: Pick<Hospital, 'name'>): string {
  return (h.name || '').replace(/\s+/g, '');
}

/**
 * HIRA `dgsbjtCd` / `deptCd` 원문을 2자리 진료과 코드 배열로 분해합니다.
 * - 구분자(, ; | 공백 등)로 나뉜 조각마다 처리
 * - 조각이 숫자만이고 길이가 짝수면 2글자씩 묶음(예: "010305" → 01, 03, 05). 기존에는
 *   첫 2글자만 보아 산부인과(05) 등이 누락되는 경우가 있었습니다.
 * - 한 자리 숫자는 0패딩(예: "5" → "05")
 */
export function parseAllDeptCodesFromRaw(raw?: string): string[] {
  if (!raw) return [];
  const out: string[] = [];
  const pushKey = (two: string) => {
    const k =
      two.length === 1 ? `0${two}` : two.slice(0, 2).padStart(2, '0');
    if (!out.includes(k)) out.push(k);
  };

  for (const seg of String(raw).split(/[,;\s|]+/u)) {
    const t = seg.trim();
    if (!t) continue;
    if (/^\d+$/.test(t)) {
      if (t.length === 1) {
        pushKey(t);
      } else {
        const evenLen = t.length - (t.length % 2);
        for (let i = 0; i < evenLen; i += 2) {
          pushKey(t.slice(i, i + 2));
        }
      }
    }
  }
  return out;
}

/** HIRA 응답 `dgsbjtCdNm`(한글 진료과명) 분리 — 쉼표·슬래시 등 */
export function splitDgsbjtCdNm(nm?: string): string[] {
  if (!nm) return [];
  return String(nm)
    .split(/[,;/|、]+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseDgsbjtCdToDepartments(dgsbjtCd?: string): string[] {
  if (!dgsbjtCd) return [];
  const labels: string[] = [];
  for (const key of parseAllDeptCodesFromRaw(dgsbjtCd)) {
    const lab = HIRA_DEPT_CODE_LABEL[key];
    if (lab && !labels.includes(lab)) labels.push(lab);
  }
  return labels;
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
  const fromCodes = parseAllDeptCodesFromRaw(h.dgsbjtCdRaw).map(
    (key) => HIRA_DEPT_CODE_LABEL[key]
  );
  const merged = [...fromField, ...fromCodes.filter(Boolean)] as string[];
  return [...new Set(merged)];
}

/** 이름에 정형·척추 키워드가 없어도 척추·관절 전문으로 쓰는 상호(공공데이터 과목 누락 대비) */
function spineJointNameMarketingHint(norm: string): boolean {
  const hints = [
    '마디',
    '관절염',
    '허리',
    '척추전문',
    '척추센터',
    '척추클리닉',
    '좋은아침',
    '굿모닝',
    'spine',
  ];
  return hints.some((k) => norm.includes(k));
}

/** 진료과명 문자열에 척추·관절 질환/부위가 들어가는 경우(과목 코드만 비어 있는 병원) */
function spineJointDeptTextHint(depts: string[]): boolean {
  return depts.some((d) => {
    const t = d.replace(/\s+/g, '');
    return (
      t.includes('척추') ||
      t.includes('디스크') ||
      t.includes('요통') ||
      t.includes('협착') ||
      t.includes('척추관절') ||
      t.includes('관절염') ||
      t.includes('경추') ||
      t.includes('요추') ||
      t.includes('수핵') ||
      (t.includes('관절') && t.includes('척추'))
    );
  });
}

export function hospitalMatchesClinicalFocus(
  h: Hospital,
  focus: ClinicalFocusId
): boolean {
  if (focus === 'none') return true;

  const name = normName(h);
  const depts = deptLabels(h);
  const deptCodes = parseAllDeptCodesFromRaw(h.dgsbjtCdRaw);

  const hasOrthoInName =
    name.includes('정형외과') || name.includes('정형');
  const hasOrthoInDept = depts.some(
    (d) => d.includes('정형') || d.includes('정형외과')
  );
  const hasOrthoCode = deptCodes.includes('03');

  /** 안과 외에도 「○○눈의원」 등 표기 대응(눈성형·눈썹·안경 등은 제외) */
  const hasEyeInName =
    name.includes('안과') ||
    (name.includes('눈') &&
      !name.includes('성형') &&
      !name.includes('눈썹') &&
      !name.includes('안경'));
  const hasEyeInDept = depts.some(
    (d) =>
      d.includes('안과') ||
      d.includes('이목후') ||
      (d.includes('눈') && !d.includes('성형'))
  );
  const hasEyeCode = deptCodes.includes('07');
  const hasEye = hasEyeInName || hasEyeInDept || hasEyeCode;

  const hasObInName =
    name.includes('산부인') ||
    name.includes('여성병원') ||
    name.includes('산부전문') ||
    name.includes('분만') ||
    name.includes('산전') ||
    name.includes('산후') ||
    name.includes('임신') ||
    name.includes('출산') ||
    name.includes('부인과');
  const hasObInDept = depts.some(
    (d) =>
      d.includes('산부인') ||
      d.includes('부인과') ||
      d.includes('산후')
  );
  const hasObCode = deptCodes.includes('05');

  const hasPedInName =
    name.includes('소아과') ||
    name.includes('소아청소년') ||
    (name.includes('소아') && !name.includes('소아치과')) ||
    (name.includes('아동') && !name.includes('아동치과'));
  const hasPedInDept = depts.some(
    (d) =>
      d.includes('소아청소년') ||
      d === '소아과' ||
      d.includes('소아과') ||
      d.includes('아동')
  );
  const hasPedCode = deptCodes.includes('06');

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
      // 정형외과·코드 03: 상지·하지·척추를 아우르는 과이므로 척추·관절 검색에 포함
      // (이전에는 이름에 척추·요통 등이 있을 때만 정형외과를 인정해 결과 0건이 잦았음)
      if (hasOrthoInName || hasOrthoInDept || hasOrthoCode) return true;
      if (spineJointDeptTextHint(depts)) return true;
      if (spineJointNameMarketingHint(name)) return true;
      return (
        name.includes('척추') ||
        name.includes('척추관절') ||
        name.includes('관절병원') ||
        name.includes('척추병원') ||
        (name.includes('관절') && name.includes('척추')) ||
        name.includes('디스크') ||
        name.includes('요통') ||
        name.includes('협착') ||
        name.includes('척추내시경') ||
        name.includes('척추신경') ||
        name.includes('요추') ||
        name.includes('경추')
      );
    case 'plastic_surgery':
      return (
        name.includes('성형외과') ||
        name.includes('성형미용') ||
        name.includes('미용외과') ||
        (name.includes('미용') && name.includes('성형')) ||
        name.includes('성형')
      );
    case 'internal_medicine': {
      const deptOk = depts.some(
        (d) =>
          (d.includes('내과') && !d.includes('가정의학과')) || d === '내과'
      );
      const nameOk =
        (name.includes('내과') && !name.includes('가정의학과')) ||
        name.includes('내과의원') ||
        name.includes('내과병원');
      return deptCodes.includes('01') || deptOk || nameOk;
    }
    case 'neurology':
      return (
        name.includes('신경과') ||
        name.includes('신경외과') ||
        depts.some(
          (d) =>
            d.includes('신경과') ||
            d.includes('신경외과') ||
            (d.includes('신경') &&
              !d.includes('정신') &&
              !d.includes('한방'))
        ) ||
        deptCodes.includes('02')
      );
    case 'ent':
      return (
        name.includes('이비인후과') ||
        name.includes('이비인후') ||
        name.includes('이목후') ||
        /ent/i.test(h.name ?? '') ||
        depts.some((d) => d.includes('이비인후') || d.includes('이목후')) ||
        deptCodes.includes('08')
      );
    case 'dermatology':
      return (
        (name.includes('피부') && !name.includes('치과')) ||
        depts.some((d) => d.includes('피부')) ||
        deptCodes.includes('09')
      );
    case 'urology':
      return (
        name.includes('비뇨의학과') ||
        name.includes('비뇨기과') ||
        name.includes('비뇨기') ||
        name.includes('전립선') ||
        name.includes('요로결석') ||
        depts.some((d) => d.includes('비뇨')) ||
        deptCodes.includes('10')
      );
    case 'dentistry': {
      const dentalCodes = [
        '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
      ];
      const cl = h.clCdNm || String(h.type || '');
      return (
        cl.includes('치과') ||
        name.includes('치과') ||
        dentalCodes.some((c) => deptCodes.includes(c))
      );
    }
    default:
      return true;
  }
}
