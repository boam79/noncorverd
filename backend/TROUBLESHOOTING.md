# 🔧 502 Bad Gateway 에러 해결 가이드

## 문제 증상
- Vercel에서 `/api/opendata/regions` 호출 시 502 Bad Gateway 에러
- Execution Duration: 13ms (연결 즉시 거부)
- External APIs: `GET 54.180.251.93/opendata/regions`

## 원인 분석
13ms만에 실패 = 연결이 즉시 거부됨
- 백엔드 서버가 다운되었거나
- 포트 3000이 닫혀있거나
- EC2 보안 그룹에서 Vercel IP 미허용

## 해결 방법

### 1️⃣ EC2 서버 접속
```bash
ssh -i boam79-aws-key.pem ubuntu@54.180.251.93
```

### 2️⃣ PM2 상태 확인
```bash
pm2 status
```
**예상 결과:**
- ✅ `online` - 정상 작동
- ❌ `stopped` - 서버 중지됨 → 재시작 필요
- ❌ `errored` - 에러 발생 → 로그 확인 후 재시작

### 3️⃣ 서버 로그 확인
```bash
pm2 logs nonvovered-backend --lines 50
```
최근 에러 메시지를 확인하여 원인 파악

### 4️⃣ 포트 3000 확인
```bash
sudo netstat -tlnp | grep 3000
```
**예상 결과:**
```
tcp6       0      0 :::3000                 :::*                    LISTEN      12345/node
```
- `LISTEN` 상태여야 정상
- 없으면 서버가 실행되지 않은 것

### 5️⃣ 방화벽 확인
```bash
sudo ufw status
```
**예상 결과:**
```
Status: active

To                         Action      From
--                         ------      ----
3000/tcp                   ALLOW       Anywhere
```
- 포트 3000이 `ALLOW`여야 함
- 없으면: `sudo ufw allow 3000`

### 6️⃣ Health Check (서버 내부)
```bash
curl http://localhost:3000/health
```
**예상 결과:**
```json
{"status":"ok","timestamp":"2025-01-13T..."}
```
- 정상 응답이 나와야 함
- 실패하면 서버 설정 문제

### 7️⃣ 서버 재시작 (필요시)
```bash
# 서버 재시작
pm2 restart nonvovered-backend

# 재시작 후 상태 확인
pm2 status

# PM2 설정 저장
pm2 save
```

### 8️⃣ 외부 접근 테스트 (로컬에서)
```bash
curl -v http://54.180.251.93:3000/health
```
- 연결이 성공하면 정상
- `Connection refused`면 보안 그룹 또는 방화벽 문제

## 보안 그룹 확인 (AWS Console)
1. EC2 Console → Security Groups
2. `sg-0a752260e811277f8` 선택
3. Inbound Rules 확인:
   - 포트 3000: `0.0.0.0/0` (모든 IP 허용) ✅
   - 없으면 추가 필요

## Vercel 환경변수 확인
Vercel Dashboard → Settings → Environment Variables:
```
CLIENT_OPENDATA_TOKEN=dev-client-token-12345
BACKEND_URL=http://54.180.251.93:3000 (선택사항)
```

## 체크리스트
- [ ] PM2 상태: `online`
- [ ] 포트 3000: `LISTEN` 상태
- [ ] 방화벽: 포트 3000 `ALLOW`
- [ ] Health Check: 정상 응답
- [ ] 보안 그룹: 포트 3000 허용
- [ ] Vercel 환경변수: 설정 완료

## 추가 디버깅
### Vercel Functions 로그 확인
1. Vercel Dashboard → Functions → `/api/opendata/[...path]` → Logs
2. `[API Proxy] GET Request` 로그 확인
3. 에러 메시지 확인:
   - `CONNECTION_ERROR`: 백엔드 서버 연결 실패
   - `TIMEOUT_ERROR`: 타임아웃
   - `ECONNREFUSED`: 연결 거부

