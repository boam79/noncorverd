import type { NextRequest } from 'next/server';
import { validateToken, unauthorizedResponse } from '@/lib/opendata/client';
import { enforceOpendataRateLimit } from '@/lib/opendata/serverRateLimit';
import type { OpendataRouteKey } from '@/lib/observability/opendataMetrics';

/**
 * 공개 opendata 라우트 공통: 토큰 검증 → 선택 레이트리밋.
 * `null`이면 본문 로직을 계속 진행하면 됩니다.
 */
export async function opendataRoutePrelude(
  request: NextRequest,
  route: OpendataRouteKey
): Promise<Response | null> {
  if (!validateToken(request)) {
    return unauthorizedResponse();
  }
  const rateLimited = await enforceOpendataRateLimit(request, route);
  if (rateLimited) {
    return rateLimited;
  }
  return null;
}
