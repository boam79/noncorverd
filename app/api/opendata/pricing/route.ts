import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicData, validateToken, unauthorizedResponse } from '@/lib/opendata/client';

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

  const body = await request.json();
  const hospitalIds: string[] = body.hospitalIds ?? [];
  const hospitals: { id: string; name: string }[] = body.hospitals ?? [];

  if (!Array.isArray(hospitalIds) || hospitalIds.length === 0) {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_REQUEST', message: 'hospitalIds가 필요합니다.' } }, { status: 400 });
  }

  const hospitalMap = new Map(hospitals.map(h => [h.id, h.name]));

  const results = await Promise.allSettled(
    hospitalIds.map(id => fetchHospitalPricing(id, hospitalMap.get(id) ?? ''))
  );

  const data = results
    .map((r, i) => ({
      hospitalId: hospitalIds[i],
      hospitalName: hospitalMap.get(hospitalIds[i]) ?? '',
      items: r.status === 'fulfilled' ? r.value : [],
      ok: r.status === 'fulfilled',
    }));

  return NextResponse.json({ ok: true, data });
}

async function fetchHospitalPricing(ykiho: string, _hospitalName: string) {
  const { items } = await fetchPublicData(PRICING_ENDPOINT, {
    ykiho,
    numOfRows: 100,
    pageNo: 1,
  });
  return (items as PricingItem[]).map(mapPricingItem);
}
