import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedEnv: true,
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
  
  // API 프록시 설정 (Mixed Content 에러 해결)
  async rewrites() {
    return [
      {
        source: '/api/opendata/:path*',
        destination: 'http://54.180.251.93:3000/opendata/:path*',
      },
    ];
  },
};

export default nextConfig;

