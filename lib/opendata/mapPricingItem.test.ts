import { describe, expect, it } from 'vitest';
import { averagePositivePrice, mapPricingItem } from '@/lib/opendata/mapPricingItem';

describe('mapPricingItem', () => {
  it('maps HIRA fields to UI startDate/endDate', () => {
    const mapped = mapPricingItem({
      npayKorNm: '초음파',
      curAmt: '50000',
      maxAmt: '60000',
      minAmt: '40000',
      npayClsNm: '검사',
      yadmNpayCdNm: '회',
      adtFrDd: '20240101',
      adtEndDd: '99991231',
      urlAddr: 'https://example.com',
    });
    expect(mapped.name).toBe('초음파');
    expect(mapped.price).toBe(50000);
    expect(mapped.startDate).toBe('20240101');
    expect(mapped.endDate).toBe('99991231');
    expect(mapped.url).toBe('https://example.com');
  });

  it('falls back to empty strings and zero prices', () => {
    const mapped = mapPricingItem({});
    expect(mapped.name).toBe('');
    expect(mapped.price).toBe(0);
    expect(mapped.startDate).toBe('');
    expect(mapped.endDate).toBe('');
  });
});

describe('averagePositivePrice', () => {
  it('ignores zero and non-finite prices', () => {
    expect(averagePositivePrice([{ price: 0 }, { price: 100 }, { price: 300 }])).toBe(200);
    expect(averagePositivePrice([{ price: 0 }])).toBe(0);
  });
});
