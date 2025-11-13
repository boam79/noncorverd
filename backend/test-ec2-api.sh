#!/bin/bash

# EC2 서버에서 공공데이터 API 테스트
# EC2 IP: 54.180.251.93

set -e

EC2_IP="54.180.251.93"
REMOTE_USER="ubuntu"
REMOTE_DIR="/var/www/nonvovered/backend"

# SSH 키 경로 찾기 (프로젝트 루트에서 찾기)
SSH_KEY=""
POSSIBLE_PATHS=(
    "$(pwd)/../boam79-aws-key.pem"  # 프로젝트 루트
    "${HOME}/.ssh/boam79-aws-key.pem"  # 기본 SSH 디렉토리
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        SSH_KEY="$path"
        break
    fi
done

if [ -z "$SSH_KEY" ]; then
    echo "❌ SSH 키 파일을 찾을 수 없습니다."
    exit 1
fi

echo "🧪 EC2 서버에서 공공데이터 API 테스트"
echo "======================================"
echo "EC2 IP: $EC2_IP"
echo ""

# 로컬에서 Health Check
echo "1️⃣ Health Check (로컬에서):"
curl -s http://$EC2_IP:3000/health | jq . || curl -s http://$EC2_IP:3000/health
echo ""
echo ""

# EC2 서버에서 API 테스트
echo "2️⃣ EC2 서버에서 API 테스트 실행:"
ssh -i "$SSH_KEY" "$REMOTE_USER@$EC2_IP" << ENDSSH
    cd $REMOTE_DIR
    
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
    echo ""
    npm run test:api
ENDSSH

echo ""
echo "======================================"
echo "✅ 테스트 완료!"
echo "======================================"
echo ""
echo "다음 단계:"
echo "  1. 프론트엔드에서 백엔드 연결 테스트"
echo "  2. 실제 공공데이터 API 응답 확인"
echo "  3. API 엔드포인트 및 파라미터 조정 (필요 시)"
echo ""

