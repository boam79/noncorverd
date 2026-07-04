> ⚠️ **아카이브(2026-07)**: 백엔드 인프라가 AWS EC2 → Render로 전환되며 폐기된 문서입니다.
> 여기서 참조하는 `backend/quick-deploy.sh`, `aws-test.sh`는 저장소에 더 이상 존재하지 않습니다.
> 현재 배포 절차는 [`doc/DEPLOYMENT.md`](../DEPLOYMENT.md), Render 관련 정보는
> [`doc/RENDER_INFO.md`](../RENDER_INFO.md) · [`doc/RENDER_DEPLOYMENT.md`](../RENDER_DEPLOYMENT.md)를 참고하세요.

# AWS EC2 배포 가이드 (간단 버전, 아카이브됨)

## 🚀 빠른 시작

### 1. EC2 IP 확인
AWS 콘솔에서 EC2 인스턴스의 퍼블릭 IP를 확인하세요.

### 2. 배포 실행

```bash
cd backend
./quick-deploy.sh
```

스크립트가 다음을 자동으로 수행합니다:
- ✅ Node.js 설치 확인 및 설치
- ✅ PM2 설치 확인 및 설치
- ✅ 프로젝트 파일 업로드
- ✅ .env 파일 업로드
- ✅ 의존성 설치
- ✅ 서버 시작

### 3. 테스트

```bash
# Health Check
curl http://YOUR_EC2_IP:3001/health

# API 테스트
curl -H "X-Client-Token: dev-client-token-12345" \
  http://YOUR_EC2_IP:3001/opendata/regions
```

## 📝 수동 배포 (선택)

자동 스크립트가 작동하지 않을 경우:

```bash
# 1. EC2 접속
ssh -i ~/.ssh/boam79-aws-key.pem ubuntu@YOUR_EC2_IP

# 2. Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. PM2 설치
sudo npm install -g pm2

# 4. 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/nonvovered/backend
sudo chown ubuntu:ubuntu /var/www/nonvovered/backend

# 5. 로컬에서 파일 업로드 (다른 터미널)
cd /Users/parkjaemin/Documents/app/nonvovered/backend
rsync -avz --exclude 'node_modules' --exclude '.git' \
  -e "ssh -i ~/.ssh/boam79-aws-key.pem" \
  ./ ubuntu@YOUR_EC2_IP:/var/www/nonvovered/backend/

# 6. .env 파일 업로드
scp -i ~/.ssh/boam79-aws-key.pem .env \
  ubuntu@YOUR_EC2_IP:/var/www/nonvovered/backend/.env

# 7. EC2에서 서버 시작
ssh -i ~/.ssh/boam79-aws-key.pem ubuntu@YOUR_EC2_IP
cd /var/www/nonvovered/backend
npm install --production
pm2 start src/server.js --name nonvovered-backend
pm2 save
pm2 startup
```

## 🧪 원격 테스트

```bash
cd backend
./aws-test.sh YOUR_EC2_IP ~/.ssh/boam79-aws-key.pem
```

## ⚠️ 주의사항

1. **보안 그룹 설정**: EC2 보안 그룹에서 포트 3001이 열려있는지 확인
2. **Service Key**: `.env` 파일에 실제 Service Key가 설정되어 있는지 확인
3. **리전**: EC2 인스턴스가 **ap-northeast-2 (서울)** 리전에 있어야 합니다

## 🔍 문제 해결

### 포트 접근 불가
```bash
# AWS 콘솔 → EC2 → 보안 그룹 → 인바운드 규칙
# 규칙 추가:
# - 유형: 사용자 지정 TCP
# - 포트: 3001
# - 소스: 0.0.0.0/0
```

### 서버가 시작되지 않음
```bash
# EC2 접속 후
pm2 logs nonvovered-backend
# 또는
cd /var/www/nonvovered/backend
node src/server.js
```

