/**
 * PM2 Ecosystem 설정 파일
 * 환경변수를 명시적으로 로드하여 PM2에서 사용
 * 
 * CommonJS 형식으로 작성 (PM2 호환성)
 */

require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'nonvovered-backend',
      script: './src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
        CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000,https://noncorverd.vercel.app',
        CLIENT_OPENDATA_TOKEN: process.env.CLIENT_OPENDATA_TOKEN || 'dev-client-token-12345',
        // 단일 API 키 (모든 공공데이터 API에 사용)
        api_key: process.env.api_key || '',
        // 하위 호환성을 위한 별도 키 (api_key가 없을 때 사용)
        ADMINISTRATIVE_CODE_SERVICE_KEY: process.env.ADMINISTRATIVE_CODE_SERVICE_KEY || process.env.api_key || '',
        HIRA_SERVICE_KEY: process.env.HIRA_SERVICE_KEY || process.env.api_key || '',
        HIRA_PRICING_SERVICE_KEY: process.env.HIRA_PRICING_SERVICE_KEY || process.env.api_key || '',
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};

