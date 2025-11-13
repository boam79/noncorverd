# 프론트엔드-백엔드 연결 테스트 가이드

## 환경변수 설정

### `.env.local` 파일 생성
```bash
# AWS Backend API
NEXT_PUBLIC_API_BASE_URL=http://54.180.251.93:3000/opendata
CLIENT_OPENDATA_TOKEN=dev-client-token-12345
```

## 테스트 시나리오

### 1. Health Check 테스트
```bash
# 백엔드 Health Check
curl http://54.180.251.93:3000/health

# 예상 응답
{"status":"ok","timestamp":"2025-11-13T..."}
```

### 2. 지역 정보 API 테스트
```bash
# 시도 목록 조회
curl -H 'X-Client-Token: dev-client-token-12345' \
  http://54.180.251.93:3000/opendata/regions

# 시군구 목록 조회 (서울)
curl -H 'X-Client-Token: dev-client-token-12345' \
  http://54.180.251.93:3000/opendata/regions?sido=11
```

### 3. 병원 정보 API 테스트
```bash
# 서울 종로구 병원 조회
curl -H 'X-Client-Token: dev-client-token-12345' \
  "http://54.180.251.93:3000/opendata/hospitals?sido=11&sigungu=110&type=종합병원"
```

### 4. 프론트엔드에서 테스트

1. **프론트엔드 서버 시작**
   ```bash
   npm run dev
   ```

2. **브라우저에서 확인**
   - http://localhost:3000 접속
   - 개발자 도구 → Network 탭 확인
   - 지역 선택 시 API 호출 확인

3. **예상 동작**
   - 지역 선택 드롭다운 클릭 → 시도 목록 로드
   - 시도 선택 → 시군구 목록 로드
   - 시군구 선택 → 병원 목록 로드

## 문제 해결

### CORS 에러
백엔드 `server.js`에서 CORS 설정 확인:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

### 연결 타임아웃
- 보안 그룹 포트 3000 확인
- EC2 인스턴스 방화벽 확인
- 네트워크 연결 확인

### 401 Unauthorized
- `X-Client-Token` 헤더 확인
- 백엔드 `.env`의 `CLIENT_OPENDATA_TOKEN` 확인

## 다음 단계

1. ✅ 환경변수 설정 완료
2. ⏳ 프론트엔드 서버 시작 및 테스트
3. ⏳ 실제 API 연동 확인
4. ⏳ Mock 데이터 → 실제 데이터 전환

