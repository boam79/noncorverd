import { describe, expect, it } from 'vitest';
import { normalizeAdminSigunguCode } from '@/lib/opendata/normalizeAdminCode';

describe('normalizeAdminSigunguCode', () => {
  it('keeps six-digit codes', () => {
    expect(normalizeAdminSigunguCode('111100')).toBe('111100');
  });

  it('truncates longer digit strings to six', () => {
    expect(normalizeAdminSigunguCode('111100000000')).toBe('111100');
  });

  it('returns undefined for empty', () => {
    expect(normalizeAdminSigunguCode('')).toBeUndefined();
    expect(normalizeAdminSigunguCode(null)).toBeUndefined();
  });
});
