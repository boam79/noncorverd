import { describe, expect, it } from 'vitest';
import {
  hospitalsQuerySchema,
  pricingBodySchema,
  regionsQuerySchema,
} from '@/lib/validation/opendataSchemas';

describe('hospitalsQuerySchema', () => {
  it('accepts typical query', () => {
    expect(
      hospitalsQuerySchema.parse({
        sido: '11',
        sigungu: '116800',
        type: '종합병원',
        hospitalName: '서울',
      })
    ).toMatchObject({ sido: '11' });
  });

  it('rejects overly long hospitalName', () => {
    const long = 'x'.repeat(200);
    const r = hospitalsQuerySchema.safeParse({
      sido: '',
      sigungu: '',
      type: '',
      hospitalName: long,
    });
    expect(r.success).toBe(false);
  });
});

describe('regionsQuerySchema', () => {
  it('allows missing sido', () => {
    expect(regionsQuerySchema.parse({})).toEqual({});
  });
});

describe('pricingBodySchema', () => {
  it('requires at least one hospital id', () => {
    const r = pricingBodySchema.safeParse({ hospitalIds: [] });
    expect(r.success).toBe(false);
  });

  it('parses valid body', () => {
    const r = pricingBodySchema.safeParse({
      hospitalIds: ['yk1'],
      hospitals: [{ id: 'yk1', name: '테스트' }],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.hospitalIds).toEqual(['yk1']);
  });

  it('accepts real-length HIRA ykiho (~80 chars)', () => {
    const ykiho =
      'JDQ4MTg4MSM1MSMkMSMkMCMkODkkMzgxMzUxIzExIyQxIyQzIyQ3OSQ0NjEwMDIjNjEjJDEjJDQjJDgz';
    expect(ykiho.length).toBeGreaterThan(32);
    const r = pricingBodySchema.safeParse({
      hospitalIds: [ykiho],
      hospitals: [{ id: ykiho, name: '강북삼성병원' }],
    });
    expect(r.success).toBe(true);
  });

  it('rejects absurdly long ids', () => {
    const r = pricingBodySchema.safeParse({
      hospitalIds: ['x'.repeat(200)],
    });
    expect(r.success).toBe(false);
  });
});
