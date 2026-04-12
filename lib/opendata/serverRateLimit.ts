import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import type { OpendataRouteKey } from '@/lib/observability/opendataMetrics';
import { recordOpendataRequest } from '@/lib/observability/opendataMetrics';

let ratelimit: Ratelimit | null | undefined;

function getRatelimit(): Ratelimit | null {
  if (ratelimit !== undefined) return ratelimit;
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      ratelimit = null;
      return null;
    }
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(120, '60 s'),
      prefix: 'nc-opendata',
      analytics: false,
    });
    return ratelimit;
  } catch {
    ratelimit = null;
    return null;
  }
}

/**
 * `UPSTASH_*`가 있으면 IP당 분당 요청 제한. 없으면 no-op.
 * App Route(Node 런타임)에서만 호출하세요.
 */
export async function enforceOpendataRateLimit(
  request: Request,
  route: OpendataRouteKey
): Promise<NextResponse | null> {
  const lim = getRatelimit();
  if (!lim) return null;

  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anon';

  const { success, limit, remaining, reset } = await lim.limit(`api:${ip}`);

  if (!success) {
    recordOpendataRequest(route, 429);
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: '요청이 잠시 많습니다. 잠시 후 다시 시도해 주세요.',
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    );
  }

  return null;
}
