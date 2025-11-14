# 공공데이터 API 연동 테스트 가이드

## 📋 사전 준비

### 1. 공공데이터 포털 API 키 발급

1. [공공데이터 포털](https://www.data.go.kr) 접속 및 로그인
2. 다음 API에 대해 활용신청:
   - 행정안전부_행정표준코드_법정동코드
   - 건강보험심사평가원_병원정보서비스
   - 건강보험심사평가원_비급여진료비정보조회서비스
3. 승인 후 마이페이지에서 인증키(Service Key) 확인

### 2. 환경변수 설정

`backend/.env` 파일을 생성하고 다음 변수를 설정:

```env
# 공공데이터 API 서비스키
ADMINISTRATIVE_CODE_SERVICE_KEY=발급받은_행정안전부_서비스키
HIRA_SERVICE_KEY=발급받은_건강보험심사평가원_서비스키
HIRA_PRICING_SERVICE_KEY=발급받은_비급여진료비_서비스키

# 기타 설정
PORT=3001
FRONTEND_URL=http://localhost:3000
CLIENT_OPENDATA_TOKEN=your-client-token-here
```

## 🧪 테스트 실행

### 1. 단위 테스트 (어댑터별)

```bash
cd backend
npm run test:api
```

이 명령은 다음을 테스트합니다:
- ✅ 지역 정보 API (시도/시군구 목록)
- ✅ 병원 정보 API (병원 목록 조회)
- ✅ 비급여 가격 정보 API (병원별 가격 조회)

### 2. 통합 테스트 (백엔드 서버)

```bash
# 백엔드 서버 실행
cd backend
npm run dev

# 다른 터미널에서 테스트
curl -X GET "http://localhost:3001/health"
curl -X GET "http://localhost:3001/opendata/regions" \
  -H "X-Client-Token: your-client-token-here"
```

### 3. 프론트엔드 연동 테스트

```bash
# 프론트엔드 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
# 1. 지역 선택 테스트
# 2. 병원 검색 테스트
# 3. 비교 기능 테스트
```

## 🔍 API 엔드포인트 확인

실제 공공데이터 API 엔드포인트는 각 API의 상세 페이지에서 확인할 수 있습니다:

1. **행정안전부 법정동코드**: 
   - [API 상세 페이지](https://www.data.go.kr/data/15001699/openapi.do)
   - 엔드포인트: `/B552584/AdministrativeCodeService/getAdministrativeCode`

2. **건강보험심사평가원 병원정보**:
   - [API 상세 페이지](https://www.data.go.kr/data/15001699/openapi.do)
   - 엔드포인트: `/B551182/hospInfoServicev2/getHospBasisList`

3. **건강보험심사평가원 비급여진료비**:
   - [API 상세 페이지](https://www.data.go.kr/data/15001699/openapi.do)
   - 엔드포인트: `/B551182/nonPaymentDamtInfoService/getNonPaymentItemHospDtlList`

## ⚠️ 주의사항

1. **Service Key 미설정 시**: Mock 데이터가 반환됩니다 (개발/테스트용)
2. **API 응답 형식**: 일부 API는 XML만 지원할 수 있습니다. 이 경우 XML 파서 추가 필요
3. **API 호출 제한**: 공공데이터 API는 일일 호출 제한이 있을 수 있습니다
4. **에러 처리**: API 호출 실패 시 자동으로 Mock 데이터로 폴백됩니다

## 🐛 트러블슈팅

### Service Key 오류
```
⚠️ Service Key가 설정되지 않았습니다.
```
→ `.env` 파일에 올바른 Service Key가 설정되었는지 확인

### API 호출 실패
```
❌ API 오류: Request failed with status code 400
```
→ API 엔드포인트 URL과 파라미터를 확인 (API 문서 참조)

### XML 응답 오류
```
⚠️ XML 응답을 받았습니다. JSON 파서가 필요합니다.
```
→ `xml2js` 패키지 설치 및 XML 파싱 로직 추가 필요

## 📝 다음 단계

1. 실제 API 엔드포인트 URL 확인 및 업데이트
2. API 응답 형식에 맞게 데이터 변환 로직 조정
3. XML 응답 지원 (필요 시)
4. 에러 처리 및 재시도 로직 강화
5. 캐싱 전략 구현 (API 호출 제한 대응)

