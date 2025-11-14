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

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **API Gateway**: `/opendata` 엔드포인트
- **Authentication**: X-Client-Token

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: AWS EC2 (t3.micro, Ubuntu 22.04)
- **Region**: ap-northeast-2 (서울)

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

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/opendata
CLIENT_OPENDATA_TOKEN=your-client-token-here
```

### Backend (`backend/.env`)

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
CLIENT_OPENDATA_TOKEN=your-client-token-here

# 공공데이터 API 서비스키
ADMINISTRATIVE_CODE_SERVICE_KEY=your-administrative-code-service-key
HIRA_SERVICE_KEY=your-hira-service-key
HIRA_PRICING_SERVICE_KEY=your-hira-pricing-service-key
```

## 📡 API 엔드포인트

### Frontend → Backend

모든 요청은 `X-Client-Token` 헤더를 포함해야 합니다.

- `GET /opendata/regions?sido={sido}` - 지역 정보 조회
- `GET /opendata/hospitals?sido={sido}&sigungu={sigungu}&type={type}&hospitalName={name}` - 병원 목록 조회
  - `sido`: 시도 코드 (2자리, 예: 11=서울, 26=부산)
  - `sigungu`: 시군구 코드 (6자리, 예: 111100=서울 종로구)
  - `type`: 의료기관 종별 (종합병원, 병원, 의원, 요양병원, 치과, 한의원)
  - `hospitalName`: 병원명 (부분 검색 지원)
- `POST /opendata/pricing` - 비급여 가격 정보 조회
  ```json
  {
    "hospitalIds": ["id1", "id2", ...],
    "hospitals": [{"id": "id1", "name": "병원명"}, ...]
  }
  ```

## 🧪 테스트

```bash
# 린트 검사
npm run lint

# 빌드 테스트
npm run build

# E2E 테스트
npm run test:e2e

# E2E 테스트 (UI 모드)
npm run test:e2e:ui

# E2E 테스트 (헤드 모드)
npm run test:e2e:headed
```

## 📦 배포

### Vercel 배포 (Frontend)

1. Vercel에 프로젝트 연결
2. 환경변수 설정 (Vercel Dashboard)
3. 자동 배포 (GitHub 연동 시)

### AWS EC2 배포 (Backend)

```bash
# EC2 서버에 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# 프로젝트 클론 및 설정
cd /var/www
git clone your-repo-url
cd nonvovered/backend
npm install

# PM2로 프로세스 관리 (권장)
npm install -g pm2
pm2 start src/server.js --name nonvovered-backend
pm2 save
pm2 startup
```

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

### 백엔드 문서
- [AWS 배포 가이드](./doc/AWS_DEPLOYMENT.md) - AWS EC2 배포 가이드
- [API 통합 상태](./doc/API_INTEGRATION_STATUS.md) - 백엔드 API 통합 현황
- [API 테스트 가이드](./doc/API_TEST_GUIDE.md) - API 테스트 방법
- [API 테스트 결과](./doc/API_TEST_RESULTS.md) - API 테스트 결과
- [데이터 소스 상태](./doc/DATA_SOURCE_STATUS.md) - 데이터 소스 현황
- [배포 체크리스트](./doc/DEPLOY_CHECKLIST.md) - 배포 전 체크리스트
- [배포 상태](./doc/DEPLOYMENT_STATUS.md) - 배포 현황
- [EC2 정보](./doc/EC2_INFO.md) - EC2 인스턴스 정보
- [README AWS](./doc/README_AWS.md) - AWS 관련 README
- [트러블슈팅](./doc/TROUBLESHOOTING.md) - 문제 해결 가이드

### 테스트 문서
- [프론트엔드/백엔드 테스트](./doc/FRONTEND_BACKEND_TEST.md) - 통합 테스트 가이드

## 🎯 최근 업데이트

### 2025-11-14
- ✅ 병원명 검색 기능 추가 (병원명만으로도 검색 가능)
- ✅ 메인 타이틀 클릭 시 초기화 및 홈 이동 기능
- ✅ 푸터에 제작자 표시 추가 (Boam79)
- ✅ API 호출 최적화 (캐싱, 페이지네이션 최적화)
- ✅ 검색 결과 속도 개선 (React Query 캐시 설정 최적화)
- ✅ Enter 키 및 검색 버튼으로 검색 실행 가능
- ✅ 선택된 병원 독립 표시 및 관리 기능

### 성능 최적화
- **API 호출 절약**: 백엔드 캐싱 (1시간 TTL) 및 페이지네이션 최적화 (초기 2페이지만 수집)
- **검색 속도 개선**: React Query `staleTime` 1분, `gcTime` 10분으로 조정
- **프론트엔드 필터링**: 백엔드 필터링과 함께 프론트엔드에서 추가 필터링으로 정확도 향상

## 👨‍💻 제작자

**Boam79**

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.

