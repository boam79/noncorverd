import { describe, expect, it } from 'vitest';
import { normalizeHospitalType } from '@/lib/opendata/hospitalType';

describe('normalizeHospitalType', () => {
  it('maps HIRA names and codes', () => {
    expect(normalizeHospitalType('상급종합', '01')).toBe('종합병원');
    expect(normalizeHospitalType('종합병원', '11')).toBe('종합병원');
    expect(normalizeHospitalType('병원', '21')).toBe('병원');
    expect(normalizeHospitalType('요양병원', '28')).toBe('요양병원');
    expect(normalizeHospitalType('치과의원', '51')).toBe('치과');
  });

  it('coerces numeric clCd from JSON APIs without throwing', () => {
    expect(normalizeHospitalType('의원', 31)).toBe('병원');
    expect(normalizeHospitalType(undefined, 11)).toBe('종합병원');
    expect(normalizeHospitalType(null, 51)).toBe('치과');
  });
});
