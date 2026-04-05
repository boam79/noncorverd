import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicData, validateToken, unauthorizedResponse } from '@/lib/opendata/client';
import { toHiraSido, toHiraSigungu } from '@/lib/opendata/codeMap';

const HOSPITAL_ENDPOINT = '/B551182/hospInfoServicev2/getHospBasisList';

/**
 * 실제 HIRA API clCd 매핑 (API 응답 실측값 기반)
 * 01: 상급종합 / 11: 종합병원 / 21: 병원 / 28: 요양병원
 * 29: 정신병원 / 31: 의원(한의원 포함) / 41: 치과병원 / 51: 치과의원
 */
const TYPE_CLCDS: Record<string, string[]> = {
  '종합병원': ['01', '11'],
  '병원':     ['21'],
  '요양병원': ['28'],
  '의원':     ['31'],
  '치과':     ['41', '51'],
  '한의원':   ['31'],   // clCd=31 + 이름 필터
};

// 한의원은 clCd=31(의원)에 포함 → 이름에 '한의'/'한방' 포함 여부로 구분
function matchesType(clCdNm: string, name: string, selectedType: string): boolean {
  switch (selectedType) {
    case '종합병원': return clCdNm === '종합병원' || clCdNm === '상급종합';
    case '병원':     return clCdNm === '병원' || clCdNm === '정신병원';
    case '요양병원': return clCdNm === '요양병원';
    case '의원':     return clCdNm === '의원' && !name.includes('한의') && !name.includes('한방');
    case '치과':     return clCdNm.includes('치과');
    case '한의원':   return clCdNm === '의원' && (name.includes('한의') || name.includes('한방'));
    default:         return clCdNm.includes(selectedType);
  }
}

interface RawHospital {
  ykiho?: string;
  yadmNm?: string;
  addr?: string;
  telno?: string;
  clCd?: string;
  clCdNm?: string;
  sidoCd?: string;
  sgguCd?: string;
  postNo?: string;
  XPos?: string;
  YPos?: string;
  [key: string]: string | undefined;
}

function mapHospital(raw: RawHospital) {
  return {
    id: raw.ykiho ?? '',
    name: raw.yadmNm ?? '',
    address: raw.addr ?? '',
    phone: raw.telno ?? '',
    type: raw.clCdNm ?? raw.clCd ?? '병원',
    departments: [] as string[],
    sidoCd: raw.sidoCd ?? '',
    sgguCd: raw.sgguCd ?? '',
    clCdNm: raw.clCdNm ?? '',
    ykiho: raw.ykiho ?? '',
  };
}

async function fetchHospitalsForType(
  baseParams: Record<string, string | number>,
  typeName: string
): Promise<ReturnType<typeof mapHospital>[]> {
  const clCds = TYPE_CLCDS[typeName] ?? [];
  const results: ReturnType<typeof mapHospital>[] = [];
  const seen = new Set<string>();

  for (const clCd of clCds) {
    const params: Record<string, string | number> = { ...baseParams, clCd };

    for (let page = 1; page <= 2; page++) {
      params.pageNo = page;
      const { items } = await fetchPublicData(HOSPITAL_ENDPOINT, params);
      if (items.length === 0) break;
      for (const raw of items as RawHospital[]) {
        const hospital = mapHospital(raw);
        if (hospital.id && !seen.has(hospital.id)) {
          seen.add(hospital.id);
          results.push(hospital);
        }
      }
      if (items.length < 100) break;
    }
  }

  return results.filter(h => matchesType(h.type, h.name, typeName));
}

export async function GET(request: NextRequest) {
  if (!validateToken(request)) return unauthorizedResponse();

  const sp = request.nextUrl.searchParams;
  const sido = sp.get('sido') ?? '';
  const sigungu = sp.get('sigungu') ?? '';
  const type = sp.get('type') ?? '';
  const hospitalName = sp.get('hospitalName') ?? '';

  try {
    const baseParams: Record<string, string | number> = {
      _type: 'json',
      numOfRows: 100,
    };

    if (hospitalName) baseParams.yadmNm = hospitalName;

    if (sido) {
      const hiraSido = toHiraSido(sido);
      if (hiraSido) baseParams.sidoCd = hiraSido;
    }

    if (sigungu) {
      const hiraSigungu = toHiraSigungu(sigungu);
      if (hiraSigungu) baseParams.sgguCd = hiraSigungu;
    }

    const typeNames = type ? type.split(',').map(t => t.trim()).filter(Boolean) : [];

    let filtered: ReturnType<typeof mapHospital>[];

    if (typeNames.length === 0) {
      // 종별 없이 전체 조회 (최대 2페이지)
      const allHospitals: ReturnType<typeof mapHospital>[] = [];
      for (let page = 1; page <= 2; page++) {
        const { items } = await fetchPublicData(HOSPITAL_ENDPOINT, { ...baseParams, pageNo: page });
        if (items.length === 0) break;
        allHospitals.push(...(items as RawHospital[]).map(mapHospital));
        if (items.length < 100) break;
      }
      filtered = allHospitals;
    } else {
      // 종별별로 각각 API 호출 후 합산 (중복 제거)
      const seen = new Set<string>();
      const results: ReturnType<typeof mapHospital>[] = [];
      for (const typeName of typeNames) {
        const hospitals = await fetchHospitalsForType(baseParams, typeName);
        for (const h of hospitals) {
          if (!seen.has(h.id)) {
            seen.add(h.id);
            results.push(h);
          }
        }
      }
      filtered = results;
    }

    return NextResponse.json({ ok: true, data: filtered, meta: { total: filtered.length } });
  } catch (err) {
    const message = err instanceof Error ? err.message : '병원 정보 조회 실패';
    console.error('[hospitals] 오류:', message);
    return NextResponse.json({ ok: false, error: { code: 'API_ERROR', message } }, { status: 502 });
  }
}
