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
  npayCd?: string;
  adtFrDd?: string;
  adtEndDd?: string;
  urlAddr?: string;
  [key: string]: string | undefined;
}

export interface MappedPricingItem {
  id: string;
  name: string;
  price: number;
  maxPrice: number;
  minPrice: number;
  category: string;
  unit: string;
  code?: string;
  /** UI·trustScore 가 읽는 필드 (YYYY-MM-DD) */
  startDate: string;
  endDate: string;
  url: string;
}

/** HIRA YYYYMMDD → YYYY-MM-DD (이미 하이픈이면 그대로) */
export function normalizeHiraDate(value?: string): string {
  if (!value) return '';
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

/** 오늘(YYYYMMDD) 기준 적용 종료일이 지나지 않았으면 true */
export function isPricingItemActive(raw: RawPricingItem, todayYmd?: string): boolean {
  const end = String(raw.adtEndDd || '99991231').replace(/-/g, '').slice(0, 8);
  if (end === '99991231') return true;
  const today =
    todayYmd ||
    new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return end >= today;
}

export function mapPricingItem(raw: RawPricingItem): MappedPricingItem {
  const startDate = normalizeHiraDate(raw.adtFrDd);
  const endDate = normalizeHiraDate(raw.adtEndDd);
  const code = raw.npayCd?.trim() || undefined;
  const name = raw.npayKorNm ?? raw.yadmNpayCdNm ?? '';
  return {
    id: code || `${name}|${startDate}|${raw.curAmt ?? ''}`,
    name,
    price: Number(raw.curAmt ?? 0),
    maxPrice: Number(raw.maxAmt ?? 0),
    minPrice: Number(raw.minAmt ?? 0),
    category: raw.npayClsNm ?? '',
    unit: raw.yadmNpayCdNm ?? '',
    code,
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
