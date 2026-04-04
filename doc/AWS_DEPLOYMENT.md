# 백엔드 배포 가이드 (Render)

> **참고**: 2026-04-05 기준, 백엔드 인프라가 AWS EC2에서 **Render**로 전환되었습니다.
> 자세한 배포 절차는 `doc/DEPLOYMENT.md`를 참고하세요.

## 공공데이터 API 한국 서버 접근 관련

공공데이터포털 API는 한국 서버에서 호출해야 하므로, Render의 **서울 리전(ap-northeast-2)** 또는 가장 가까운 리전에 배포를 권장합니다.

Render 서비스 생성 시 **Region: Singapore** 또는 **Oregon**을 선택할 수 있으나, 공공데이터 API 응답 속도를 고려하면 싱가포르 리전이 한국과 가장 가깝습니다.

## 빠른 배포 링크

[Render Blueprint 배포](https://dashboard.render.com/blueprint/new?repo=https://github.com/boam79/noncorverd)

## 서버 URL (배포 후)

- **Health Check**: `https://noncorverd-backend.onrender.com/health`
- **API Gateway**: `https://noncorverd-backend.onrender.com/opendata`
- **프론트엔드 설정**: `NEXT_PUBLIC_API_BASE_URL=https://noncorverd-backend.onrender.com/opendata`
