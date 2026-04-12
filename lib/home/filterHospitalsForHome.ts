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
    const sigunguData = sigunguList.find((s) => s.code === sigungu) ?? null;
    const sigunguName = sigunguData?.name || '';
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
