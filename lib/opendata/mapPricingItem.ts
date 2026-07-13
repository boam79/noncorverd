/**
 * HIRA 비급여 상세 항목 → 프론트엔드 NonCoveredItem 형태
 * (UI·신뢰도 점수는 startDate/endDate 를 사용합니다)
 */

export interface RawPricingItem {
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

export interface MappedPricingItem {
  name: string;
  price: number;
  maxPrice: number;
  minPrice: number;
  category: string;
  unit: string;
  /** UI·trustScore 가 읽는 필드 */
  startDate: string;
  endDate: string;
  url: string;
}

export function mapPricingItem(raw: RawPricingItem): MappedPricingItem {
  const startDate = raw.adtFrDd ?? '';
  const endDate = raw.adtEndDd ?? '';
  return {
    name: raw.npayKorNm ?? raw.yadmNpayCdNm ?? '',
    price: Number(raw.curAmt ?? 0),
    maxPrice: Number(raw.maxAmt ?? 0),
    minPrice: Number(raw.minAmt ?? 0),
    category: raw.npayClsNm ?? '',
    unit: raw.yadmNpayCdNm ?? '',
    startDate,
    endDate,
    url: raw.urlAddr ?? '',
  };
}

export function averagePositivePrice(items: Array<{ price: number }>): number {
  const priced = items.filter((i) => Number.isFinite(i.price) && i.price > 0);
  if (priced.length === 0) return 0;
  return Math.round(priced.reduce((sum, i) => sum + i.price, 0) / priced.length);
}
