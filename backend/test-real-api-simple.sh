#!/bin/bash

# 실제 공공데이터 API 테스트 스크립트 (간단 버전)
# 사용법: bash test-real-api-simple.sh

echo "🔍 실제 공공데이터 API 테스트"
echo "================================"
echo ""

# 환경변수 로드
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "📋 환경변수 확인:"
echo "- ADMINISTRATIVE_CODE_SERVICE_KEY: ${ADMINISTRATIVE_CODE_SERVICE_KEY:0:30}..."
echo "- HIRA_SERVICE_KEY: ${HIRA_SERVICE_KEY:0:30}..."
echo ""

SERVICE_KEY="${ADMINISTRATIVE_CODE_SERVICE_KEY}"
HIRA_KEY="${HIRA_SERVICE_KEY}"

echo "1️⃣ 행정안전부 법정동코드 API 테스트:"
echo "-----------------------------------"
API_URL="https://apis.data.go.kr/B552584/AdministrativeCodeService/getAdministrativeCode"

echo "URL: $API_URL"
echo ""

# 실제 응답 확인 (상세 정보 없이)
echo "📡 API 호출 시도 (응답만 표시)..."
RESPONSE=$(curl -s -G "$API_URL" \
  --data-urlencode "serviceKey=$SERVICE_KEY" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10")

echo "응답:"
echo "$RESPONSE" | head -100
echo ""

# HTTP 상태 코드 확인
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -G "$API_URL" \
  --data-urlencode "serviceKey=$SERVICE_KEY" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10")

echo "HTTP 상태 코드: $HTTP_CODE"
echo ""

echo "2️⃣ 건강보험심사평가원 병원정보 API 테스트:"
echo "-----------------------------------"
HIRA_API_URL="https://apis.data.go.kr/B551182/MadmDtlInfoService2.7/getDetailInfoList"

echo "URL: $HIRA_API_URL"
echo ""

echo "📡 API 호출 시도 (응답만 표시)..."
HIRA_RESPONSE=$(curl -s -G "$HIRA_API_URL" \
  --data-urlencode "serviceKey=$HIRA_KEY" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10")

echo "응답:"
echo "$HIRA_RESPONSE" | head -100
echo ""

HIRA_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -G "$HIRA_API_URL" \
  --data-urlencode "serviceKey=$HIRA_KEY" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10")

echo "HTTP 상태 코드: $HIRA_HTTP_CODE"
echo ""

echo "3️⃣ 건강보험심사평가원 병원기본목록 API 테스트 (올바른 엔드포인트):"
echo "-----------------------------------"
HOSPITAL_LIST_API="https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList"

echo "URL: $HOSPITAL_LIST_API"
echo ""

echo "📡 API 호출 시도 (서울 종로구 병원 조회)..."
HOSPITAL_RESPONSE=$(curl -s -G "$HOSPITAL_LIST_API" \
  --data-urlencode "serviceKey=$HIRA_KEY" \
  --data-urlencode "sidoCd=11" \
  --data-urlencode "sgguCd=110" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=5")

echo "응답:"
echo "$HOSPITAL_RESPONSE" | head -100
echo ""

HOSPITAL_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -G "$HOSPITAL_LIST_API" \
  --data-urlencode "serviceKey=$HIRA_KEY" \
  --data-urlencode "sidoCd=11" \
  --data-urlencode "sgguCd=110" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=5")

echo "HTTP 상태 코드: $HOSPITAL_HTTP_CODE"
echo ""

echo "✅ 테스트 완료!"
echo ""
echo "📊 결과 요약:"
echo "  - 행정안전부 API: HTTP $HTTP_CODE"
echo "  - 건강보험심사평가원 상세정보 API: HTTP $HIRA_HTTP_CODE"
echo "  - 건강보험심사평가원 병원목록 API: HTTP $HOSPITAL_HTTP_CODE"

