#!/bin/bash

# 빠른 배포 스크립트 (EC2 IP와 키 경로를 직접 입력)
# 사용법: ./quick-deploy.sh

echo "🚀 AWS EC2 빠른 배포"
echo "===================="
echo ""

# EC2 정보 (스크린샷에서 확인된 정보)
EC2_IP="54.180.251.93"
INSTANCE_ID="i-030a6f1fd19110d16"
INSTANCE_NAME="boam79-sever1"

# SSH 키 경로
SSH_KEY="${HOME}/.ssh/boam79-aws-key.pem"

echo "📋 EC2 인스턴스 정보:"
echo "  인스턴스 ID: $INSTANCE_ID"
echo "  인스턴스 이름: $INSTANCE_NAME"
echo "  퍼블릭 IP: $EC2_IP"
echo "  리전: ap-northeast-2 (서울)"
echo "  키 페어: boam79-aws-key"
echo ""

# 실제 경로로 확장
SSH_KEY="${SSH_KEY/#\~/$HOME}"

if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH 키 파일을 찾을 수 없습니다: $SSH_KEY"
    exit 1
fi

echo "⚠️  보안 그룹 확인 필요:"
echo "  - 포트 22 (SSH): ✅ 설정됨"
echo "  - 포트 80 (HTTP): ✅ 설정됨"
echo "  - 포트 3001 (백엔드): ⚠️  확인 필요 (보안 그룹에 추가 필요할 수 있음)"
echo ""
read -p "배포를 계속하시겠습니까? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "취소되었습니다."
    exit 0
fi

# 배포 실행
./deploy.sh "$EC2_IP" "$SSH_KEY"

