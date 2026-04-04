# 🚀 배포 가이드

## Frontend 배포 (Vercel)

### 1. Vercel 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소(`boam79/noncorverd`) 연결

### 2. 환경변수 설정

Vercel Dashboard → Project Settings → Environment Variables에서 다음 변수 설정:

```
NEXT_PUBLIC_API_BASE_URL=https://noncorverd-backend.onrender.com/opendata
NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN=your-client-token-here
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

---

## Backend 배포 (Render)

### 1. Render Blueprint 배포 (권장)

저장소 루트에 `render.yaml`이 포함되어 있습니다.

1. [Render Dashboard](https://dashboard.render.com/blueprint/new?repo=https://github.com/boam79/noncorverd) 접속
2. GitHub OAuth 인증
3. 서비스 구성 확인 후 **"Apply"** 클릭
4. Dashboard에서 아래 환경변수를 직접 입력 (`sync: false` 항목):
   - `CLIENT_OPENDATA_TOKEN`
   - `api_key`
   - `ADMINISTRATIVE_CODE_SERVICE_KEY`
   - `HIRA_SERVICE_KEY`
   - `HIRA_PRICING_SERVICE_KEY`

### 2. 배포 후 확인

```bash
# Health Check
curl https://noncorverd-backend.onrender.com/health

# CORS 검증
curl -I -H "Origin: https://noncorverd.vercel.app" \
     -H "X-Client-Token: your-token" \
     "https://noncorverd-backend.onrender.com/opendata/regions"
```

### 3. Render 환경변수 정리

| 변수 | 값 | 비고 |
|------|----|------|
| `NODE_ENV` | `production` | 자동 설정 |
| `PORT` | `10000` | Render 기본 포트 |
| `CLIENT_OPENDATA_TOKEN` | (비밀) | Dashboard에서 입력 |
| `api_key` | (비밀) | 공공데이터 서비스키 |
| `CORS_ORIGINS` | `https://noncorverd.vercel.app` | 자동 설정 |
| `ADMINISTRATIVE_CODE_SERVICE_KEY` | (비밀) | `api_key` fallback 가능 |
| `HIRA_SERVICE_KEY` | (비밀) | `api_key` fallback 가능 |
| `HIRA_PRICING_SERVICE_KEY` | (비밀) | `api_key` fallback 가능 |

---

## 환경변수 체크리스트

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_BASE_URL` → `https://noncorverd-backend.onrender.com/opendata`
- [ ] `NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN`
- [ ] `SENTRY_DSN` (선택)
- [ ] `NEXT_PUBLIC_ANALYTICS_ID` (선택)

### Backend (Render)
- [ ] `PORT` → `10000`
- [ ] `CLIENT_OPENDATA_TOKEN`
- [ ] `api_key`
- [ ] `CORS_ORIGINS` → `https://noncorverd.vercel.app`
- [ ] `ADMINISTRATIVE_CODE_SERVICE_KEY`
- [ ] `HIRA_SERVICE_KEY`
- [ ] `HIRA_PRICING_SERVICE_KEY`

---

## 모니터링

### Render 로그 확인

Render Dashboard → 서비스 선택 → **Logs** 탭에서 실시간 로그 확인 가능합니다.

### Sentry (선택)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## 배포 후 검증

1. **Health Check**: `GET https://noncorverd-backend.onrender.com/health`
2. **API 연결**: 프론트엔드에서 백엔드 API 호출 테스트
3. **기능 테스트**:
   - 지역 선택
   - 병원 검색
   - 비교 기능
4. **성능 테스트**: Lighthouse 점수 확인 (목표: 80점 이상)

---

## 트러블슈팅

### 백엔드 연결 실패
- Render Dashboard에서 서비스 상태 확인 (Free 플랜은 15분 비활성 시 슬립)
- 환경변수 `NEXT_PUBLIC_API_BASE_URL` 확인
- CORS 설정(`CORS_ORIGINS`) 확인

### 빌드 실패
- `render.yaml`의 `rootDir: backend` 설정 확인
- Node.js 버전 확인 (20 LTS)
- `npm ci` 의존성 설치 확인

### Render Free 플랜 슬립 이슈
- Free 플랜은 15분 비활성 후 슬립 → 첫 요청 시 50초 내외 지연 발생 가능
- 해결책: Render 유료 플랜(Starter) 업그레이드 또는 외부 Health Check 핑 서비스 연동
