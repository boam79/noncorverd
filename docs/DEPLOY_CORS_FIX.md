# CORS 설정 수정 및 배포 가이드

## 문제 상황
Vercel 배포 사이트(`https://noncorverd.vercel.app`)에서 백엔드 API(`http://54.180.251.93:3000`) 호출 시 CORS 오류 발생.

## 수정 내용

### 1. `backend/src/server.js` CORS 설정 개선
- 여러 Origin 허용 지원 (`CORS_ORIGINS` 환경변수)
- `URL.origin` 기반 정규화된 검증

### 2. 환경변수 추가
- `backend/.env`: `CORS_ORIGINS=http://localhost:3000,https://noncorverd.vercel.app`
- `backend/ecosystem.config.cjs`: PM2 환경변수에 `CORS_ORIGINS` 추가

## EC2 배포 절차

### 방법 1: 배포 스크립트 사용 (권장)
```bash
cd backend
./deploy-to-ec2.sh
```

### 방법 2: 수동 배포
```bash
# 1. EC2 서버 접속
ssh -i <SSH_KEY> ubuntu@54.180.251.93

# 2. 프로젝트 디렉토리로 이동
cd /var/www/nonvovered/backend

# 3. 코드 업데이트 (git pull 또는 파일 업로드)
git pull  # 또는 rsync/scp로 파일 전송

# 4. .env 파일에 CORS_ORIGINS 추가
echo "CORS_ORIGINS=http://localhost:3000,https://noncorverd.vercel.app" >> .env

# 5. PM2 재시작
pm2 restart nonvovered-backend --update-env

# 6. 상태 확인
pm2 status
pm2 logs nonvovered-backend --lines 50
```

### 방법 3: ecosystem.config.cjs 사용
```bash
# EC2 서버에서
cd /var/www/nonvovered/backend
pm2 delete nonvovered-backend
pm2 start ecosystem.config.cjs
pm2 save
```

## 배포 후 검증

### 1. CORS 헤더 확인
```bash
curl -I -H "Origin: https://noncorverd.vercel.app" \
     -H "X-Client-Token: dev-client-token-12345" \
     "http://54.180.251.93:3000/opendata/regions"
```

**예상 응답:**
```
Access-Control-Allow-Origin: https://noncorverd.vercel.app
Access-Control-Allow-Credentials: true
```

### 2. Vercel 사이트에서 테스트
1. 브라우저에서 `https://noncorverd.vercel.app` 접속
2. 개발자 도구 → Network 탭 열기
3. 시도 선택 시 API 호출 확인
4. CORS 오류 없이 데이터 로딩 확인

### 3. Playwright E2E 재실행
```bash
PLAYWRIGHT_BASE_URL=https://noncorverd.vercel.app npm run test:e2e
```

## 롤백 방법
문제 발생 시 이전 설정으로 복구:
```bash
# EC2 서버에서
cd /var/www/nonvovered/backend
git checkout HEAD~1 src/server.js  # 또는 수동으로 이전 코드 복원
pm2 restart nonvovered-backend
```

## 참고
- CORS 설정은 보안에 영향을 주므로 프로덕션 배포 전 반드시 검증 필요
- 추가 도메인 허용 시 `CORS_ORIGINS`에 쉼표로 구분하여 추가

