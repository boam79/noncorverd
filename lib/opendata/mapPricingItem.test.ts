import { describe, expect, it } from 'vitest';
import {
  averagePositivePrice,
  comparisonItemKey,
  isPricingItemActive,
  mapPricingItem,
  normalizeHiraDate,
  todayYmdKst,
} from '@/lib/opendata/mapPricingItem';

describe('normalizeHiraDate', () => {
  it('converts YYYYMMDD to ISO date', () => {
    expect(normalizeHiraDate('20240101')).toBe('2024-01-01');
    expect(normalizeHiraDate('99991231')).toBe('9999-12-31');
  });

  it('keeps already-normalized dates', () => {
    expect(normalizeHiraDate('2024-01-01')).toBe('2024-01-01');
  });
});

describe('todayYmdKst', () => {
  it('returns eight digits', () => {
    expect(todayYmdKst()).toMatch(/^\d{8}$/);
  });
});

describe('isPricingItemActive', () => {
  it('keeps open-ended and future end dates', () => {
    expect(isPricingItemActive({ adtEndDd: '99991231' }, '20260713')).toBe(true);
    expect(isPricingItemActive({ adtEndDd: '20261231' }, '20260713')).toBe(true);
  });

  it('drops expired items', () => {
    expect(isPricingItemActive({ adtEndDd: '20200101' }, '20260713')).toBe(false);
  });

  it('drops items that have not started yet', () => {
    expect(
      isPricingItemActive({ adtFrDd: '20270101', adtEndDd: '99991231' }, '20260713')
    ).toBe(false);
  });

  it('keeps items within start and end', () => {
    expect(
      isPricingItemActive({ adtFrDd: '20260101', adtEndDd: '20261231' }, '20260713')
    ).toBe(true);
  });
});

describe('comparisonItemKey', () => {
  it('prefers code over name', () => {
    expect(comparisonItemKey({ name: '초음파', code: 'A1' })).toBe('code:A1');
    expect(comparisonItemKey({ name: '초음파' })).toBe('name:초음파');
  });
});

describe('mapPricingItem', () => {
  it('maps HIRA fields to UI startDate/endDate ISO and code', () => {
    const mapped = mapPricingItem({
      npayKorNm: '초음파',
      curAmt: '50000',
      maxAmt: '60000',
      minAmt: '40000',
      npayClsNm: '검사',
      yadmNpayCdNm: '회',
      npayCd: 'ABC',
      adtFrDd: '20240101',
      adtEndDd: '99991231',
      urlAddr: 'https://example.com',
    });
    expect(mapped.name).toBe('초음파');
    expect(mapped.price).toBe(50000);
    expect(mapped.startDate).toBe('2024-01-01');
    expect(mapped.endDate).toBe('9999-12-31');
    expect(mapped.code).toBe('ABC');
    expect(mapped.id).toBe('ABC');
    expect(mapped.url).toBe('https://example.com');
  });

  it('falls back to empty strings and zero prices', () => {
    const mapped = mapPricingItem({});
    expect(mapped.name).toBe('');
    expect(mapped.price).toBe(0);
    expect(mapped.startDate).toBe('');
    expect(mapped.endDate).toBe('');
  });

  it('coerces numeric HIRA JSON fields without throwing', () => {
    const mapped = mapPricingItem({
      npayKorNm: 'CT',
      curAmt: 120000,
      npayCd: 99001,
      adtFrDd: 20240101,
      adtEndDd: 99991231,
    });
    expect(mapped.code).toBe('99001');
    expect(mapped.price).toBe(120000);
    expect(mapped.startDate).toBe('2024-01-01');
    expect(mapped.endDate).toBe('9999-12-31');
    expect(isPricingItemActive({ adtFrDd: 20240101, adtEndDd: 99991231 }, '20260713')).toBe(
      true
    );
  });
});

describe('averagePositivePrice', () => {
  it('ignores zero and non-finite prices', () => {
    expect(averagePositivePrice([{ price: 0 }, { price: 100 }, { price: 300 }])).toBe(200);
    expect(averagePositivePrice([{ price: 0 }])).toBe(0);
  });
});
