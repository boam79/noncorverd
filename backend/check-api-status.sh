#!/bin/bash

# API 상태 확인 스크립트
# 사용법: bash check-api-status.sh

echo "🔍 API 상태 확인"
echo "================================"
echo ""

# 환경변수 로드
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "1️⃣ PM2 상태 확인:"
pm2 status
echo ""

echo "2️⃣ PM2 로그 확인 (최근 30줄):"
pm2 logs nonvovered-backend --lines 30 --nostream
echo ""

echo "3️⃣ Health Check:"
curl -s http://localhost:3000/health | head -20
echo ""
echo ""

echo "4️⃣ 병원 목록 API 테스트 (서울):"
curl -s -H "X-Client-Token: ${CLIENT_OPENDATA_TOKEN:-dev-client-token-12345}" \
  "http://localhost:3000/opendata/hospitals?sido=11" | head -100
echo ""
echo ""

echo "5️⃣ 병원 목록 API 테스트 (파라미터 없이):"
curl -s -H "X-Client-Token: ${CLIENT_OPENDATA_TOKEN:-dev-client-token-12345}" \
  "http://localhost:3000/opendata/hospitals" | head -100
echo ""

echo "✅ 확인 완료!"

