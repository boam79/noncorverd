import { describe, expect, it } from 'vitest';
import { cleanSigunguLabelForAddress } from '@/lib/opendata/adminSigunguList';

describe('cleanSigunguLabelForAddress', () => {
  it('경기도 접두를 제거해 시군구만 남긴다', () => {
    expect(cleanSigunguLabelForAddress('경기도 양주시')).toBe('양주시');
  });

  it('특별시·광역시 접두를 제거한다', () => {
    expect(cleanSigunguLabelForAddress('서울특별시 강남구')).toBe('강남구');
    expect(cleanSigunguLabelForAddress('부산광역시 해운대구')).toBe('해운대구');
  });
});
