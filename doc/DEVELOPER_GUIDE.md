# 개발자 가이드

## 프로젝트 구조

```
nonvovered/
├── app/                      # Next.js App Router
│   ├── page.tsx             # 메인 페이지
│   ├── comparison/          # 비교 페이지
│   ├── api/                 # API Routes (프록시)
│   └── layout.tsx           # 루트 레이아웃
├── components/              # React 컴포넌트
│   ├── Layout/              # Header, Footer, Container
│   ├── RegionSelector/      # 지역 선택 컴포넌트
│   ├── InstitutionFilter/   # 의료기관 필터
│   ├── HospitalCard/        # 병원 카드
│   ├── CompareBar/          # 비교 바 (Floating)
│   └── ComparisonTable/     # 비교 테이블
├── lib/                     # 유틸리티
│   ├── api.ts               # API 클라이언트
│   ├── hooks/               # React Query hooks
│   │   ├── useRegions.ts    # 지역 데이터 fetching
│   │   ├── useHospitals.ts  # 병원 목록 fetching
│   │   └── usePricing.ts    # 비급여 가격 fetching
│   ├── stores/              # Zustand stores
│   │   └── comparisonStore.ts # 비교 상태 관리
│   └── providers/           # Context providers
│       └── QueryProvider.tsx # React Query Provider
├── types/                    # TypeScript 타입 정의
│   └── index.ts             # 공통 타입
├── e2e/                      # E2E 테스트 (Playwright)
│   └── hospital-comparison.spec.ts
├── scripts/                  # 유틸리티 스크립트
│   ├── performance-test.js   # 성능 측정
│   └── check-sigungu.js     # 시군구 검증
└── backend/                  # Express.js 서버
    ├── src/
    │   ├── routes/           # API 라우트
    │   │   └── opendata.js   # 공공데이터 API 게이트웨이
    │   ├── adapters/         # 공공데이터 API 어댑터
    │   │   ├── baseAdapter.js      # 기본 어댑터
    │   │   ├── regionsAdapter.js   # 지역 정보
    │   │   ├── hospitalsAdapter.js # 병원 정보
    │   │   └── pricingAdapter.js   # 비급여 가격
    │   ├── middleware/       # Express 미들웨어
    │   │   ├── auth.js       # 인증 (X-Client-Token)
    │   │   ├── cors.js       # CORS 설정
    │   │   └── errorHandler.js # 에러 핸들링
    │   └── server.js         # Express 서버
    └── scripts/              # 백엔드 테스트 스크립트
        ├── test-pricing-api.js
        └── test-pricing-integration.js
```

## 개발 환경 설정

### 1. 의존성 설치

```bash
# 프론트엔드
npm install

# 백엔드
cd backend
npm install
```

### 2. 환경변수 설정

#### 프론트엔드 (`.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/opendata
NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN=dev-client-token-12345
```

#### 백엔드 (`backend/.env`)

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
CLIENT_OPENDATA_TOKEN=dev-client-token-12345

# 공공데이터 API 서비스키 (단일 키 사용)
api_key=your-service-key-here
```

### 3. 개발 서버 실행

```bash
# 프론트엔드 (터미널 1)
npm run dev

# 백엔드 (터미널 2)
cd backend
npm run dev
```

## API 엔드포인트

### 백엔드 API (`/opendata`)

모든 요청은 `X-Client-Token` 헤더를 포함해야 합니다.

#### 지역 정보 조회
```
GET /opendata/regions?sido={sido}
```

**응답 형식:**
```json
{
  "ok": true,
  "data": [
    {
      "code": "11",
      "name": "서울특별시"
    }
  ]
}
```

#### 병원 목록 조회
```
GET /opendata/hospitals?sido={sido}&sigungu={sigungu}&type={type}
```

**파라미터:**
- `sido`: 시도 코드 (2자리, 예: "11")
- `sigungu`: 시군구 코드 (6자리, 예: "110000", 선택사항)
- `type`: 의료기관 종별 (예: "종합병원", 선택사항)

