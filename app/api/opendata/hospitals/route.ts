import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicData, validateToken, unauthorizedResponse } from '@/lib/opendata/client';
import { toHiraSido, toHiraSigungu } from '@/lib/opendata/codeMap';

const HOSPITAL_ENDPOINT = '/B551182/hospInfoServicev2/getHospBasisList';

// clCdNm 기반 정확한 타입 매칭
function matchesType(clCdNm: string, selectedType: string): boolean {
  switch (selectedType) {
    case '종합병원': return clCdNm === '종합병원' || clCdNm === '상급종합';
    case '병원':     return clCdNm === '병원' || clCdNm === '정신병원';
    case '의원':     return clCdNm === '의원';
    case '요양병원': return clCdNm === '요양병원';
    case '치과':     return clCdNm.includes('치과');
    case '한의원':   return clCdNm.includes('한의') || clCdNm === '한방병원';
    default:         return clCdNm.includes(selectedType);
  }
}

// clCd 필터 사용 가능 여부
// 병원(clCd=11)은 소규모 병원(clCd=21) 누락 문제로 사용 안 함
// 의원은 clCd 없음
// 치과(41)/한의원(51)/종합병원(01)/요양병원(31)은 안전
const SAFE_CLCD: Record<string, string> = {
  '종합병원': '01',
  '요양병원': '31',
  '치과':     '41',
  '한의원':   '51',
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

    const typeNames = type ? type.split(',').map(t => t.trim()).filter(Boolean) : [];

    // 단일 종별이고 SAFE_CLCD에 있으면 API 수준 필터 적용 (치과/한의원/종합병원/요양병원)
    // → HIRA가 크기 순 정렬이라 clCd 없으면 200건 안에 안 들어올 수 있음
    // 병원/의원은 clCd 미사용 → 전체 조회 후 클라이언트 필터링
    if (typeNames.length === 1 && SAFE_CLCD[typeNames[0]]) {
      params.clCd = SAFE_CLCD[typeNames[0]];
    }

    // 최대 2페이지 수집 (API 할당량 절약)
    const allHospitals: ReturnType<typeof mapHospital>[] = [];
    for (let page = 1; page <= 2; page++) {
      params.pageNo = page;
      const { items } = await fetchPublicData(HOSPITAL_ENDPOINT, params);
      if (items.length === 0) break;
      allHospitals.push(...(items as RawHospital[]).map(mapHospital));
      if (items.length < 100) break;
    }

    // clCdNm 기반 정확한 종별 필터링
    const filtered = typeNames.length > 0
      ? allHospitals.filter(h => typeNames.some(t => matchesType(h.type, t)))
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
