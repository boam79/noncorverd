#!/bin/bash

# AWS EC2 배포 스크립트 (실제 EC2 정보 사용)
# EC2 인스턴스: i-030a6f1fd19110d16 (boam79-sever1)
# 퍼블릭 IP: 54.180.251.93

set -e

EC2_IP="54.180.251.93"
REMOTE_USER="ubuntu"
REMOTE_DIR="/var/www/nonvovered/backend"

# SSH 키 경로 찾기 (프로젝트 루트에서 찾기)
SSH_KEY=""
POSSIBLE_PATHS=(
    "$(pwd)/../boam79-aws-key.pem"  # 프로젝트 루트
    "${HOME}/.ssh/boam79-aws-key.pem"  # 기본 SSH 디렉토리
    "$(pwd)/../../boam79-aws-key.pem"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        SSH_KEY="$path"
        break
    fi
done

# SSH 키를 찾지 못한 경우 사용자 입력 요청
if [ -z "$SSH_KEY" ]; then
    echo "⚠️  SSH 키 파일을 자동으로 찾을 수 없습니다."
    echo ""
    echo "가능한 경로:"
    for path in "${POSSIBLE_PATHS[@]}"; do
        echo "  - $path"
    done
    echo ""
    read -p "SSH 키 파일의 전체 경로를 입력하세요: " SSH_KEY
    
    if [ ! -f "$SSH_KEY" ]; then
        echo "❌ SSH 키 파일을 찾을 수 없습니다: $SSH_KEY"
        exit 1
    fi
fi

echo "🚀 AWS EC2 배포 시작..."
echo "===================="
echo "EC2 인스턴스: i-030a6f1fd19110d16 (boam79-sever1)"
echo "퍼블릭 IP: $EC2_IP"
echo "리전: ap-northeast-2 (서울)"
echo "SSH Key: $SSH_KEY"
echo ""

# SSH 키 권한 확인
if [ "$(stat -f %A "$SSH_KEY" 2>/dev/null || stat -c %a "$SSH_KEY" 2>/dev/null)" != "600" ] && [ "$(stat -f %A "$SSH_KEY" 2>/dev/null || stat -c %a "$SSH_KEY" 2>/dev/null)" != "400" ]; then
    echo "⚠️  SSH 키 권한을 400 또는 600으로 설정 중..."
    chmod 400 "$SSH_KEY"
fi

# .env 파일 확인
if [ ! -f ".env" ]; then
    echo "❌ .env 파일이 없습니다!"
    echo "backend/.env 파일을 생성하고 환경변수를 설정해주세요."
    exit 1
fi

echo "✅ 로컬 준비 완료"
echo ""

# EC2 서버 연결 테스트
echo "📡 EC2 서버 연결 테스트 중..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$REMOTE_USER@$EC2_IP" "echo '연결 성공'" 2>/dev/null; then
    echo "❌ EC2 서버에 연결할 수 없습니다."
    echo "다음을 확인해주세요:"
    echo "  1. EC2 인스턴스가 실행 중인지 확인"
    echo "  2. 보안 그룹에서 SSH (22) 포트가 열려있는지 확인"
    echo "  3. SSH 키 경로가 올바른지 확인"
    exit 1
fi

echo "✅ 서버 연결 성공"
echo ""

# 서버 초기 설정
echo "🔧 서버 환경 설정 중..."
ssh -i "$SSH_KEY" "$REMOTE_USER@$EC2_IP" << 'ENDSSH'
    set -e
    
    echo "📦 Node.js 확인 중..."
    if ! command -v node &> /dev/null; then
        echo "Node.js 설치 중..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        echo "✅ Node.js 설치 완료: $(node --version)"
    else
        echo "✅ Node.js 이미 설치됨: $(node --version)"
    fi
    
    echo ""
    echo "📦 PM2 확인 중..."
    if ! command -v pm2 &> /dev/null; then
        echo "PM2 설치 중..."
        sudo npm install -g pm2
        echo "✅ PM2 설치 완료: $(pm2 --version)"
    else
        echo "✅ PM2 이미 설치됨: $(pm2 --version)"
    fi
    
    echo ""
    echo "📁 디렉토리 생성 중..."
    sudo mkdir -p /var/www/nonvovered/backend
    sudo chown -R ubuntu:ubuntu /var/www/nonvovered
    echo "✅ 디렉토리 준비 완료"
ENDSSH

echo "✅ 서버 환경 설정 완료"
echo ""

# 파일 전송
echo "📤 프로젝트 파일 전송 중..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude '*.log' \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    ./ "$REMOTE_USER@$EC2_IP:$REMOTE_DIR/"

echo "✅ 파일 전송 완료"
echo ""

# .env 파일 전송
echo "📤 .env 파일 전송 중..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    .env "$REMOTE_USER@$EC2_IP:$REMOTE_DIR/.env"

echo "✅ .env 파일 전송 완료"
echo ""

# 서버에서 설치 및 실행
echo "🔧 서버에서 의존성 설치 및 서버 시작 중..."
ssh -i "$SSH_KEY" "$REMOTE_USER@$EC2_IP" << ENDSSH
    set -e
    cd $REMOTE_DIR
    
    echo "📦 의존성 설치 중..."
    npm install --production
    
    echo ""
    echo "🔄 서버 재시작 중..."
    pm2 stop nonvovered-backend 2>/dev/null || true
    pm2 delete nonvovered-backend 2>/dev/null || true
    pm2 start src/server.js --name nonvovered-backend
    pm2 save
    
    echo ""
    echo "📊 PM2 상태:"
    pm2 status
    
    echo ""
    echo "✅ 배포 완료!"
ENDSSH

echo ""
echo "=========================================="
echo "✅ 배포 완료!"
echo "=========================================="
echo ""
echo "서버 정보:"
echo "  - EC2 IP: $EC2_IP"
echo "  - Health Check: http://$EC2_IP:3000/health"
echo "  - API Gateway: http://$EC2_IP:3000/opendata"
echo ""
echo "테스트 명령어:"
echo "  curl http://$EC2_IP:3000/health"
echo "  curl -H 'X-Client-Token: dev-client-token-12345' http://$EC2_IP:3000/opendata/regions"
echo ""
echo "✅ 보안 그룹 확인:"
echo "  포트 3000이 보안 그룹에 열려있습니다."
echo ""

