import { describe, expect, it } from 'vitest';
import { toHiraSido, toHiraSigungu } from '@/lib/opendata/codeMap';

describe('toHiraSido', () => {
  it('maps Seoul admin code to HIRA sido', () => {
    expect(toHiraSido('11')).toBe('110000');
  });

  it('pads and maps two-digit input', () => {
    expect(toHiraSido('41')).toBe('310000');
  });

  it('returns null for unknown code', () => {
    expect(toHiraSido('99')).toBeNull();
  });
});

describe('toHiraSigungu', () => {
  it('maps known Guri sigungu', () => {
    expect(toHiraSigungu('413100')).toBe('311000');
  });

  it('returns null for unknown six-digit code', () => {
    expect(toHiraSigungu('999999')).toBeNull();
  });
});
