#!/bin/bash

# 실제 공공데이터 API 테스트 (올바른 파라미터로)
# 사용법: bash test-api-with-params.sh

echo "🔍 실제 공공데이터 API 테스트 (파라미터 확인)"
echo "================================"
echo ""

# 환경변수 로드
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

HIRA_KEY="${HIRA_SERVICE_KEY}"

echo "1️⃣ 건강보험심사평가원 병원목록 API (서울 전체):"
echo "-----------------------------------"
HOSPITAL_LIST_API="https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList"

echo "URL: $HOSPITAL_LIST_API"
echo "파라미터: sidoCd=11 (서울), pageNo=1, numOfRows=10"
echo ""

RESPONSE=$(curl -s -G "$HOSPITAL_LIST_API" \
  --data-urlencode "serviceKey=$HIRA_KEY" \
  --data-urlencode "sidoCd=11" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10")

echo "응답 (처음 500자):"
echo "$RESPONSE" | head -c 500
echo ""
echo ""

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -G "$HOSPITAL_LIST_API" \
  --data-urlencode "serviceKey=$HIRA_KEY" \
  --data-urlencode "sidoCd=11" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10")

echo "HTTP 상태 코드: $HTTP_CODE"
echo ""

echo "2️⃣ 건강보험심사평가원 병원목록 API (파라미터 없이):"
echo "-----------------------------------"
echo "파라미터: pageNo=1, numOfRows=10 (지역 필터 없음)"
echo ""

RESPONSE2=$(curl -s -G "$HOSPITAL_LIST_API" \
  --data-urlencode "serviceKey=$HIRA_KEY" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10")

echo "응답 (처음 500자):"
echo "$RESPONSE2" | head -c 500
echo ""
echo ""

HTTP_CODE2=$(curl -s -o /dev/null -w "%{http_code}" -G "$HOSPITAL_LIST_API" \
  --data-urlencode "serviceKey=$HIRA_KEY" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10")

echo "HTTP 상태 코드: $HTTP_CODE2"
echo ""

echo "3️⃣ 건강보험심사평가원 병원목록 API (종합병원만):"
echo "-----------------------------------"
echo "파라미터: clCd=01 (종합병원), pageNo=1, numOfRows=10"
echo ""

RESPONSE3=$(curl -s -G "$HOSPITAL_LIST_API" \
  --data-urlencode "serviceKey=$HIRA_KEY" \
  --data-urlencode "clCd=01" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10")

echo "응답 (처음 500자):"
echo "$RESPONSE3" | head -c 500
echo ""
echo ""

HTTP_CODE3=$(curl -s -o /dev/null -w "%{http_code}" -G "$HOSPITAL_LIST_API" \
  --data-urlencode "serviceKey=$HIRA_KEY" \
  --data-urlencode "clCd=01" \
  --data-urlencode "pageNo=1" \
  --data-urlencode "numOfRows=10")

echo "HTTP 상태 코드: $HTTP_CODE3"
echo ""

echo "✅ 테스트 완료!"

