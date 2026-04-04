import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicData, validateToken, unauthorizedResponse } from '@/lib/opendata/client';
import { FALLBACK_SIDO } from '@/lib/opendata/codeMap';

const REGIONS_ENDPOINT = '/1741000/StanReginCd/getStanReginCdList';

export async function GET(request: NextRequest) {
  if (!validateToken(request)) return unauthorizedResponse();

  const sido = request.nextUrl.searchParams.get('sido');

  try {
    if (!sido) {
      return NextResponse.json({ ok: true, data: await getSidoList(), meta: {} });
    }
    return NextResponse.json({ ok: true, data: await getSigunguList(sido), meta: {} });
  } catch (err) {
    const message = err instanceof Error ? err.message : '지역 정보 조회 실패';
    console.error('[regions] 오류:', message);
    // fallback: 시도 목록은 하드코딩 데이터 반환
    if (!sido) {
      return NextResponse.json({ ok: true, data: FALLBACK_SIDO, meta: {} });
    }
    return NextResponse.json({ ok: false, error: { code: 'API_ERROR', message } }, { status: 502 });
  }
}

async function getSidoList() {
  const { items } = await fetchPublicData(REGIONS_ENDPOINT, {
    type: 'json', numOfRows: 20, pageNo: 1,
    locatadd_nm: '', regSeCd: 'A', // 시도 레벨만
  });

  // API가 시도 레벨 항목을 직접 제공하지 않을 수 있으므로
  // 전체에서 시도 코드만 추출
  if (items.length === 0) return FALLBACK_SIDO;

  const sidoMap = new Map<string, string>();
  for (const row of items as Record<string, string>[]) {
    const sidoCd = String(row.sido_cd ?? '').padStart(2, '0');
    const isSido = row.sgg_cd === '000' && row.umd_cd === '000' && row.ri_cd === '00';
    if (sidoCd && isSido && !sidoMap.has(sidoCd)) {
      sidoMap.set(sidoCd, row.locatadd_nm || row.locallow_nm || '');
    }
  }

  const list = [...sidoMap.entries()]
    .filter(([, name]) => name)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => Number(a.code) - Number(b.code));

  return list.length > 0 ? list : FALLBACK_SIDO;
}

async function getSigunguList(sido: string) {
  const targetSido = String(sido).padStart(2, '0');
  const allRows: Record<string, string>[] = [];
  let pageNo = 1;
  let total = Infinity;

  while (allRows.length < total) {
    const { items, total: t } = await fetchPublicData(REGIONS_ENDPOINT, {
      type: 'json', numOfRows: 1000, pageNo,
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
