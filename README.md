# 🏥 의료기관 비급여 비교 서비스

전국 병원 비급여 수가 검색·비교 웹서비스

## 📋 프로젝트 개요

공공데이터포털 API를 활용하여 전국 의료기관의 비급여 진료비 정보를 검색하고 비교할 수 있는 서비스입니다.

### 주요 기능

- ✅ 지역별 병원 검색 (시도 → 시군구)
- ✅ 의료기관명 검색 (병원명으로 직접 검색 가능)
- ✅ 의료기관 종별 필터링 (종합병원, 병원, 의원, 요양병원, 치과, 한의원)
- ✅ 병원 선택 및 비교 (최대 5개)
- ✅ 비급여 가격 비교 테이블
- ✅ 모바일 최적화 UI (2열 그리드, 스와이프 비교 뷰)
- ✅ 메인 타이틀 클릭 시 초기화 및 홈 이동
- ✅ API 호출 최적화 (캐싱, 페이지네이션 최적화)

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 15.5 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)

### Backend (Vercel API Routes)
- **Runtime**: Node.js (Vercel Serverless Functions)
- **Region**: 인천(icn1) — 한국 공공데이터 API 직접 호출
- **API Gateway**: `app/api/opendata/` (Next.js Route Handlers)
- **Authentication**: X-Client-Token
- **Render** (보조·선택): Express 게이트웨이. 운영 기본 경로는 Vercel `app/api/opendata` 직접 호출입니다.

### Infrastructure
- **권장 운영 경로**: Vercel Next.js(인천 icn1)가 `OPENDATA_API_KEY`로 공공데이터를 직접 조회합니다.
- **Frontend + API**: Vercel (인천 icn1 리전)
- **Backend (선택)**: Render 등 별도 Express — `NEXT_PUBLIC_API_BASE_URL`로만 사용할 때 로컬·스테이징용
- **선택 기능**: Upstash Redis(`UPSTASH_*`) 설정 시 API Route에서 IP 기준 분당 요청 제한, `METRICS_SECRET` 설정 시 `GET /api/health/metrics`로 인메모리 호출 집계 조회

## 🚀 시작하기

### 사전 요구사항

- Node.js 20 LTS 이상
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

### 백엔드 서버 실행

```bash
cd backend
npm install
npm run dev
```

백엔드는 `http://localhost:3001`에서 실행됩니다.

## 📁 프로젝트 구조

```
nonvovered/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 메인 페이지
│   ├── comparison/        # 비교 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/            # React 컴포넌트
│   ├── Layout/           # 레이아웃 컴포넌트
│   ├── RegionSelector/   # 지역 선택
│   ├── InstitutionFilter/# 의료기관 필터
│   ├── HospitalCard/     # 병원 카드
│   ├── CompareBar/       # 비교 바
│   └── ComparisonTable/  # 비교 테이블
├── lib/                   # 유틸리티
│   ├── api.ts            # API 클라이언트
│   ├── hooks/            # React Query hooks
│   ├── stores/           # Zustand stores
│   └── providers/        # Context providers
├── types/                 # TypeScript 타입 정의
└── backend/              # Express.js 서버
    ├── src/
    │   ├── routes/       # API 라우트
    │   ├── adapters/     # 공공데이터 API 어댑터
    │   └── middleware/   # 미들웨어
```

## 🔐 환경변수 설정

### Frontend / Vercel API Routes (`.env.local`)

```env
# 공공데이터 API 서비스키 (서버 사이드 전용, NEXT_PUBLIC_ 불필요)
OPENDATA_API_KEY=your-public-data-service-key

# 클라이언트 인증 토큰
NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN=dev-client-token-12345
CLIENT_OPENDATA_TOKEN=dev-client-token-12345
```

> **참고**: `NEXT_PUBLIC_API_BASE_URL`은 Vercel 배포 시 `/api/opendata`로 자동 라우팅되어 불필요합니다.

## 📡 API 엔드포인트

### Vercel API Routes (`app/api/opendata/`)

