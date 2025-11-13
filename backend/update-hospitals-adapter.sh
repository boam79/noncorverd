#!/bin/bash

# HospitalsAdapter 수정 스크립트 (EC2 서버에서 실행)
# 사용법: bash update-hospitals-adapter.sh

BACKEND_DIR="/var/www/nonvovered/backend"
ADAPTER_FILE="$BACKEND_DIR/src/adapters/hospitalsAdapter.js"

echo "🔧 HospitalsAdapter 수정 중..."
echo ""

# 백업
cp "$ADAPTER_FILE" "$ADAPTER_FILE.backup"
echo "✅ 백업 완료: $ADAPTER_FILE.backup"

# 파일이 존재하는지 확인
if [ ! -f "$ADAPTER_FILE" ]; then
  echo "❌ 파일을 찾을 수 없습니다: $ADAPTER_FILE"
  exit 1
fi

echo "✅ 파일 확인 완료"
echo ""
echo "📋 다음 단계:"
echo "  1. PM2 재시작: pm2 restart nonvovered-backend"
echo "  2. 로그 확인: pm2 logs nonvovered-backend --lines 50"
echo "  3. API 테스트: curl -H 'X-Client-Token: dev-client-token-12345' http://localhost:3000/opendata/hospitals"
echo ""
echo "⚠️  주의: 이 스크립트는 파일을 수정하지 않습니다."
echo "   수동으로 파일을 수정하거나 Git에서 최신 코드를 가져와야 합니다."

