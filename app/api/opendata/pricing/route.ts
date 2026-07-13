import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicData } from '@/lib/opendata/client';
import { opendataRoutePrelude } from '@/lib/opendata/opendataRoutePrelude';
import { pricingBodySchema } from '@/lib/validation/opendataSchemas';
import { recordOpendataRequest } from '@/lib/observability/opendataMetrics';
import { logRouteError } from '@/lib/observability/safeServerLog';
import {
  averagePositivePrice,
  mapPricingItem,
  type RawPricingItem,
} from '@/lib/opendata/mapPricingItem';

const PRICING_ENDPOINT = '/B551182/nonPaymentDamtInfoService/getNonPaymentItemHospDtlList';

/** 병원당 최대 페이지(100건×N). 환경변수로 조절 가능 */
function maxPricingPages(): number {
  const raw = Number(process.env.PRICING_MAX_PAGES ?? 15);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(Math.floor(raw), 50);
}

export async function POST(request: NextRequest) {
  const blocked = await opendataRoutePrelude(request, 'pricing');
  if (blocked) return blocked;

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
      hospitalIds.map((id) => fetchHospitalPricing(id))
    );

    const data = results.map((r, i) => {
      const hospitalId = hospitalIds[i];
      const hospitalName = hospitalMap.get(hospitalId) ?? '';
      if (r.status === 'fulfilled') {
        return {
          hospitalId,
          hospitalName,
          items: r.value.items,
          averagePrice: r.value.averagePrice,
          totalItems: r.value.totalItems,
          ok: true,
        };
      }
      return {
        hospitalId,
        hospitalName,
        items: [],
        averagePrice: 0,
        totalItems: 0,
        ok: false,
      };
    });

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

async function fetchHospitalPricing(ykiho: string) {
  const mapped = [];
  let total = 0;
  const maxPages = maxPricingPages();

  for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
    const { items, total: t } = await fetchPublicData(PRICING_ENDPOINT, {
      ykiho,
      numOfRows: 100,
      pageNo,
      _cache: 600,
    });
    if (pageNo === 1) total = Number(t) || 0;

    const batch = (items as RawPricingItem[]).map(mapPricingItem);
    if (batch.length === 0) break;
    mapped.push(...batch);

    if (total > 0 && mapped.length >= total) break;
    if (batch.length < 100) break;
  }

  return {
    items: mapped,
    averagePrice: averagePositivePrice(mapped),
    totalItems: mapped.length,
  };
}
