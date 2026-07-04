import { NextResponse } from 'next/server';

/**
 * 무인증 liveness 헬스체크. 업타임 모니터링/헬스체크 연동용.
 * 인증 정보나 운영 지표는 노출하지 않습니다(집계 지표는 `GET /api/health/metrics` 참고).
 */
export async function GET() {
  return NextResponse.json(
    { ok: true, data: { status: 'ok', timestamp: new Date().toISOString() } },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
