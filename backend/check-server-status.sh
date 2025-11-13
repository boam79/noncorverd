#!/bin/bash

# EC2 서버 상태 확인 스크립트
# 사용법: ./check-server-status.sh

EC2_IP="54.180.251.93"
SSH_KEY="boam79-aws-key.pem"

echo "🔍 EC2 서버 상태 확인 중..."
echo ""

# SSH 키 경로 찾기
if [ ! -f "$SSH_KEY" ]; then
    SSH_KEY="../$SSH_KEY"
fi

if [ ! -f "$SSH_KEY" ]; then
    SSH_KEY="~/.ssh/$SSH_KEY"
fi

echo "📋 서버 상태 확인 명령어:"
echo ""
echo "1. 서버 접속:"
echo "   ssh -i $SSH_KEY ubuntu@$EC2_IP"
echo ""
echo "2. PM2 상태 확인:"
echo "   pm2 status"
echo ""
echo "3. 서버 로그 확인:"
echo "   pm2 logs nonvovered-backend --lines 50"
echo ""
echo "4. 포트 3000 확인:"
echo "   sudo netstat -tlnp | grep 3000"
echo "   또는"
echo "   sudo lsof -i :3000"
echo ""
echo "5. 방화벽 상태 확인:"
echo "   sudo ufw status"
echo ""
echo "6. 서버 재시작 (필요시):"
echo "   pm2 restart nonvovered-backend"
echo ""
echo "7. Health Check 테스트:"
echo "   curl http://localhost:3000/health"
echo ""

