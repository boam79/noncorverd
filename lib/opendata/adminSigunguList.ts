/**
 * 행정안전부 법정동코드 API — 시군구 목록 (regions 라우트와 동일 소스)
 */

import { fetchPublicData } from '@/lib/opendata/client';

const REGIONS_ENDPOINT = '/1741000/StanReginCd/getStanReginCdList';

export interface AdminSigunguRow {
  code: string;
  name: string;
}

/** 행정안전부 시도(2자리) 하위 시군구 목록 */
export async function getAdminSigunguList(sido: string): Promise<AdminSigunguRow[]> {
  const targetSido = String(sido).padStart(2, '0');
  const allRows: Record<string, string>[] = [];
  let pageNo = 1;
  let total = Infinity;

  while (allRows.length < total) {
    const { items, total: t } = await fetchPublicData(REGIONS_ENDPOINT, {
      type: 'json',
      numOfRows: 1000,
      pageNo,
      _cache: 86400,
    });
    const rows = items as Record<string, string>[];
    allRows.push(...rows);
    total = t;
    if (rows.length < 1000) break;
    pageNo++;
  }

  const sigunguMap = new Map<string, AdminSigunguRow>();
  for (const row of allRows) {
    const sidoCd = String(row.sido_cd ?? '').padStart(2, '0');
    if (sidoCd !== targetSido) continue;
    const isSigungu = row.sgg_cd !== '000' && row.umd_cd === '000' && row.ri_cd === '00';
    if (!isSigungu) continue;
    const code = `${sidoCd}${String(row.sgg_cd).padStart(3, '0')}`.padEnd(6, '0');
    if (!sigunguMap.has(code)) {
      sigunguMap.set(code, {
        code,
        name: row.locatadd_nm || row.locallow_nm || '',
      });
    }
  }

  return [...sigunguMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export function cleanSigunguLabelForAddress(officialName: string): string {
  return officialName
    .replace(/.*?특별시\s*/, '')
    .replace(/.*?광역시\s*/, '')
    .replace(/.*?특별자치시\s*/, '')
    .replace(/.*?도\s*/, '')
    .trim();
}
