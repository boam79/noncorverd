# EC2 인스턴스 정보

## 인스턴스 상세 정보

- **인스턴스 ID**: `i-030a6f1fd19110d16`
- **인스턴스 이름**: `boam79-sever1`
- **퍼블릭 IP**: `54.180.251.93`
- **프라이빗 IP**: `172.31.9.180`
- **리전**: `ap-northeast-2` (서울)
- **인스턴스 유형**: `t3.micro`
- **AMI**: `ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20251015`
- **키 페어**: `boam79-aws-key`
- **보안 그룹**: `sg-0a752260e811277f8 (launch-wizard-1)`

## 보안 그룹 설정

### 인바운드 규칙
- **포트 22 (SSH)**: `0.0.0.0/0` ✅
- **포트 80 (HTTP)**: `0.0.0.0/0` ✅
- **포트 3000 (백엔드)**: ✅ **설정 완료**
- **포트 8000**: ✅ **설정 완료**

### 아웃바운드 규칙
- **전체 허용**: `0.0.0.0/0` ✅

## 배포 명령어

### 빠른 배포
```bash
cd backend
./deploy-to-ec2.sh
```

### 원격 테스트
```bash
cd backend
./test-ec2-api.sh
```

### 수동 연결
```bash
ssh -i ~/.ssh/boam79-aws-key.pem ubuntu@54.180.251.93
```

## 서버 URL

- **Health Check**: http://54.180.251.93:3000/health
- **API Gateway**: http://54.180.251.93:3000/opendata
- **프론트엔드 설정**: `NEXT_PUBLIC_API_BASE_URL=http://54.180.251.93:3000/opendata`

