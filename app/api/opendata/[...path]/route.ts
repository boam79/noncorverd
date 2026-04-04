import { NextRequest, NextResponse } from 'next/server';

/**
 * Catch-all 라우트
 * regions / hospitals / pricing 는 각자의 route.ts에서 처리됨.
 * 나머지 알 수 없는 경로에 대한 404 응답.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path?.join('/') ?? '';
  return NextResponse.json(
    { ok: false, error: { code: 'NOT_FOUND', message: `알 수 없는 엔드포인트: /opendata/${path}` } },
    { status: 404 }
  );
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path?.join('/') ?? '';
  return NextResponse.json(
    { ok: false, error: { code: 'NOT_FOUND', message: `알 수 없는 엔드포인트: /opendata/${path}` } },
    { status: 404 }
  );
}
