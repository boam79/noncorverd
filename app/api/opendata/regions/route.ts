import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicData, validateToken, unauthorizedResponse } from '@/lib/opendata/client';
import { FALLBACK_SIDO } from '@/lib/opendata/codeMap';
import { regionsQuerySchema } from '@/lib/validation/opendataSchemas';
import { recordOpendataRequest } from '@/lib/observability/opendataMetrics';
import { logRouteError } from '@/lib/observability/safeServerLog';
import { enforceOpendataRateLimit } from '@/lib/opendata/serverRateLimit';

const REGIONS_ENDPOINT = '/1741000/StanReginCd/getStanReginCdList';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) return unauthorizedResponse();

  const rateLimited = await enforceOpendataRateLimit(request, 'regions');
  if (rateLimited) return rateLimited;

  const rawSido = request.nextUrl.searchParams.get('sido');
  const parsed = regionsQuerySchema.safeParse({
    sido: rawSido === null || rawSido === '' ? undefined : rawSido,
  });
  if (!parsed.success) {
    recordOpendataRequest('regions', 400);
    return NextResponse.json(
      {
        ok: false,
        error: { code: 'INVALID_QUERY', message: '지역 코드 형식이 올바르지 않습니다.' },
      },
      { status: 400 }
    );
  }
  const sido = parsed.data.sido;

  const metaBase = {
    fetchedAt: new Date().toISOString(),
    source: '행정안전부 법정동코드·내부 시도 목록',
  };

  try {
    if (!sido) {
      recordOpendataRequest('regions', 200);
      return NextResponse.json({
        ok: true,
        data: await getSidoList(),
        meta: { ...metaBase },
      });
    }
    recordOpendataRequest('regions', 200);
    return NextResponse.json({
      ok: true,
      data: await getSigunguList(sido),
      meta: { ...metaBase },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '지역 정보 조회 실패';
    logRouteError('opendata/regions', err);
    // fallback: 시도 목록은 하드코딩 데이터 반환
    if (!sido) {
      recordOpendataRequest('regions', 200);
      return NextResponse.json({ ok: true, data: FALLBACK_SIDO, meta: { ...metaBase } });
    }
    recordOpendataRequest('regions', 502);
    return NextResponse.json({ ok: false, error: { code: 'API_ERROR', message } }, { status: 502 });
  }
}

async function getSidoList() {
  // 시도 목록은 거의 변경되지 않으므로 정적 데이터 반환
  // (행정안전부 API의 시도 레벨 단독 조회는 지원하지 않음)
  return FALLBACK_SIDO;
}

async function getSigunguList(sido: string) {
  const targetSido = String(sido).padStart(2, '0');
  const allRows: Record<string, string>[] = [];
  let pageNo = 1;
  let total = Infinity;

  while (allRows.length < total) {
    const { items, total: t } = await fetchPublicData(REGIONS_ENDPOINT, {
      type: 'json', numOfRows: 1000, pageNo,
      _cache: 86400, // Vercel CDN 24시간 캐싱
    });
    const rows = items as Record<string, string>[];
    allRows.push(...rows);
    total = t;
    if (rows.length < 1000) break;
    pageNo++;
  }

  const sigunguMap = new Map<string, { code: string; name: string }>();
  for (const row of allRows) {
    const sidoCd = String(row.sido_cd ?? '').padStart(2, '0');
    if (sidoCd !== targetSido) continue;
    const isSigungu = row.sgg_cd !== '000' && row.umd_cd === '000' && row.ri_cd === '00';
    if (!isSigungu) continue;
    const code = `${sidoCd}${String(row.sgg_cd).padStart(3, '0')}`.padEnd(6, '0');
    if (!sigunguMap.has(code)) {
      sigunguMap.set(code, { code, name: row.locatadd_nm || row.locallow_nm || '' });
    }
  }

  return [...sigunguMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}
