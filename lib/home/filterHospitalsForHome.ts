import type { Hospital, Region } from '@/types';
import {
  hospitalMatchesClinicalFocus,
  type ClinicalFocusId,
} from '@/lib/constants/clinicalFocusBuckets';
import { hospitalAddressMatchesSigungu } from '@/lib/utils/addressSigunguMatch';
import { cleanSigunguLabelForAddress } from '@/lib/opendata/adminSigunguList';

export function filterHospitalsForHome(options: {
  allHospitals: Hospital[];
  sigunguList: Region[];
  sigungu?: string;
  /** 행정 시도 코드 — 세종(36)일 때 주소 가드 */
  sido?: string;
  nameForClientFilter: string;
  clinicalFocus: ClinicalFocusId;
}): Hospital[] {
  const {
    allHospitals,
    sigunguList,
    sigungu,
    sido,
    nameForClientFilter,
    clinicalFocus,
  } = options;
  let filtered = allHospitals;

  if (nameForClientFilter) {
    const searchTerm = nameForClientFilter.toLowerCase();
    filtered = filtered.filter((hospital) => {
      const hospitalNameLower = hospital.name?.toLowerCase() || '';
      return hospitalNameLower.includes(searchTerm);
    });
  }

  const adminSido = sido ? String(sido).padStart(2, '0').substring(0, 2) : '';
  if (adminSido === '36') {
    filtered = filtered.filter((h) => (h.address || '').includes('세종'));
  }

  if (sigungu && filtered.length > 0) {
    // 시군구 목록이 아직 없으면(로딩 중) 주소 필터를 건너뛰어 잘못된 전체 목록 깜빡임을
    // 훅 쪽에서 로딩으로 처리하도록 함. 목록이 있는데 코드가 없으면 결과 없음.
    if (sigunguList.length === 0) {
      return filtered;
    }
    const sigunguData = sigunguList.find((s) => s.code === sigungu) ?? null;
    if (!sigunguData) {
      return [];
    }
    const sigunguName = sigunguData.name || '';
    const cleanSigunguName = cleanSigunguLabelForAddress(sigunguName);

    if (cleanSigunguName) {
      filtered = filtered.filter((hospital) =>
        hospitalAddressMatchesSigungu(hospital.address, sigunguName, cleanSigunguName)
      );
    }
  }

  if (clinicalFocus !== 'none') {
    filtered = filtered.filter((h) => hospitalMatchesClinicalFocus(h, clinicalFocus));
  }

  return filtered;
}
