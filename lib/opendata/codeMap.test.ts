import { describe, expect, it } from 'vitest';
import { toHiraSido, toHiraSigungu } from '@/lib/opendata/codeMap';

describe('toHiraSido', () => {
  it('maps Seoul admin code to HIRA sido', () => {
    expect(toHiraSido('11')).toBe('110000');
  });

  it('pads and maps two-digit input', () => {
    expect(toHiraSido('41')).toBe('310000');
  });

  it('maps Sejong and Jeonnam to distinct HIRA codes', () => {
    expect(toHiraSido('36')).toBe('361000');
    expect(toHiraSido('46')).toBe('360000');
    expect(toHiraSido('36')).not.toBe(toHiraSido('46'));
  });

  it('returns null for unknown code', () => {
    expect(toHiraSido('99')).toBeNull();
  });
});

describe('toHiraSigungu', () => {
  it('maps known Guri sigungu', () => {
    expect(toHiraSigungu('413100')).toBe('311000');
  });

  it('maps Yangju (Gyeonggi) sigungu', () => {
    expect(toHiraSigungu('416300')).toBe('312700');
  });

  it('returns null for unknown six-digit code', () => {
    expect(toHiraSigungu('999999')).toBeNull();
  });
});
