# 운영계정 서비스 키 설정 가이드

## 상황
- 병원정보서비스가 운영계정으로 신청 완료됨
- 하지만 여전히 할당량 초과 오류 발생
- 운영계정 서비스 키 사용 필요

## 확인 사항

### 1. 운영계정 서비스 키 확인
공공데이터 포털에서:
1. https://www.data.go.kr/iim/api/selectAPIAcountView.do 접속
2. 로그인 후 "병원정보서비스" API 선택
3. 운영계정 서비스 키 확인 및 복사

### 2. 현재 사용 중인 서비스 키 확인
- 로컬: `backend/.env` 파일의 `api_key` 값
- EC2 서버: `/var/www/nonvovered/backend/.env` 파일의 `api_key` 값

### 3. 서비스 키 업데이트 방법

#### 로컬 환경
```bash
# backend/.env 파일 수정
api_key=운영계정_서비스_키
```

#### EC2 서버 환경
```bash
# SSH 접속 후
cd /var/www/nonvovered/backend
nano .env  # 또는 vi .env
# api_key 값을 운영계정 서비스 키로 변경
pm2 restart ecosystem.config.cjs
```

### 4. 업데이트 후 확인
```bash
# 직접 API 호출 테스트
curl -s "https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList?serviceKey=운영계정_서비스_키&sidoCd=110000&numOfRows=3&pageNo=1"
```

## 주의사항
- 운영계정과 개발계정의 서비스 키가 다를 수 있음
- 운영계정 서비스 키는 할당량이 더 많을 수 있음
- 서비스 키 변경 후 반드시 PM2 재시작 필요
