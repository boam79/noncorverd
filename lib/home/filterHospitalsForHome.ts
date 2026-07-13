import type { Hospital, Region } from '@/types';
import {
  hospitalMatchesClinicalFocus,
  type ClinicalFocusId,
} from '@/lib/constants/clinicalFocusBuckets';
import { hospitalAddressMatchesSigungu } from '@/lib/utils/addressSigunguMatch';

export function filterHospitalsForHome(options: {
  allHospitals: Hospital[];
  sigunguList: Region[];
  sigungu?: string;
  nameForClientFilter: string;
  clinicalFocus: ClinicalFocusId;
}): Hospital[] {
  const { allHospitals, sigunguList, sigungu, nameForClientFilter, clinicalFocus } = options;
  let filtered = allHospitals;

  if (nameForClientFilter) {
    const searchTerm = nameForClientFilter.toLowerCase();
    filtered = filtered.filter((hospital) => {
      const hospitalNameLower = hospital.name?.toLowerCase() || '';
      return hospitalNameLower.includes(searchTerm);
    });
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
    const cleanSigunguName = sigunguName
      .replace(/.*?특별시\s*/, '')
      .replace(/.*?광역시\s*/, '')
      .replace(/.*?도\s*/, '')
      .trim();

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
