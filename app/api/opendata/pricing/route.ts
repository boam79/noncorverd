import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicData, validateToken, unauthorizedResponse } from '@/lib/opendata/client';
import { pricingBodySchema } from '@/lib/validation/opendataSchemas';
import { recordOpendataRequest } from '@/lib/observability/opendataMetrics';
import { logRouteError } from '@/lib/observability/safeServerLog';
import { enforceOpendataRateLimit } from '@/lib/opendata/serverRateLimit';

const PRICING_ENDPOINT = '/B551182/nonPaymentDamtInfoService/getNonPaymentItemHospDtlList';

interface PricingItem {
  npayKorNm?: string;
  curAmt?: string;
  maxAmt?: string;
  minAmt?: string;
  npayClsNm?: string;
  yadmNpayCdNm?: string;
  adtFrDd?: string;
  adtEndDd?: string;
  urlAddr?: string;
  [key: string]: string | undefined;
}

function mapPricingItem(raw: PricingItem) {
  return {
    name: raw.npayKorNm ?? raw.yadmNpayCdNm ?? '',
    price: Number(raw.curAmt ?? 0),
    maxPrice: Number(raw.maxAmt ?? 0),
    minPrice: Number(raw.minAmt ?? 0),
    category: raw.npayClsNm ?? '',
    unit: raw.yadmNpayCdNm ?? '',
    validFrom: raw.adtFrDd ?? '',
    validTo: raw.adtEndDd ?? '',
    url: raw.urlAddr ?? '',
  };
}

export async function POST(request: NextRequest) {
  if (!validateToken(request)) return unauthorizedResponse();

  const rateLimited = await enforceOpendataRateLimit(request, 'pricing');
  if (rateLimited) return rateLimited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    recordOpendataRequest('pricing', 400);
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_REQUEST', message: 'JSON 본문이 필요합니다.' } },
      { status: 400 }
    );
  }

  const parsed = pricingBodySchema.safeParse(json);
  if (!parsed.success) {
    recordOpendataRequest('pricing', 400);
    const msg = parsed.error.issues.map((i) => i.message).join('; ');
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_REQUEST', message: msg || '요청 본문이 올바르지 않습니다.' } },
      { status: 400 }
    );
  }

  const { hospitalIds, hospitals = [] } = parsed.data;
  const hospitalMap = new Map(hospitals.map((h) => [h.id, h.name]));

  try {
    const results = await Promise.allSettled(
      hospitalIds.map((id) => fetchHospitalPricing(id, hospitalMap.get(id) ?? ''))
    );

    const data = results.map((r, i) => ({
      hospitalId: hospitalIds[i],
      hospitalName: hospitalMap.get(hospitalIds[i]) ?? '',
      items: r.status === 'fulfilled' ? r.value : [],
      ok: r.status === 'fulfilled',
    }));

    recordOpendataRequest('pricing', 200);
    return NextResponse.json({
      ok: true,
      data,
      meta: {
        fetchedAt: new Date().toISOString(),
        source: '공공데이터포털·건강보험심사평가원 비급여 진료비',
      },
    });
  } catch (err) {
    logRouteError('opendata/pricing', err);
    recordOpendataRequest('pricing', 502);
    const message = err instanceof Error ? err.message : '가격 정보 조회 실패';
    return NextResponse.json(
      { ok: false, error: { code: 'API_ERROR', message } },
      { status: 502 }
    );
  }
}

async function fetchHospitalPricing(ykiho: string, _hospitalName: string) {
  const { items } = await fetchPublicData(PRICING_ENDPOINT, {
    ykiho,
    numOfRows: 100,
    pageNo: 1,
    _cache: 600,
  });
  return (items as PricingItem[]).map(mapPricingItem);
}
