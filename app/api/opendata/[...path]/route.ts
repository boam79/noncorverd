import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://54.180.251.93:3000';
const CLIENT_TOKEN = process.env.CLIENT_OPENDATA_TOKEN || process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN || '';

/**
 * Next.js API Route를 사용한 백엔드 프록시
 * Vercel rewrites 대신 사용하여 더 안정적인 프록시 제공
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await context.params;
    const path = params.path ? `/${params.path.join('/')}` : '';
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/opendata${path}${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Token': CLIENT_TOKEN,
      },
      // Vercel에서 외부 HTTP 요청 시 타임아웃 설정
      signal: AbortSignal.timeout(30000), // 30초
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorText || response.statusText,
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'PROXY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 502 }
    );
  }
}

/**
 * POST 요청 처리
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await context.params;
    const path = params.path ? `/${params.path.join('/')}` : '';
    const url = `${BACKEND_URL}/opendata${path}`;
    const body = await request.json();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Token': CLIENT_TOKEN,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000), // 30초
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorText || response.statusText,
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'PROXY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 502 }
    );
  }
}

