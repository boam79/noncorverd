import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicData } from '@/lib/opendata/client';
import { opendataRoutePrelude } from '@/lib/opendata/opendataRoutePrelude';
import { toHiraSido, toHiraSigungu } from '@/lib/opendata/codeMap';
import {
  cleanSigunguLabelForAddress,
  getAdminSigunguList,
} from '@/lib/opendata/adminSigunguList';
import { hospitalsQuerySchema } from '@/lib/validation/opendataSchemas';
import { recordOpendataRequest } from '@/lib/observability/opendataMetrics';
import { logRouteError } from '@/lib/observability/safeServerLog';
import { hospitalAddressMatchesSigungu } from '@/lib/utils/addressSigunguMatch';
import {
  parseDgsbjtCdToDepartments,
  splitDgsbjtCdNm,
} from '@/lib/constants/clinicalFocusBuckets';
import type { Hospital } from '@/types';

const HOSPITAL_ENDPOINT = '/B551182/hospInfoServicev2/getHospBasisList';

/** HIRA `sgguCd` 미매핑 시 시도 전체를 페이지 단위로 받을 때 상한(환경변수로 조절) */
function maxPagesForSigunguAddressFallback(): number {
  const raw = Number(process.env.HOSPITALS_SIGUNGU_FALLBACK_MAX_PAGES ?? 200);
  if (!Number.isFinite(raw) || raw < 10) return 10;
  return Math.min(Math.floor(raw), 500);
}

/**
 * 실제 HIRA API clCd 매핑 (API 응답 실측값 기반)
 * 01: 상급종합 / 11: 종합병원 / 21: 병원 / 28: 요양병원
 * 29: 정신병원 / 31: 의원(한의원 포함) / 41: 치과병원 / 51: 치과의원
 */
const TYPE_CLCDS: Record<string, string[]> = {
  '종합병원': ['01', '11'],
  '병원':     ['21'],
  '요양병원': ['28'],
  '치과':     ['41', '51'],
};

const TYPE_EXTRA_PARAMS: Record<string, Record<string, string>> = {
};

