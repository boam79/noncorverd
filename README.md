# 🏥 의료기관 비급여 비교 서비스

전국 병원 비급여 수가 검색·비교 웹서비스

## 📋 프로젝트 개요

공공데이터포털 API를 활용하여 전국 의료기관의 비급여 진료비 정보를 검색하고 비교할 수 있는 서비스입니다.

### 주요 기능

- ✅ 지역별 병원 검색 (시도 → 시군구)
- ✅ 의료기관 종별 필터링 (종합병원, 병원, 의원, 요양병원, 치과, 한의원)
- ✅ 병원 선택 및 비교 (최대 5개)
- ✅ 비급여 가격 비교 테이블
- ✅ 모바일 최적화 UI (2열 그리드, 스와이프 비교 뷰)

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
- `GET /opendata/hospitals?sido={sido}&sigungu={sigungu}&type={type}` - 병원 목록 조회
- `POST /opendata/pricing` - 비급여 가격 정보 조회
  ```json
  {
    "hospitalIds": ["id1", "id2", ...]
  }
  ```

## 🧪 테스트

```bash
# 린트 검사
npm run lint

# 빌드 테스트
npm run build
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

자세한 내용은 `의료기관_비급여비교_PDR_v1.2.md`를 참고하세요.

## 🤝 기여

이 프로젝트는 MVP 단계입니다. 버그 리포트 및 기능 제안은 이슈로 등록해주세요.

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.

