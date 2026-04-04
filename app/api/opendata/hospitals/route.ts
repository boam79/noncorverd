import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicData, validateToken, unauthorizedResponse } from '@/lib/opendata/client';
import { toHiraSido, toHiraSigungu } from '@/lib/opendata/codeMap';

const HOSPITAL_ENDPOINT = '/B551182/hospInfoServicev2/getHospBasisList';

const CLINIC_TYPE_MAP: Record<string, string | null> = {
  '종합병원': '01',
  '병원': '11',
  '의원': null,   // clCdNm으로 후처리 필터링
  '요양병원': '31',
  '치과': '41',
  '한의원': '51',
};

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
    departments: [] as string[],   // Hospital 타입 필수 필드
    sidoCd: raw.sidoCd ?? '',
    sgguCd: raw.sgguCd ?? '',
    clCdNm: raw.clCdNm ?? '',
    ykiho: raw.ykiho ?? '',
    zipCode: raw.postNo ?? '',
    lat: raw.YPos ?? '',
    lng: raw.XPos ?? '',
  };
}

export async function GET(request: NextRequest) {
  if (!validateToken(request)) return unauthorizedResponse();

  const sp = request.nextUrl.searchParams;
  const sido = sp.get('sido') ?? '';
  const sigungu = sp.get('sigungu') ?? '';
  const type = sp.get('type') ?? '';
  const hospitalName = sp.get('hospitalName') ?? '';

  try {
    const params: Record<string, string | number> = { _type: 'json', numOfRows: 100, pageNo: 1 };

    if (hospitalName) params.yadmNm = hospitalName;

    if (sido) {
      const hiraSido = toHiraSido(sido);
      if (hiraSido) params.sidoCd = hiraSido;
    }

    if (sigungu) {
      const hiraSigungu = toHiraSigungu(sigungu);
      if (hiraSigungu) params.sgguCd = hiraSigungu;
    }

    // 종별 코드 — 첫 번째 종별만 적용 (HIRA API 단일 clCd 지원)
    const primaryType = type.split(',')[0].trim();
    const clCd = CLINIC_TYPE_MAP[primaryType];
    if (clCd) params.clCd = clCd;

    // 최대 2페이지 수집 (API 할당량 절약)
    const allHospitals: ReturnType<typeof mapHospital>[] = [];
    for (let page = 1; page <= 2; page++) {
      params.pageNo = page;
      const { items } = await fetchPublicData(HOSPITAL_ENDPOINT, params);
      if (items.length === 0) break;
      allHospitals.push(...(items as RawHospital[]).map(mapHospital));
      if (items.length < 100) break;
    }

    // 종별명 후처리 필터 (의원/한의원 등 clCd 없는 케이스)
    const typeNames = type ? type.split(',').map(t => t.trim()) : [];
    const filtered = typeNames.length > 0 && !clCd
      ? allHospitals.filter(h => typeNames.some(t => h.type.includes(t)))
      : allHospitals;

    return NextResponse.json({
      ok: true,
      data: filtered,
      meta: { total: filtered.length },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '병원 정보 조회 실패';
    console.error('[hospitals] 오류:', message);
    return NextResponse.json({ ok: false, error: { code: 'API_ERROR', message } }, { status: 502 });
  }
}
