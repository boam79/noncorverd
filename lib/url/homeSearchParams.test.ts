import { describe, expect, it } from 'vitest';
import {
  parseClinicalFocusParam,
  parseHomeSearchParams,
  serializeHomeSearchParams,
} from '@/lib/url/homeSearchParams';

describe('homeSearchParams', () => {
  it('parseClinicalFocusParam rejects unknown', () => {
    expect(parseClinicalFocusParam(null)).toBe('none');
    expect(parseClinicalFocusParam('')).toBe('none');
    expect(parseClinicalFocusParam('not-a-focus')).toBe('none');
    expect(parseClinicalFocusParam('orthopedics')).toBe('orthopedics');
  });

  it('parseHomeSearchParams trims and omits empty q', () => {
    const sp = new URLSearchParams('sido=11&q=%20%20&focus=plastic_surgery');
    expect(parseHomeSearchParams(sp)).toEqual({
      sido: '11',
      sigungu: undefined,
      q: undefined,
      focus: 'plastic_surgery',
    });
  });

  it('serializeHomeSearchParams omits none focus and empty fields', () => {
    const qs = serializeHomeSearchParams({
      sido: '11',
      sigungu: '111100',
      hospitalNameCommitted: '  삼성  ',
      clinicalFocus: 'none',
    });
    expect(qs).toContain('sido=11');
    expect(qs).toContain('sigungu=111100');
    expect(qs).toContain('q=');
    expect(qs).not.toContain('focus=');
    expect(serializeHomeSearchParams({ clinicalFocus: 'none' })).toBe('');
  });
});
