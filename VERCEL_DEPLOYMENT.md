# Vercel 배포 가이드

## 🚀 빠른 시작

### 1. Vercel CLI 설치 및 로그인

```bash
npm i -g vercel
vercel login
```

### 2. 프로젝트 배포

```bash
# 프로젝트 루트에서 실행
vercel

# 프로덕션 배포
vercel --prod
```

## 📋 수동 배포 (Vercel Dashboard)

### 1. 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "Add New Project" 클릭
3. GitHub 저장소 연결 또는 직접 업로드
   - 저장소: `your-username/nonvovered`
   - Framework Preset: **Next.js** (자동 감지)
   - Root Directory: `./` (기본값)

### 2. 빌드 설정

Vercel은 Next.js를 자동으로 감지하므로 추가 설정이 필요 없습니다.

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (자동)
- **Output Directory**: `.next` (자동)
- **Install Command**: `npm install` (자동)

### 3. 환경변수 설정

Vercel Dashboard → Project Settings → Environment Variables에서 다음 변수 설정:

#### Production 환경변수

**옵션 1: API 프록시 사용 (권장, Mixed Content 에러 방지)**
```
BACKEND_URL=http://54.180.251.93:3000
CLIENT_OPENDATA_TOKEN=dev-client-token-12345
또는
NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN=dev-client-token-12345
```
- `BACKEND_URL`: 백엔드 서버 URL (선택사항, 기본값: `http://54.180.251.93:3000`)
- `CLIENT_OPENDATA_TOKEN` 또는 `NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN`: 인증 토큰
- `NEXT_PUBLIC_API_BASE_URL`은 설정하지 않음 (자동으로 `/api/opendata` 프록시 사용)
- `app/api/opendata/[...path]/route.ts`가 서버사이드에서 백엔드로 프록시

**옵션 2: 직접 연결 (백엔드가 HTTPS인 경우)**
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com/opendata
NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN=dev-client-token-12345
```

#### Preview 환경변수 (선택)

```
NEXT_PUBLIC_API_BASE_URL=http://54.180.251.93:3000/opendata
NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN=dev-client-token-12345
```

#### Development 환경변수 (선택)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/opendata
NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN=dev-client-token-12345
```

### 4. 배포 실행

1. "Deploy" 버튼 클릭
2. 배포 완료 대기 (약 2-3분)
3. Production URL 확인

## 🔧 고급 설정

### 커스텀 도메인 연결

1. Vercel Dashboard → Project Settings → Domains
2. 도메인 추가
3. DNS 설정 안내에 따라 DNS 레코드 추가

### 환경별 설정

- **Production**: 자동으로 `main` 브랜치에 배포
- **Preview**: 다른 브랜치에 Push 시 자동 배포
- **Development**: 로컬에서 `vercel dev` 실행

### 빌드 최적화

`next.config.ts`에서 이미 최적화 설정이 완료되어 있습니다:

- ✅ 이미지 최적화 (AVIF, WebP)
- ✅ 압축 활성화
- ✅ 프로덕션 콘솔 제거
- ✅ 타입 안전 환경변수

## 📊 모니터링

### Vercel Analytics

1. Vercel Dashboard → Project Settings → Analytics
2. "Enable Analytics" 활성화
3. 대시보드에서 실시간 통계 확인

### 에러 추적 (Sentry)

```bash
# Sentry 설치
npm install @sentry/nextjs

# Sentry 설정
npx @sentry/wizard@latest -i nextjs
```

환경변수 추가:
```
SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-auth-token
```

## 🔍 배포 확인

### 1. Health Check

배포 후 다음 URL에서 확인:
- Production URL: `https://your-project.vercel.app`
- Health Check: `https://your-project.vercel.app/api/health` (없을 수 있음)

### 2. 기능 테스트

- ✅ 지역 선택 (시도 → 시군구)
- ✅ 병원 검색
- ✅ 병원 비교 기능
- ✅ 가격 테이블 표시

### 3. 성능 확인

- Lighthouse 점수 확인 (목표: 80점 이상)
- Vercel Analytics에서 성능 메트릭 확인

## 🐛 트러블슈팅

### 빌드 실패

1. **Node.js 버전 확인**
   - Vercel은 자동으로 Node.js 20.x 사용
   - `package.json`에 `engines` 필드 추가 가능

2. **의존성 오류**
   ```bash
   # 로컬에서 빌드 테스트
   npm run build
   ```

3. **환경변수 누락**
   - Vercel Dashboard에서 환경변수 확인
   - `NEXT_PUBLIC_` 접두사 확인

### API 연결 실패

1. **CORS 오류**
   - 백엔드 CORS 설정 확인
   - `FRONTEND_URL`에 Vercel URL 추가

2. **네트워크 오류**
   - `NEXT_PUBLIC_API_BASE_URL` 확인
   - 백엔드 서버 상태 확인

### 성능 이슈

1. **이미지 최적화**
   - Next.js Image 컴포넌트 사용
   - 이미지 크기 최적화

2. **번들 크기**
   - `npm run build` 후 번들 분석
   - 불필요한 의존성 제거

## 📝 체크리스트

배포 전 확인사항:

- [ ] 환경변수 설정 완료
- [ ] 로컬 빌드 성공 (`npm run build`)
- [ ] TypeScript 오류 없음
- [ ] ESLint 경고 해결
- [ ] 백엔드 서버 정상 작동
- [ ] CORS 설정 확인

배포 후 확인사항:

- [ ] Production URL 접속 가능
- [ ] 지역 선택 기능 정상
- [ ] 병원 검색 기능 정상
- [ ] 비교 기능 정상
- [ ] 모바일 반응형 확인
- [ ] Lighthouse 점수 확인

## 🔗 참고 링크

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [환경변수 관리](https://vercel.com/docs/concepts/projects/environment-variables)

