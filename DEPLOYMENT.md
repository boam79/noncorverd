# 🚀 배포 가이드

## Frontend 배포 (Vercel)

### 1. Vercel 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 연결 또는 직접 업로드

### 2. 환경변수 설정

Vercel Dashboard → Project Settings → Environment Variables에서 다음 변수 설정:

```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com/opendata
CLIENT_OPENDATA_TOKEN=your-client-token-here
```

### 3. 빌드 설정

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Install Command**: `npm install` (기본값)

### 4. 배포 확인

배포 후 Production URL에서 접속 테스트:
- 지역 선택 기능
- 병원 검색 기능
- 비교 기능

## Backend 배포 (AWS EC2)

### 1. EC2 인스턴스 준비

- **Instance Type**: t3.micro
- **OS**: Ubuntu 22.04 LTS
- **Region**: ap-northeast-2 (서울)
- **Security Group**: 
  - 22 (SSH) - 제한된 IP
  - 80 (HTTP) - 모든 IP
  - 443 (HTTPS) - 모든 IP (선택)

### 2. 서버 초기 설정

```bash
# 서버 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# Node.js 설치 (Node.js 20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 설치 (프로세스 관리)
sudo npm install -g pm2

# Nginx 설치 (리버스 프록시, 선택)
sudo apt-get update
sudo apt-get install -y nginx
```

### 3. 프로젝트 배포

```bash
# 프로젝트 디렉토리 생성
cd /var/www
sudo mkdir -p nonvovered
sudo chown ubuntu:ubuntu nonvovered
cd nonvovered

# Git 클론 또는 파일 업로드
git clone your-repo-url backend
cd backend

# 의존성 설치
npm install --production

# 환경변수 설정
nano .env
# .env 파일에 필요한 변수 입력 후 저장

# PM2로 서버 실행
pm2 start src/server.js --name nonvovered-backend
pm2 save
pm2 startup
```

### 4. Nginx 설정 (선택)

```bash
sudo nano /etc/nginx/sites-available/nonvovered
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nonvovered /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL 인증서 설정 (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 환경변수 체크리스트

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_BASE_URL`
- [ ] `CLIENT_OPENDATA_TOKEN`
- [ ] `SENTRY_DSN` (선택)
- [ ] `NEXT_PUBLIC_ANALYTICS_ID` (선택)

### Backend (AWS EC2)
- [ ] `PORT` (기본값: 3001)
- [ ] `FRONTEND_URL`
- [ ] `CLIENT_OPENDATA_TOKEN`
- [ ] `ADMINISTRATIVE_CODE_SERVICE_KEY`
- [ ] `HIRA_SERVICE_KEY`
- [ ] `HIRA_PRICING_SERVICE_KEY`

## 모니터링 설정

### CloudWatch (AWS)

EC2 인스턴스의 CloudWatch 에이전트를 설정하여 로그를 수집합니다.

### Sentry (선택)

프론트엔드와 백엔드에 Sentry를 설정하여 에러 추적:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## 배포 후 검증

1. **Health Check**: `GET /health` 엔드포인트 확인
2. **API 연결**: 프론트엔드에서 백엔드 API 호출 테스트
3. **기능 테스트**: 
   - 지역 선택
   - 병원 검색
   - 비교 기능
4. **성능 테스트**: Lighthouse 점수 확인 (목표: 80점 이상)

## 트러블슈팅

### 백엔드 연결 실패
- Security Group에서 포트 확인
- 환경변수 `NEXT_PUBLIC_API_BASE_URL` 확인
- CORS 설정 확인

### 빌드 실패
- Node.js 버전 확인 (20 LTS)
- 의존성 설치 확인
- TypeScript 오류 확인

