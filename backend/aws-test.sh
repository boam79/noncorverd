#!/bin/bash

# AWS EC2에서 공공데이터 API 테스트 스크립트
# 사용법: ./aws-test.sh [EC2_IP] [SSH_KEY_PATH]

set -e

EC2_IP=${1:-"your-ec2-ip"}
SSH_KEY=${2:-"~/.ssh/your-key.pem"}
REMOTE_USER="ubuntu"
REMOTE_DIR="/var/www/nonvovered/backend"

echo "🧪 AWS EC2에서 공공데이터 API 테스트 시작..."
echo "EC2 IP: $EC2_IP"

# EC2 서버에서 테스트 실행
ssh -i "$SSH_KEY" "$REMOTE_USER@$EC2_IP" << ENDSSH
    cd $REMOTE_DIR
    
    echo "📋 환경변수 확인:"
    echo "- ADMINISTRATIVE_CODE_SERVICE_KEY: \$(test -n "\$ADMINISTRATIVE_CODE_SERVICE_KEY" && echo '✅ 설정됨' || echo '❌ 미설정')"
    echo "- HIRA_SERVICE_KEY: \$(test -n "\$HIRA_SERVICE_KEY" && echo '✅ 설정됨' || echo '❌ 미설정')"
    echo "- HIRA_PRICING_SERVICE_KEY: \$(test -n "\$HIRA_PRICING_SERVICE_KEY" && echo '✅ 설정됨' || echo '❌ 미설정')"
    echo ""
    
    # .env 파일 로드
    if [ -f ".env" ]; then
        export \$(cat .env | grep -v '^#' | xargs)
        echo "✅ .env 파일 로드 완료"
    else
        echo "❌ .env 파일이 없습니다!"
        exit 1
    fi
    
    echo ""
    echo "🚀 API 테스트 실행 중..."
    npm run test:api
ENDSSH

echo ""
echo "✅ 테스트 완료!"

