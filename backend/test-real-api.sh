#!/bin/bash

# 실제 공공데이터 API 테스트 스크립트 (EC2 서버에서 실행)
# 사용법: ./test-real-api.sh

echo "🔍 실제 공공데이터 API 테스트"
echo "================================"
echo ""

# 환경변수 확인
echo "📋 환경변수 확인:"
echo "- ADMINISTRATIVE_CODE_SERVICE_KEY: ${ADMINISTRATIVE_CODE_SERVICE_KEY:0:20}..."
echo "- HIRA_SERVICE_KEY: ${HIRA_SERVICE_KEY:0:20}..."
echo ""

# Service Key로 직접 API 호출 테스트
SERVICE_KEY="${ADMINISTRATIVE_CODE_SERVICE_KEY}"

echo "1️⃣ 행정안전부 법정동코드 API 테스트:"
echo "-----------------------------------"

# API 엔드포인트
API_URL="https://apis.data.go.kr/B552584/AdministrativeCodeService/getAdministrativeCode"

# Service Key 인코딩
ENCODED_KEY=$(echo -n "$SERVICE_KEY" | jq -sRr @uri)

echo "URL: $API_URL"
echo "Service Key (인코딩됨): ${ENCODED_KEY:0:50}..."
echo ""

# API 호출 (기본 파라미터)
echo "📡 API 호출 시도..."
curl -v -G "$API_URL" \
  --data-urlencode "serviceKey=$SERVICE_KEY" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10" \
  -H "Accept: application/json" \
  2>&1 | head -50

echo ""
echo ""
echo "2️⃣ 건강보험심사평가원 병원정보 API 테스트:"
echo "-----------------------------------"

HIRA_API_URL="https://apis.data.go.kr/B551182/MadmDtlInfoService2.7/getDetailInfoList"
HIRA_KEY="${HIRA_SERVICE_KEY}"

echo "URL: $HIRA_API_URL"
echo "Service Key (인코딩됨): ${HIRA_KEY:0:50}..."
echo ""

# API 호출
echo "📡 API 호출 시도..."
curl -v -G "$HIRA_API_URL" \
  --data-urlencode "serviceKey=$HIRA_KEY" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10" \
  -H "Accept: application/json" \
  2>&1 | head -50

echo ""
echo "✅ 테스트 완료!"

