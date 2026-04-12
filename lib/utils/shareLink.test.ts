import { describe, expect, it } from 'vitest';
import { decodeSharePayload, encodeSharePayload } from '@/lib/utils/shareLink';

describe('shareLink', () => {
  it('round-trips hospital ids', () => {
    const payload = { v: 1 as const, i: ['a', 'b'] };
    const encoded = encodeSharePayload(payload);
    expect(decodeSharePayload(encoded)).toEqual(payload);
  });

  it('returns null for invalid payload', () => {
    expect(decodeSharePayload('not-valid')).toBeNull();
  });

  it('caps ids and accepts optional q', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `id${i}`);
    const encoded = encodeSharePayload({ v: 1, i: ids, q: { 초음파: 2 } });
    const decoded = decodeSharePayload(encoded);
    expect(decoded?.i.length).toBeLessThanOrEqual(8);
    expect(decoded?.q?.초음파).toBe(2);
  });
});
