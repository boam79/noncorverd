#!/bin/bash

# EC2 서버에서 실행: 코드 업데이트 및 API 테스트
# 사용법: bash update-and-test.sh

echo "🔄 코드 업데이트 및 API 테스트"
echo "================================"
echo ""

# 프로젝트 루트로 이동
cd /var/www/nonvovered || exit 1

echo "1️⃣ Git Pull로 최신 코드 가져오기..."
git pull origin main

if [ $? -ne 0 ]; then
  echo "❌ Git pull 실패"
  exit 1
fi

echo "✅ 코드 업데이트 완료"
echo ""

# 백엔드 디렉토리로 이동
cd backend || exit 1

echo "2️⃣ 실제 API 테스트 실행..."
if [ -f "test-real-api.sh" ]; then
  bash test-real-api.sh
else
  echo "⚠️ test-real-api.sh 파일이 없습니다."
  echo "직접 API 테스트를 진행합니다..."
  
  # 환경변수 로드
  if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
  fi
  
  echo ""
  echo "📡 행정안전부 법정동코드 API 테스트:"
  curl -v -G "https://apis.data.go.kr/B552584/AdministrativeCodeService/getAdministrativeCode" \
    --data-urlencode "serviceKey=${ADMINISTRATIVE_CODE_SERVICE_KEY}" \
    --data-urlencode "pageNo=1" \
    --data-urlencode "numOfRows=10" \
    -H "Accept: application/json" \
    2>&1 | head -50
fi

echo ""
echo "✅ 테스트 완료!"

