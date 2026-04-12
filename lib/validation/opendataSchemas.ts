import { z } from 'zod';

/** GET /api/opendata/hospitals */
export const hospitalsQuerySchema = z.object({
  sido: z.string().max(12).optional().default(''),
  sigungu: z.string().max(12).optional().default(''),
  type: z.string().max(200).optional().default(''),
  hospitalName: z.string().max(120).optional().default(''),
});

export type HospitalsQuery = z.infer<typeof hospitalsQuerySchema>;

export function parseHospitalsQuery(sp: URLSearchParams): HospitalsQuery {
  return hospitalsQuerySchema.parse({
    sido: sp.get('sido') ?? '',
    sigungu: sp.get('sigungu') ?? '',
    type: sp.get('type') ?? '',
    hospitalName: sp.get('hospitalName') ?? '',
  });
}

/** GET /api/opendata/regions?sido= */
export const regionsQuerySchema = z.object({
  sido: z.string().max(12).optional(),
});

export type RegionsQuery = z.infer<typeof regionsQuerySchema>;

export function parseRegionsQuery(sp: URLSearchParams): RegionsQuery {
  const raw = sp.get('sido');
  return regionsQuerySchema.parse({
    sido: raw === null || raw === '' ? undefined : raw,
  });
}

const hospitalRefSchema = z.object({
  id: z.string().min(1).max(32),
  name: z.string().max(200).optional().default(''),
});

/** POST /api/opendata/pricing */
export const pricingBodySchema = z.object({
  hospitalIds: z
    .array(z.string().min(1).max(32))
    .min(1, 'hospitalIds가 필요합니다.')
    .max(12, '한 번에 최대 12개 병원만 조회할 수 있습니다.'),
  hospitals: z.array(hospitalRefSchema).optional(),
});

export type PricingBody = z.infer<typeof pricingBodySchema>;
