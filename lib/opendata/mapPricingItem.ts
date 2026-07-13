/**
 * HIRA 비급여 상세 항목 → 프론트엔드 NonCoveredItem 형태
 * (UI·신뢰도 점수는 startDate/endDate 를 사용합니다)
 */

export interface RawPricingItem {
  npayKorNm?: string | number;
  curAmt?: string | number;
  maxAmt?: string | number;
  minAmt?: string | number;
  npayClsNm?: string | number;
  yadmNpayCdNm?: string | number;
  npayCd?: string | number;
  adtFrDd?: string | number;
  adtEndDd?: string | number;
  urlAddr?: string | number;
  [key: string]: string | number | undefined;
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

/** Asia/Seoul 기준 오늘 YYYYMMDD */
export function todayYmdKst(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}${m}${d}`;
}

/** HIRA YYYYMMDD → YYYY-MM-DD (이미 하이픈이면 그대로) */
export function normalizeHiraDate(value?: string | number | null): string {
  if (value == null || value === '') return '';
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

function toYmdDigits(value?: string | number | null): string {
  return String(value ?? '')
    .replace(/-/g, '')
    .replace(/\D/g, '')
    .slice(0, 8);
}

function textField(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

/**
 * 오늘(KST YYYYMMDD) 기준 적용 기간 안이면 true.
 * - 종료일 없음/`99991231` → 종료 제한 없음
 * - 시작일 없음 → 시작 제한 없음
 */
export function isPricingItemActive(raw: RawPricingItem, todayYmd?: string): boolean {
  const today = todayYmd || todayYmdKst();
  const start = toYmdDigits(raw.adtFrDd);
  const end = toYmdDigits(raw.adtEndDd) || '99991231';

  if (start && start.length === 8 && start > today) return false;
  if (end === '99991231') return true;
  if (end.length === 8 && end < today) return false;
  return true;
}

/** 비교표 집계 키 — 코드가 있으면 코드 우선(동명 이종 항목 분리) */
export function comparisonItemKey(item: { name: string; code?: string }): string {
  const code = item.code == null ? '' : String(item.code).trim();
  if (code) return `code:${code}`;
  return `name:${item.name}`;
}

export function mapPricingItem(raw: RawPricingItem): MappedPricingItem {
  const startDate = normalizeHiraDate(raw.adtFrDd);
  const endDate = normalizeHiraDate(raw.adtEndDd);
  const code = textField(raw.npayCd) || undefined;
  const name = textField(raw.npayKorNm) || textField(raw.yadmNpayCdNm);
  return {
    id: code || `${name}|${startDate}|${raw.curAmt ?? ''}`,
    name,
    price: Number(raw.curAmt ?? 0),
    maxPrice: Number(raw.maxAmt ?? 0),
    minPrice: Number(raw.minAmt ?? 0),
    category: textField(raw.npayClsNm),
    unit: textField(raw.yadmNpayCdNm),
    code,
    startDate,
    endDate,
    url: textField(raw.urlAddr),
  };
}

export function averagePositivePrice(items: Array<{ price: number }>): number {
  const priced = items.filter((i) => Number.isFinite(i.price) && i.price > 0);
  if (priced.length === 0) return 0;
  return Math.round(priced.reduce((sum, i) => sum + i.price, 0) / priced.length);
}