// 종별별 후처리 필터
function matchesType(clCdNm: string, name: string, selectedType: string): boolean {
  switch (selectedType) {
    case '종합병원': return clCdNm === '종합병원' || clCdNm === '상급종합';
    case '병원':     return clCdNm === '병원' || clCdNm === '정신병원';
    case '요양병원': return clCdNm === '요양병원';
    case '치과':     return clCdNm.includes('치과');
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
  dgsbjtCd?: string;
  dgsbjtCdNm?: string;
  deptCd?: string;
  [key: string]: string | undefined;
}

function mapHospital(raw: RawHospital): Hospital {
  const dgsbjtRaw = raw.dgsbjtCd ?? raw.deptCd;
  const fromCodes = parseDgsbjtCdToDepartments(dgsbjtRaw);
  const fromNm = splitDgsbjtCdNm(raw.dgsbjtCdNm);
  const departments: string[] = [...fromCodes];
  for (const n of fromNm) {
    if (n && !departments.includes(n)) departments.push(n);
  }
  return {
    id: raw.ykiho ?? '',
    name: raw.yadmNm ?? '',
    address: raw.addr ?? '',
    phone: raw.telno ?? '',
    type: (raw.clCdNm ?? raw.clCd ?? '병원') as Hospital['type'],
    departments,
    dgsbjtCdRaw: dgsbjtRaw,
    sidoCd: raw.sidoCd ?? '',
    sgguCd: raw.sgguCd ?? '',
    clCdNm: raw.clCdNm ?? '',
    ykiho: raw.ykiho ?? '',
  };
}

/**
 * HIRA 병원 목록 페이지 누적 (totalCount까지 또는 maxPages까지)
 */
async function fetchHiraHospitalPages(
  baseParams: Record<string, string | number>,
  maxPages: number
): Promise<{ hospitals: Hospital[]; totalCount: number; truncated: boolean }> {
  const hospitals: Hospital[] = [];
  const seen = new Set<string>();
  let totalCount = 0;

  for (let page = 1; page <= maxPages; page++) {
    const { items, total } = await fetchPublicData(HOSPITAL_ENDPOINT, {
      ...baseParams,
      pageNo: page,
    });
    if (page === 1) totalCount = Number(total) || 0;

    if (items.length === 0) break;

    for (const raw of items as RawHospital[]) {
      const hospital = mapHospital(raw);
      if (hospital.id && !seen.has(hospital.id)) {
        seen.add(hospital.id);
        hospitals.push(hospital);
      }
    }

    if (items.length < 100) break;
    if (totalCount > 0 && page * 100 >= totalCount) break;
  }

  const truncated = totalCount > 0 && hospitals.length < totalCount;
  return { hospitals, totalCount, truncated };
}

async function fetchHospitalsForType(
  baseParams: Record<string, string | number>,
  typeName: string,
  maxPages: number
): Promise<{ hospitals: Hospital[]; truncated: boolean }> {
  const clCds = TYPE_CLCDS[typeName] ?? [];
  const extraParams = TYPE_EXTRA_PARAMS[typeName] ?? {};
  const results: Hospital[] = [];
  const seen = new Set<string>();
  let truncated = false;

  for (const clCd of clCds) {
    const params: Record<string, string | number> = { ...baseParams, ...extraParams, clCd };
    const { hospitals, truncated: t } = await fetchHiraHospitalPages(params, maxPages);
    if (t) truncated = true;
    for (const h of hospitals) {
      if (!seen.has(h.id)) {
        seen.add(h.id);
        results.push(h);
      }
    }
  }

  return {
    hospitals: results.filter(h => matchesType(h.type, h.name, typeName)),
    truncated,
  };
}

export async function GET(request: NextRequest) {
  const blocked = await opendataRoutePrelude(request, 'hospitals');
  if (blocked) return blocked;

  const parsed = hospitalsQuerySchema.safeParse({
    sido: request.nextUrl.searchParams.get('sido') ?? '',
    sigungu: request.nextUrl.searchParams.get('sigungu') ?? '',
    type: request.nextUrl.searchParams.get('type') ?? '',
    hospitalName: request.nextUrl.searchParams.get('hospitalName') ?? '',
  });
  if (!parsed.success) {
    recordOpendataRequest('hospitals', 400);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INVALID_QUERY',
          message: '검색 조건 형식이 올바르지 않습니다.',
        },
      },
      { status: 400 }
    );
  }
  const { sido, sigungu, type, hospitalName } = parsed.data;

  try {
    const baseParams: Record<string, string | number> = {
      _type: 'json',
      numOfRows: 100,
      _cache: 300,
    };

    if (hospitalName) baseParams.yadmNm = hospitalName;

    const adminSidoKey = sido ? String(sido).padStart(2, '0').substring(0, 2) : '';
    const hiraSido = adminSidoKey ? toHiraSido(adminSidoKey) : null;
    if (hiraSido) baseParams.sidoCd = hiraSido;

    /** 세종: 전남(360000)과 분리된 코드(361000) 사용 + 주소에 '세종' 포함 병원만 유지 */
    const useSejongAddressFilter = adminSidoKey === '36';

    const hiraSigungu = sigungu ? toHiraSigungu(sigungu) : null;
    const useAddressSigunguFallback =
      Boolean(sigungu) && !hiraSigungu && Boolean(hiraSido);

    if (sigungu && hiraSigungu) {
      baseParams.sgguCd = hiraSigungu;
    }

    const maxPages = useAddressSigunguFallback
      ? maxPagesForSigunguAddressFallback()
      : 2;

    const typeNames = type ? type.split(',').map(t => t.trim()).filter(Boolean) : [];

    let officialSigunguName = '';
    let cleanSigunguName = '';
    if (useAddressSigunguFallback) {
      const list = await getAdminSigunguList(adminSidoKey);
      const normalizedSigungu = String(sigungu).padEnd(6, '0');
      const row = list.find((r) => r.code === normalizedSigungu);
      officialSigunguName = row?.name ?? '';
      cleanSigunguName = cleanSigunguLabelForAddress(officialSigunguName);
    }

    let filtered: Hospital[];
    let hiraTotalCount = 0;
    let listTruncated = false;

    if (useAddressSigunguFallback && !cleanSigunguName) {
      filtered = [];
    } else if (typeNames.length === 0) {
      const { hospitals, totalCount, truncated } = await fetchHiraHospitalPages(
        baseParams,
        maxPages
      );
      hiraTotalCount = totalCount;
      listTruncated = truncated;
      filtered = useAddressSigunguFallback
        ? hospitals.filter((h) =>
            hospitalAddressMatchesSigungu(h.address, officialSigunguName, cleanSigunguName)
          )
        : hospitals;
    } else {
      const seen = new Set<string>();
      const results: Hospital[] = [];
      for (const typeName of typeNames) {
        const { hospitals, truncated } = await fetchHospitalsForType(
          baseParams,
          typeName,
          maxPages
        );
        if (truncated) listTruncated = true;
        for (const h of hospitals) {
          if (!seen.has(h.id)) {
            seen.add(h.id);
            results.push(h);
          }
        }
      }
      filtered = useAddressSigunguFallback
        ? results.filter((h) =>
            hospitalAddressMatchesSigungu(h.address, officialSigunguName, cleanSigunguName)
          )
        : results;
    }

    if (useSejongAddressFilter) {
      filtered = filtered.filter((h) => (h.address || '').includes('세종'));
    }

    recordOpendataRequest('hospitals', 200);
    return NextResponse.json({
      ok: true,
      data: filtered,
      meta: {
        total: filtered.length,
        fetchedAt: new Date().toISOString(),
        source: '공공데이터포털·건강보험심사평가원 병원 기본정보',
        appliedSigunguAddressFallback: useAddressSigunguFallback,
        listTruncated,
        ...(useAddressSigunguFallback && {
          addressFallbackTruncated: listTruncated,
          ...(typeNames.length === 0 && hiraTotalCount > 0
            ? { hiraSidoTotalCount: hiraTotalCount }
            : {}),
        }),
        ...(!useAddressSigunguFallback &&
          listTruncated &&
          typeNames.length === 0 &&
          hiraTotalCount > 0 && {
            hiraSidoTotalCount: hiraTotalCount,
          }),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '병원 정보 조회 실패';
    logRouteError('opendata/hospitals', err);
    recordOpendataRequest('hospitals', 502);
    return NextResponse.json({ ok: false, error: { code: 'API_ERROR', message } }, { status: 502 });
  }
}
