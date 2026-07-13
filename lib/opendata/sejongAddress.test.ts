import { describe, expect, it } from 'vitest';
import { isSejongAddress } from '@/lib/opendata/sejongAddress';

describe('isSejongAddress', () => {
  it('accepts Sejong special city addresses', () => {
    expect(isSejongAddress('세종특별자치시 한누리대로 1')).toBe(true);
    expect(isSejongAddress('세종시 보람동 1')).toBe(true);
  });

  it('rejects Seoul Sejong-daero false positives', () => {
    expect(isSejongAddress('서울특별시 종로구 세종대로 1')).toBe(false);
    expect(isSejongAddress('전라남도 목포시 1')).toBe(false);
  });

  it('treats empty/null as non-Sejong', () => {
    expect(isSejongAddress(undefined)).toBe(false);
    expect(isSejongAddress(null)).toBe(false);
    expect(isSejongAddress('')).toBe(false);
  });
});
