import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicData, validateToken, unauthorizedResponse } from '@/lib/opendata/client';
import { toHiraSido, toHiraSigungu } from '@/lib/opendata/codeMap';

const HOSPITAL_ENDPOINT = '/B551182/hospInfoServicev2/getHospBasisList';

// clCdNm 기반 정확한 타입 매칭 함수
// HIRA API의 clCdNm 실제 반환값: 종합병원, 상급종합, 병원, 요양병원, 정신병원, 의원, 치과의원, 한의원, 한방병원
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

    // clCd API 파라미터 사용하지 않음
    // 이유: HIRA API의 clCd 체계가 실제 clCdNm과 불일치 (clCd=11이 소규모 병원 제외)
    // 전체 조회 후 clCdNm 기반 서버사이드 필터링으로 정확도 확보

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
