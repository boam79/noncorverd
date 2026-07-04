import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedEnv: true,
  },
  turbopack: {
    root: '.',
  },
  // 성능 최적화
  compress: true,
  poweredByHeader: false,
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // 컴파일러 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Vercel 최적화 (standalone은 Vercel에서 자동 처리)
  // output: 'standalone', // Vercel에서는 필요 없음

  // 참고: API 프록시는 app/api/opendata/[...path]/route.ts에서 처리
  // rewrites는 Vercel에서 외부 HTTP 엔드포인트 프록시 시 제한이 있어서
  // Next.js API Route를 사용하는 것이 더 안정적입니다.

  // 기본 보안 헤더. Next.js 하이드레이션 인라인 스크립트/스타일 때문에
  // script-src/style-src에는 'unsafe-inline'을 허용하는 1차 베이스라인입니다.
  // 이후 nonce 기반 CSP로 강화하는 것을 권장합니다(redesign-6와 함께 검토).
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://apis.data.go.kr",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;

