import { NextRequest, NextResponse } from 'next/server';
import { getOpendataMetricsSnapshot } from '@/lib/observability/opendataMetrics';

/**
 * 인메모리 집계 스냅샷. 운영에서는 METRICS_SECRET을 설정하고 주기적으로만 조회하세요.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.METRICS_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: { code: 'DISABLED', message: 'METRICS_SECRET이 설정되지 않았습니다.' } },
      { status: 404 }
    );
  }

  const header = request.headers.get('x-metrics-secret');
  if (header !== secret) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: '유효하지 않은 키입니다.' } },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, data: getOpendataMetricsSnapshot() });
}
