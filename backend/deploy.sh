#!/bin/bash

# AWS EC2 배포 스크립트
# 사용법: ./deploy.sh [EC2_IP] [SSH_KEY_PATH]

set -e

EC2_IP=${1:-"your-ec2-ip"}
SSH_KEY=${2:-"~/.ssh/your-key.pem"}
REMOTE_USER="ubuntu"
REMOTE_DIR="/var/www/nonvovered/backend"

echo "🚀 AWS EC2 배포 시작..."
echo "EC2 IP: $EC2_IP"
echo "SSH Key: $SSH_KEY"

# 로컬에서 빌드 확인
echo "📦 로컬 빌드 확인 중..."
if [ ! -d "node_modules" ]; then
    echo "⚠️ node_modules가 없습니다. npm install 실행 중..."
    npm install
fi

# .env 파일 확인
if [ ! -f ".env" ]; then
    echo "❌ .env 파일이 없습니다!"
    echo "backend/.env 파일을 생성하고 환경변수를 설정해주세요."
    exit 1
fi

echo "✅ 로컬 준비 완료"

# EC2 서버에 연결하여 배포
echo "📡 EC2 서버에 연결 중..."

ssh -i "$SSH_KEY" "$REMOTE_USER@$EC2_IP" << 'ENDSSH'
    # 서버 준비
    echo "🔧 서버 환경 확인 중..."
    
    # Node.js 확인
    if ! command -v node &> /dev/null; then
        echo "📦 Node.js 설치 중..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # PM2 확인
    if ! command -v pm2 &> /dev/null; then
        echo "📦 PM2 설치 중..."
        sudo npm install -g pm2
    fi
    
    # 디렉토리 생성
    sudo mkdir -p /var/www/nonvovered
    sudo chown -R ubuntu:ubuntu /var/www/nonvovered
    
    echo "✅ 서버 준비 완료"
ENDSSH

# 파일 전송
echo "📤 파일 전송 중..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
    -e "ssh -i $SSH_KEY" \
    ./ "$REMOTE_USER@$EC2_IP:$REMOTE_DIR/"

# .env 파일 전송
echo "📤 .env 파일 전송 중..."
scp -i "$SSH_KEY" .env "$REMOTE_USER@$EC2_IP:$REMOTE_DIR/.env"

# 서버에서 설치 및 실행
echo "🔧 서버에서 의존성 설치 및 서버 시작 중..."
ssh -i "$SSH_KEY" "$REMOTE_USER@$EC2_IP" << ENDSSH
    cd $REMOTE_DIR
    
    # 의존성 설치
    echo "📦 의존성 설치 중..."
    npm install --production
    
    # PM2로 서버 재시작
    echo "🔄 서버 재시작 중..."
    pm2 stop nonvovered-backend 2>/dev/null || true
    pm2 delete nonvovered-backend 2>/dev/null || true
    pm2 start src/server.js --name nonvovered-backend
    pm2 save
    
    # PM2 상태 확인
    pm2 status
    
    echo "✅ 배포 완료!"
    echo "서버 URL: http://$EC2_IP:3001"
    echo "Health Check: http://$EC2_IP:3001/health"
ENDSSH

echo ""
echo "✅ 배포 완료!"
echo "서버 URL: http://$EC2_IP:3001"
echo "Health Check: http://$EC2_IP:3001/health"
echo ""
echo "테스트 명령어:"
echo "  curl http://$EC2_IP:3001/health"
echo "  curl -H 'X-Client-Token: dev-client-token-12345' http://$EC2_IP:3001/opendata/regions"

