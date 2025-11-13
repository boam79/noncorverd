# 공공데이터 API 연동 상태

## ✅ 완료된 작업

1. **어댑터 패턴 구현**
   - `BaseAdapter`: 공통 API 호출 로직
   - `RegionsAdapter`: 지역 정보 조회
   - `HospitalsAdapter`: 병원 정보 조회
   - `PricingAdapter`: 비급여 가격 정보 조회

2. **에러 처리 및 폴백**
   - Service Key 미설정 시 Mock 데이터 반환
   - API 호출 실패 시 Mock 데이터로 폴백
   - 타임아웃 처리 (30초)

3. **테스트 스크립트**
   - `test-api.js`: 어댑터별 단위 테스트
   - 환경변수 확인 기능

## ⚠️ 추가 작업 필요

### 1. 실제 API 엔드포인트 확인

각 API의 상세 페이지에서 정확한 엔드포인트 URL을 확인하고 `backend/src/config/apiEndpoints.js`를 업데이트:

- [ ] 행정안전부 법정동코드 API 엔드포인트 확인
- [ ] 건강보험심사평가원 병원정보 API 엔드포인트 확인
- [ ] 건강보험심사평가원 비급여진료비 API 엔드포인트 확인

### 2. API 파라미터 매핑

실제 API 문서에 맞게 파라미터 이름과 형식을 조정:

- [ ] 지역 정보 API 파라미터 확인 및 수정
- [ ] 병원 정보 API 파라미터 확인 및 수정
- [ ] 비급여 가격 API 파라미터 확인 및 수정

### 3. 응답 데이터 변환

실제 API 응답 형식에 맞게 데이터 변환 로직 조정:

- [ ] API 응답 구조 확인 (JSON/XML)
- [ ] 데이터 변환 로직 업데이트
- [ ] XML 응답 지원 (필요 시 `xml2js` 패키지 추가)

### 4. Service Key 설정

실제 Service Key를 환경변수에 설정:

```bash
# backend/.env 파일에 추가
ADMINISTRATIVE_CODE_SERVICE_KEY=실제_서비스키
HIRA_SERVICE_KEY=실제_서비스키
HIRA_PRICING_SERVICE_KEY=실제_서비스키
```

### 5. 실제 API 테스트

Service Key 설정 후 실제 API 호출 테스트:

```bash
cd backend
npm run test:api
```

## 📝 참고 자료

- [공공데이터 포털 OpenAPI 안내](https://www.data.go.kr/ugs/selectPublicDataUseGuideView.do)
- [행정안전부 법정동코드 API](https://www.data.go.kr/data/15001699/openapi.do)
- [건강보험심사평가원 병원정보 API](https://www.data.go.kr/data/15001699/openapi.do)
- [건강보험심사평가원 비급여진료비 API](https://www.data.go.kr/data/15001699/openapi.do)

## 🔄 다음 단계

1. 실제 Service Key 발급 및 설정
2. API 상세 페이지에서 엔드포인트 및 파라미터 확인
3. 실제 API 호출 테스트
4. 응답 데이터 형식에 맞게 변환 로직 조정
5. 프론트엔드 연동 테스트

