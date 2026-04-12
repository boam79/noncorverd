import { describe, expect, it } from 'vitest';
import { hospitalAddressMatchesSigungu } from '@/lib/utils/addressSigunguMatch';

describe('hospitalAddressMatchesSigungu', () => {
  it('matches full official region name in address', () => {
    expect(
      hospitalAddressMatchesSigungu(
        '경기도 양주시 어떤로 1',
        '경기도 양주시',
        '양주시'
      )
    ).toBe(true);
  });

  it('does not match 남양주시 when looking for 양주시 only', () => {
    expect(
      hospitalAddressMatchesSigungu(
        '경기도 남양주시 다산로 1',
        '경기도 양주시',
        '양주시'
      )
    ).toBe(false);
  });

  it('returns false for empty address', () => {
    expect(hospitalAddressMatchesSigungu(undefined, '경기도 양주시', '양주시')).toBe(
      false
    );
  });
});
