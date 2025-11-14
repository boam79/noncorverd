# AWS EC2 배포 체크리스트

## ✅ 배포 전 확인사항

- [ ] EC2 인스턴스 생성 완료 (ap-northeast-2, 서울)
- [ ] 보안 그룹 설정:
  - [ ] SSH (22) - 내 IP
  - [ ] HTTP (80) - 모든 IP
  - [ ] HTTPS (443) - 모든 IP  
  - [ ] Custom TCP (3001) - 모든 IP
- [ ] SSH 키 파일 준비 (`~/.ssh/boam79-aws-key.pem`)
- [ ] `.env` 파일에 Service Key 설정 완료
- [ ] 로컬에서 `npm install` 완료

## 🚀 배포 실행

```bash
cd backend
./quick-deploy.sh
```

또는

```bash
./deploy.sh YOUR_EC2_IP ~/.ssh/boam79-aws-key.pem
```

## ✅ 배포 후 확인

- [ ] Health Check 통과: `curl http://YOUR_EC2_IP:3001/health`
- [ ] API 테스트 통과: `./aws-test.sh YOUR_EC2_IP ~/.ssh/boam79-aws-key.pem`
- [ ] PM2 서버 실행 중: `pm2 status` (EC2에서)
- [ ] 로그 확인: `pm2 logs nonvovered-backend` (EC2에서)

## 🔧 문제 발생 시

1. **SSH 연결 실패**: 키 권한 확인 (`chmod 400`)
2. **포트 접근 불가**: 보안 그룹 확인
3. **서버 시작 실패**: PM2 로그 확인
4. **API 호출 실패**: EC2에서 직접 curl 테스트

