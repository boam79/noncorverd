import type { MedicalInstitutionType } from '@/types';

/**
 * HIRA clCd / clCdNm → UI MedicalInstitutionType
 * (app/api hospitals TYPE_CLCDS 와 맞춤)
 */
export function normalizeHospitalType(
  clCdNm?: string,
  clCd?: string
): MedicalInstitutionType {
  const name = (clCdNm || '').trim();
  const code = (clCd || '').trim();

  if (name.includes('치과') || code === '41' || code === '51') return '치과';
  if (name.includes('요양') || code === '28') return '요양병원';
  if (
    name === '종합병원' ||
    name === '상급종합' ||
    name.includes('상급종합') ||
    code === '01' ||
    code === '11'
  ) {
    return '종합병원';
  }
  if (name === '병원' || name === '정신병원' || code === '21' || code === '29') {
    return '병원';
  }
  // 의 외(의원 등)는 비교 UI 기본값으로 병원 취급
  return '병원';
}
