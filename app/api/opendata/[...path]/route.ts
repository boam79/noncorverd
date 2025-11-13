import { NextRequest, NextResponse } from 'next/server';

// 백엔드 URL 설정 (환경변수 우선, 없으면 기본값)
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://54.180.251.93:3000';
// 클라이언트 토큰 설정 (여러 환경변수 이름 지원)
const CLIENT_TOKEN = process.env.CLIENT_OPENDATA_TOKEN || 
                     process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN || 
                     'dev-client-token-12345';

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

    // 디버깅 정보 (프로덕션에서도 로깅)
    console.log('[API Proxy] GET Request:', {
      url,
      backendUrl: BACKEND_URL,
      hasToken: !!CLIENT_TOKEN,
      timestamp: new Date().toISOString(),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Token': CLIENT_TOKEN,
        'User-Agent': 'Next.js-API-Route',
      },
      signal: controller.signal,
      // Vercel에서 외부 HTTP 요청을 위한 추가 옵션
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API Proxy] Backend Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 200),
        url,
      });
      
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
    // 더 상세한 에러 로깅
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    console.error('[API Proxy] Fetch Error:', {
      name: errorName,
      message: errorMessage,
      backendUrl: BACKEND_URL,
      hasToken: !!CLIENT_TOKEN,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 타임아웃 에러인 경우
    if (errorName === 'AbortError' || errorMessage.includes('timeout')) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'TIMEOUT_ERROR',
            message: '백엔드 서버 응답 시간이 초과되었습니다.',
          },
        },
        { status: 504 }
      );
    }

    // 네트워크 에러인 경우
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Failed to fetch')) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'CONNECTION_ERROR',
            message: '백엔드 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.',
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'PROXY_ERROR',
          message: errorMessage,
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

    // 디버깅 정보 (프로덕션에서도 로깅)
    console.log('[API Proxy] POST Request:', {
      url,
      backendUrl: BACKEND_URL,
      hasToken: !!CLIENT_TOKEN,
      timestamp: new Date().toISOString(),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Token': CLIENT_TOKEN,
        'User-Agent': 'Next.js-API-Route',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API Proxy] Backend Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 200),
        url,
      });
      
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    console.error('[API Proxy] Fetch Error:', {
      name: errorName,
      message: errorMessage,
      backendUrl: BACKEND_URL,
      hasToken: !!CLIENT_TOKEN,
    });

    if (errorName === 'AbortError' || errorMessage.includes('timeout')) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'TIMEOUT_ERROR',
            message: '백엔드 서버 응답 시간이 초과되었습니다.',
          },
        },
        { status: 504 }
      );
    }

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Failed to fetch')) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'CONNECTION_ERROR',
            message: '백엔드 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.',
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'PROXY_ERROR',
          message: errorMessage,
        },
      },
      { status: 502 }
    );
  }
}
