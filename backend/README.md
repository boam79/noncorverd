# Backend API Server

Express.js 기반 공공데이터 API 게이트웨이 서버

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 서버 실행
npm start
```

서버는 기본적으로 `http://localhost:3001`에서 실행됩니다.

## API 엔드포인트

### Health Check
```
GET /health
```

### OpenData Gateway
모든 엔드포인트는 `X-Client-Token` 헤더가 필요합니다.

#### 지역 정보 조회
```
GET /opendata/regions?sido={sido}
```

#### 병원 목록 조회
```
GET /opendata/hospitals?sido={sido}&sigungu={sigungu}&type={type}
```

#### 비급여 가격 정보 조회
```
POST /opendata/pricing
Content-Type: application/json

{
  "hospitalIds": ["id1", "id2", ...]
}
```

## 환경변수

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
CLIENT_OPENDATA_TOKEN=your-client-token-here

# 공공데이터 API 서비스키
ADMINISTRATIVE_CODE_SERVICE_KEY=your-key
HIRA_SERVICE_KEY=your-key
HIRA_PRICING_SERVICE_KEY=your-key
```

## 프로젝트 구조

```
backend/
├── src/
│   ├── server.js          # 메인 서버 파일
│   ├── routes/           # API 라우트
│   │   └── opendata.js
│   ├── adapters/         # 공공데이터 API 어댑터
│   │   ├── baseAdapter.js
│   │   ├── regionsAdapter.js
│   │   ├── hospitalsAdapter.js
│   │   └── pricingAdapter.js
│   └── middleware/       # 미들웨어
│       ├── auth.js
│       └── errorHandler.js
└── package.json
```

## 어댑터 패턴

각 공공데이터 API는 별도의 어댑터로 구현되어 있습니다:

- `regionsAdapter`: 행정안전부 법정동코드 API
- `hospitalsAdapter`: 건강보험심사평가원 병원정보 API
- `pricingAdapter`: 건강보험심사평가원 비급여진료비 API

모든 어댑터는 `BaseAdapter`를 상속받아 표준 응답 포맷을 반환합니다.

## 배포

### PM2 사용 (권장)

```bash
npm install -g pm2
pm2 start src/server.js --name nonvovered-backend
pm2 save
pm2 startup
```

### Docker 사용 (선택)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/server.js"]
```