**응답 형식:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "hospital-id",
      "name": "병원명",
      "address": "주소",
      "type": "종합병원",
      "departments": ["내과", "외과"],
      "ykiho": "암호화된-요양기호"
    }
  ],
  "meta": {
    "total": 100
  }
}
```

#### 비급여 가격 조회
```
POST /opendata/pricing
Content-Type: application/json

{
  "hospitalIds": ["id1", "id2"]
}
```

**응답 형식:**
```json
{
  "ok": true,
  "data": [
    {
      "hospitalId": "id1",
      "hospitalName": "병원명",
      "items": [
        {
          "id": "item-id",
          "name": "항목명",
          "price": 100000,
          "unit": "회",
          "code": "item-code",
          "url": "상세-URL",
          "startDate": "20240101",
          "endDate": "99991231"
        }
      ],
      "averagePrice": 500000,
      "totalItems": 100
    }
  ]
}
```

## 데이터 흐름

### 1. 지역 선택 플로우

```
사용자 → RegionSelector
  → useRegions hook
    → lib/api.ts (getRegions)
      → /opendata/regions
        → regionsAdapter
          → 공공데이터 API
```

### 2. 병원 검색 플로우

```
사용자 → InstitutionFilter + RegionSelector
  → useHospitals hook
    → lib/api.ts (getHospitals)
      → /opendata/hospitals
        → hospitalsAdapter
          → 공공데이터 API
```

### 3. 비교 플로우

```
사용자 → HospitalCard (선택)
  → comparisonStore (Zustand)
    → CompareBar (Floating)
      → /comparison 페이지
        → usePricing hook
          → lib/api.ts (getPricing)
            → /opendata/pricing
              → pricingAdapter
                → 공공데이터 API
                  → ComparisonTable
```

## 상태 관리

### Zustand Store (`lib/stores/comparisonStore.ts`)

```typescript
interface ComparisonStore {
  selectedHospitals: Hospital[];
  addHospital: (hospital: Hospital) => void;
  removeHospital: (id: string) => void;
  clearHospitals: () => void;
}
```

- 로컬 스토리지에 자동 저장
- 최대 5개 병원 선택 제한

### React Query 캐싱

- **지역 데이터**: `staleTime: 24시간`, `gcTime: 48시간`
- **병원 목록**: `staleTime: 10분`, `gcTime: 30분`
- **비급여 가격**: `staleTime: 12시간`, `gcTime: 24시간`

## 테스트

### E2E 테스트 (Playwright)

```bash
# 모든 테스트 실행
npm run test:e2e

# UI 모드로 실행
npm run test:e2e:ui

# 헤드 모드로 실행
npm run test:e2e:headed

# 디버그 모드
npm run test:e2e:debug
```

### 백엔드 통합 테스트

```bash
cd backend
node scripts/test-pricing-integration.js --sido 11 --type 종합병원 --count 3
```

## 성능 최적화

### 프론트엔드
- React Query 캐싱으로 불필요한 API 호출 방지
- 비교 테이블 페이징 (초기 30개)
- 이미지 최적화 (Next.js Image)
- 코드 스플리팅 (자동)

### 백엔드
- In-memory 캐싱 (12시간 TTL)
- 페이지네이션으로 대용량 데이터 처리
- 에러 핸들링 및 타임아웃 설정

## 배포

### Vercel (Frontend)
- GitHub 연동 시 자동 배포
- 환경변수는 Vercel Dashboard에서 설정

### AWS EC2 (Backend)
- PM2로 프로세스 관리
- `ecosystem.config.cjs`로 환경변수 관리
- GitHub Actions로 자동 배포 가능

## 트러블슈팅

### API 호출 실패
1. 환경변수 확인 (`api_key` 설정 여부)
2. 네트워크 연결 확인
3. 백엔드 서버 실행 상태 확인

### 빌드 오류
1. Node.js 버전 확인 (20 LTS)
2. 의존성 재설치: `rm -rf node_modules && npm install`
3. TypeScript 오류 확인: `npm run lint`

### E2E 테스트 실패
1. 개발 서버 실행 확인
2. 브라우저 설치 확인: `npx playwright install`
3. 타임아웃 증가 (테스트 파일에서 `timeout` 옵션 조정)

---

더 자세한 정보는 각 파일의 주석을 참고하세요.