모든 요청은 `X-Client-Token` 헤더를 포함해야 합니다. 브라우저 번들에 클라이언트 토큰이 포함되므로, 운영에서는 Upstash 기반 요청 제한 등으로 남용을 줄이는 것을 권장합니다.

- `GET /api/opendata/regions?sido={sido}` — 지역 정보 조회 (시도/시군구)
- `GET /api/opendata/hospitals?sido={sido}&sigungu={sigungu}&type={type}&hospitalName={name}` — 병원 목록 조회
  - `sido`: 행정안전부 시도 코드 (2자리, 예: 11=서울, 26=부산)
  - `sigungu`: 행정안전부 시군구 코드 (6자리, 예: 111100=서울 종로구)
  - `type`: 의료기관 종별, 쉼표 구분 다중 선택 가능 (종합병원, 병원, 의원, 요양병원, 치과, 한의원)
  - `hospitalName`: 병원명 부분 검색
- `POST /api/opendata/pricing` — 비급여 가격 정보 조회
  ```json
  {
    "hospitalIds": ["id1", "id2"],
    "hospitals": [{"id": "id1", "name": "병원명"}]
  }
  ```

## 🧪 테스트

```bash
# 린트 검사
npm run lint

# 빌드 테스트
npm run build

# 단위 테스트 (Vitest)
npm run test:unit

# E2E 테스트
npm run test:e2e

# E2E 테스트 (UI 모드)
npm run test:e2e:ui

# E2E 테스트 (헤드 모드)
npm run test:e2e:headed
```

## 📦 배포

### Vercel 배포 (Frontend + API)

1. GitHub 저장소 연결 후 자동 배포
2. 필수 환경변수 설정 (Vercel Dashboard):
   - `OPENDATA_API_KEY`: 공공데이터포털 서비스키
   - `NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN`: 클라이언트 인증 토큰
