import { NextRequest, NextResponse } from 'next/server';
import { opendataRoutePrelude } from '@/lib/opendata/opendataRoutePrelude';
import { getAdminSigunguList } from '@/lib/opendata/adminSigunguList';
import { FALLBACK_SIDO } from '@/lib/opendata/codeMap';
import { regionsQuerySchema } from '@/lib/validation/opendataSchemas';
import { recordOpendataRequest } from '@/lib/observability/opendataMetrics';
import { logRouteError } from '@/lib/observability/safeServerLog';

export async function GET(request: NextRequest) {
  const blocked = await opendataRoutePrelude(request, 'regions');
  if (blocked) return blocked;

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
      data: await getAdminSigunguList(sido),
      meta: { ...metaBase },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '지역 정보 조회 실패';
    logRouteError('opendata/regions', err);
    // fallback: 시도 목록은 하드코딩 데이터 반환
    if (!sido) {
      recordOpendataRequest('regions', 200);
      return NextResponse.json({
        ok: true,
        data: FALLBACK_SIDO,
        meta: {
          ...metaBase,
          degraded: true,
          source: 'fallback-sido',
        },
      });
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

