# Render 서비스 정보

> **참고**: 2026-04-05 기준, AWS EC2에서 Render로 전환되었습니다.
> 이 파일은 이전 EC2 정보를 대체합니다.

## Render 서비스 상세 정보

- **서비스 이름**: `noncorverd-backend`
- **서비스 유형**: Web Service
- **플랜**: Free (필요 시 Starter 업그레이드 가능)
- **런타임**: Node.js
- **Root Directory**: `backend/`

## 서버 URL

- **Health Check**: `https://noncorverd-backend.onrender.com/health`
- **API Gateway**: `https://noncorverd-backend.onrender.com/opendata`

## Render Dashboard 접속

https://dashboard.render.com

## 로그 확인

Render Dashboard → 서비스 선택 → **Logs** 탭

## 롤백

Render Dashboard → 서비스 선택 → **Deploys** 탭 → 이전 배포 선택 → **"Rollback to this deploy"**

## Free 플랜 주의사항

- 15분 비활성 시 슬립 상태 전환 (첫 요청 시 약 50초 지연)
- 월 750시간 무료 제공
- 유료 플랜(Starter, $7/월)으로 업그레이드 시 슬립 없음