3. 선택: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`(분당 요청 제한), `METRICS_SECRET` + 조회 시 헤더 `x-metrics-secret`
4. `vercel.json`에 `"regions": ["icn1"]` 설정으로 인천 리전 사용

### Render 배포 (백엔드 보조 서버)

저장소 루트의 `render.yaml`을 통해 Blueprint 배포:

[Render Blueprint 배포 링크](https://dashboard.render.com/blueprint/new?repo=https://github.com/boam79/noncorverd)

## 📊 공공데이터 API

이 프로젝트는 다음 공공데이터 API를 사용합니다:

- 행정안전부_행정표준코드_법정동코드
- 건강보험심사평가원_병원정보서비스
- 건강보험심사평가원_비급여진료비정보조회서비스
- 건강보험심사평가원_의료기관별상세정보서비스

자세한 내용은 [`doc/의료기관_비급여비교_PDR_v1.2.md`](./doc/의료기관_비급여비교_PDR_v1.2.md)를 참고하세요.

## 🤝 기여

이 프로젝트는 MVP 단계입니다. 버그 리포트 및 기능 제안은 이슈로 등록해주세요.

## 📚 추가 문서

모든 문서는 [`doc/`](./doc/) 폴더에 있습니다.

### 주요 문서
- [사용자 가이드](./doc/USER_GUIDE.md) - 서비스 사용법
- [개발자 가이드](./doc/DEVELOPER_GUIDE.md) - 개발 환경 설정 및 가이드
- [QA 체크리스트](./doc/QA_CHECKLIST.md) - 테스트 체크리스트
- [배포 가이드](./doc/DEPLOYMENT.md) - 배포 절차
- [Vercel 배포 가이드](./doc/VERCEL_DEPLOYMENT.md) - Vercel 배포 상세 가이드
- [프로젝트 요구사항 문서](./doc/의료기관_비급여비교_PDR_v1.2.md) - PDR 문서

### API 관련 문서
- [API 호출 최적화](./doc/API_CALL_OPTIMIZATION.md) - API 호출 절약 전략
- [API 할당량 리포트](./doc/API_QUOTA_REPORT.md) - API 할당량 현황
- [API 상태](./doc/API_STATUS.md) - API 통합 상태
- [운영 계정 설정](./doc/OPERATIONAL_ACCOUNT_SETUP.md) - 운영 계정 서비스 키 설정

### 배포/인프라 문서
- [배포 가이드](./doc/DEPLOYMENT.md) - Vercel + Render 배포 절차
- [배포 체크리스트](./doc/DEPLOY_CHECKLIST.md) - Render 배포 전 체크리스트
- [CORS 가이드](./doc/DEPLOY_CORS_FIX.md) - CORS 설정
- [환경변수 매트릭스](./doc/ENVIRONMENT_MATRIX.md) - 환경변수 비교표
- [릴리즈 체크리스트](./doc/RELEASE_CHECKLIST.md) - Go/No-Go 체크리스트
- [Render 서버 정보](./doc/EC2_INFO.md) - Render 서비스 정보
- [트러블슈팅](./doc/TROUBLESHOOTING.md) - 문제 해결 가이드

### 테스트 문서
- [프론트엔드/백엔드 테스트](./doc/FRONTEND_BACKEND_TEST.md) - 통합 테스트 가이드

## 🎯 업데이트 이력

### 2026-04-05 — 인프라 전환 및 API 정확도 개선

#### 인프라 변경
- ✅ **백엔드 인프라: AWS EC2 → Render** 전환 (`render.yaml` 추가)
- ✅ **공공데이터 API 직접 호출**: Render(싱가포르) 경유 제거 → Vercel **인천(icn1)** 노드에서 직접 호출
  - 기존: 브라우저 → Vercel → Render(싱가포르) → 공공데이터 API
  - 현재: 브라우저 → Vercel(인천) → 공공데이터 API 직접

#### 병원 종별 필터링 전면 수정
- ✅ **HIRA API 실제 clCd 매핑 확인 및 적용** (기존 매핑 오류 수정)

| UI 종별 | 기존 (오류) | 수정 후 |
|---------|------------|---------|
| 종합병원 | clCd=01 | clCd=**01+11** (상급종합+종합병원) |
| 병원 | clCd=11 | clCd=**21** |
| 요양병원 | clCd=31 | clCd=**28** |
| 의원 | clCd=31 | clCd=**31** + 한의원 이름 제외 |
| 치과 | clCd=41 | clCd=**41+51** (치과병원+치과의원) |
| 한의원 | clCd=51 | clCd=**31** + `yadmNm=한의` 검색 |

#### HIRA 시군구 코드 전면 수정 (실측값 기반)
- ✅ **인천광역시**: 280xxx → **220xxx** 전수 교체 (실측)
  - 중구=220004, 동구=220002, 미추홀구=220001, 연수구=220007, 남동구=220006, 부평구=220003, 계양구=220008, 서구=220005
- ✅ **광주광역시**: 북구↔광산구 순서 오류 수정 (실측)
  - 동구=240001, 북구=240002, 서구=240003, 광산구=240004, 남구=240005
- ✅ **울산광역시**: 울주군 260005 → **260100** 수정

#### 서버 준비 상태 배너
- ✅ 서버 시작 시 앰버 배너 표시 (스피너 + 경과 시간)
- ✅ 준비 완료 시 초록 배너 "이제 사용하셔도 됩니다" + 4초 자동 닫기
- ✅ 2초 이내 응답 시 배너 미표시

#### 버그 수정
- ✅ `HospitalCard` departments 필드 undefined 크래시 수정
- ✅ `RegionSelector` 시군구 자동 프리패치 제거 (페이지 로드 시 불필요한 20초 API 호출 제거)
- ✅ Vercel 빌드 오류 수정 (`e2e/` TypeScript 오류, tsconfig exclude 추가)

### 2025-11-14 — MVP 기능 구현
- ✅ 병원명 검색, 지역/종별 필터, 비교 기능 구현
- ✅ 비급여 가격 비교 테이블 (실데이터 886개 항목)
- ✅ API 호출 최적화 (캐싱, 페이지네이션)

## 👨‍💻 제작자

**Boam79**

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.

