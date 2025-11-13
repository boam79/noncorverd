# AWS EC2 배포 및 테스트 가이드

## 🎯 목적

해외 서버에서 공공데이터 API 접근이 제한될 수 있으므로, AWS EC2 (ap-northeast-2, 서울 리전)에 배포하여 한국 서버에서 API 테스트를 진행합니다.

## 📋 사전 준비

### 1. AWS EC2 인스턴스 생성

1. AWS 콘솔 접속
2. EC2 → 인스턴스 → 인스턴스 시작
3. 설정:
   - **AMI**: Ubuntu 22.04 LTS
   - **인스턴스 유형**: t3.micro (프리티어 가능)
   - **키 페어**: 새로 생성 또는 기존 키 사용
   - **보안 그룹**: 
     - SSH (22) - 내 IP
     - HTTP (80) - 모든 IP
     - HTTPS (443) - 모든 IP
     - Custom TCP (3001) - 모든 IP (백엔드 서버용)
   - **리전**: **ap-northeast-2 (서울)**

### 2. 로컬 환경 준비

```bash
# SSH 키 권한 설정
chmod 400 your-key.pem

# 배포 스크립트 실행 권한 부여
chmod +x backend/deploy.sh
chmod +x backend/aws-test.sh
```

## 🚀 배포 단계

### 1. 환경변수 설정

`backend/.env` 파일에 실제 Service Key 설정:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
CLIENT_OPENDATA_TOKEN=dev-client-token-12345

# 공공데이터 API 서비스키
ADMINISTRATIVE_CODE_SERVICE_KEY=hIa+wCHFe509oONiMuDy6bD0IYF4m1QksY1C5rxbFXg0pUnJVTFP1uu0fFnCapwq6BlOu7Xcl+bQV65QebkWKA==
HIRA_SERVICE_KEY=hIa+wCHFe509oONiMuDy6bD0IYF4m1QksY1C5rxbFXg0pUnJVTFP1uu0fFnCapwq6BlOu7Xcl+bQV65QebkWKA==
HIRA_PRICING_SERVICE_KEY=hIa+wCHFe509oONiMuDy6bD0IYF4m1QksY1C5rxbFXg0pUnJVTFP1uu0fFnCapwq6BlOu7Xcl+bQV65QebkWKA==
```

### 2. 배포 실행

```bash
cd backend
./deploy.sh YOUR_EC2_IP ~/path/to/your-key.pem
```

또는 수동으로:

```bash
# 1. EC2 서버 접속
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# 2. Node.js 설치 (처음만)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. PM2 설치
sudo npm install -g pm2

# 4. 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/nonvovered
sudo chown -R ubuntu:ubuntu /var/www/nonvovered
cd /var/www/nonvovered

# 5. 프로젝트 클론 또는 파일 업로드
# (로컬에서 rsync 또는 scp 사용)

# 6. 의존성 설치
cd backend
npm install --production

# 7. .env 파일 생성 및 설정
nano .env
# (위의 환경변수 내용 입력)

# 8. 서버 시작
pm2 start src/server.js --name nonvovered-backend
pm2 save
pm2 startup
```

### 3. 서버 확인

```bash
# Health Check
curl http://YOUR_EC2_IP:3001/health

# API 테스트
curl -H "X-Client-Token: dev-client-token-12345" \
  http://YOUR_EC2_IP:3001/opendata/regions
```

## 🧪 API 테스트

### 로컬에서 원격 테스트

```bash
cd backend
./aws-test.sh YOUR_EC2_IP ~/path/to/your-key.pem
```

### EC2 서버에서 직접 테스트

```bash
# EC2 서버 접속
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# 프로젝트 디렉토리로 이동
cd /var/www/nonvovered/backend

# 환경변수 로드
export $(cat .env | grep -v '^#' | xargs)

# 테스트 실행
npm run test:api
```

## 🔍 문제 해결

### 1. SSH 연결 실패
```bash
# 키 권한 확인
chmod 400 your-key.pem

# 보안 그룹에서 SSH 포트(22) 확인
```

### 2. 포트 접근 불가
```bash
# 보안 그룹에서 3001 포트 추가
# EC2 → 보안 그룹 → 인바운드 규칙 → 규칙 추가
# - 유형: 사용자 지정 TCP
# - 포트: 3001
# - 소스: 0.0.0.0/0 (또는 특정 IP)
```

### 3. PM2 서버가 시작되지 않음
```bash
# PM2 로그 확인
pm2 logs nonvovered-backend

# 서버 수동 실행 (디버깅)
cd /var/www/nonvovered/backend
node src/server.js
```

### 4. API 호출 실패
```bash
# EC2 서버에서 직접 API 호출 테스트
curl "https://apis.data.go.kr/B552584/AdministrativeCodeService/getAdministrativeCode?serviceKey=YOUR_SERVICE_KEY&pageNo=1&numOfRows=10"

# 네트워크 연결 확인
ping apis.data.go.kr
```

## 📊 모니터링

### PM2 모니터링

```bash
# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs nonvovered-backend

# 리소스 사용량 확인
pm2 monit
```

### 서버 로그 확인

```bash
# 실시간 로그
tail -f /var/www/nonvovered/backend/logs/*.log

# 또는 PM2 로그
pm2 logs nonvovered-backend --lines 100
```

## 🔄 업데이트 배포

코드 변경 후 재배포:

```bash
cd backend
./deploy.sh YOUR_EC2_IP ~/path/to/your-key.pem
```

또는 수동으로:

```bash
# EC2 서버 접속
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd /var/www/nonvovered/backend

# 코드 업데이트 (git pull 또는 파일 업로드)
git pull  # 또는 rsync/scp

# 의존성 업데이트
npm install --production

# 서버 재시작
pm2 restart nonvovered-backend
```

## ✅ 배포 확인 체크리스트

- [ ] EC2 인스턴스 생성 (ap-northeast-2)
- [ ] 보안 그룹 설정 (22, 80, 443, 3001)
- [ ] Node.js 20 설치
- [ ] PM2 설치
- [ ] 프로젝트 파일 업로드
- [ ] .env 파일 설정 (Service Key 포함)
- [ ] 의존성 설치
- [ ] PM2로 서버 시작
- [ ] Health Check 통과
- [ ] API 테스트 통과

## 📝 다음 단계

1. 실제 API 엔드포인트 확인 및 수정
2. API 응답 형식에 맞게 데이터 변환 로직 조정
3. 프론트엔드에서 EC2 백엔드 연결 테스트
4. 프로덕션 배포 준비

