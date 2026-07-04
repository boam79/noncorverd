# 환경 변수 매트릭스

프로덕션 배포 전 환경 구성을 검증하기 위한 비교표입니다.

| 범주 | 변수 | 로컬(.env / backend/.env) | Vercel (Frontend) | Render (Backend) | 비고 |
|------|------|--------------------------|-------------------|------------------|------|
| 공통 | `api_key` | ✅ | ❓ (필요 없음) | ✅ (Dashboard 직접 입력) | 공공데이터 단일 서비스키 |
| 공통 | `CLIENT_OPENDATA_TOKEN` | ✅ | ✅ (`NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN`) | ✅ (Dashboard 직접 입력) | 프론트/백 동일 값 |
| 프론트 | `NEXT_PUBLIC_API_BASE_URL` | ✅ (`http://localhost:3001/opendata`) | ✅ (`https://noncorverd-backend.onrender.com/opendata`) | - | Vercel 배포 시 Render URL로 설정 |
| 프론트 | `NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN` | ⛔ | ✅ | - | 프론트에서 토큰 사용 시 필수 |
| 프론트 | `SENTRY_DSN` | ⛔ | ⛔ | - | **미구현**(코드에서 읽지 않음). 실제 관측성은 `GET /api/health`·`GET /api/health/metrics`, `lib/observability/*` 참고 |
| 프론트 | `NEXT_PUBLIC_ANALYTICS_ID` | ⛔ | ⛔ | - | **미구현**(코드에서 읽지 않음) |
| 백엔드 | `PORT` | ✅ (3001) | - | ✅ (10000, render.yaml) | Render는 10000 포트 사용 |
| 백엔드 | `CORS_ORIGINS` | ✅ | - | ✅ (render.yaml 기본값) | `https://noncorverd.vercel.app` 포함 |
| 백엔드 | `ADMINISTRATIVE_CODE_SERVICE_KEY` | ✅ | - | ✅ | `api_key` fallback 존재 |
| 백엔드 | `HIRA_SERVICE_KEY` | ✅ | - | ✅ | `api_key` fallback 존재 |
| 백엔드 | `HIRA_PRICING_SERVICE_KEY` | ✅ | - | ✅ | `api_key` fallback 존재 |
| 테스트 | `PLAYWRIGHT_BASE_URL` | ⛔ | ❓ | ❓ | CI E2E 실행 시 설정 |

> **배포 방식**: Vercel/Render 모두 각 플랫폼의 네이티브 Git 연동으로 `main` 푸시 시 자동 배포됩니다. 별도의 GitHub Actions Deploy 워크플로우와 `VERCEL_TOKEN` 등 GitHub Secrets는 사용하지 않습니다(과거 `deploy.yml`은 시크릿 미설정 및 폐기된 EC2 배포 경로로 항상 실패하고 있어 제거했습니다).

✅ 값 존재 | ❓ 확인/미설정 | ⛔ 해당 없음

## 검증 절차

1. **Vercel Dashboard** → Environment Variables에서 `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN` 확인
2. **Render Dashboard** → 서비스 → Environment 탭에서 `api_key`, `CLIENT_OPENDATA_TOKEN` 값 입력 확인
3. Health Check로 백엔드 정상 기동 확인:
   ```bash
   curl https://noncorverd-backend.onrender.com/health
   ```
4. CORS 검증:
   ```bash
   curl -I -H "Origin: https://noncorverd.vercel.app" \
        "https://noncorverd-backend.onrender.com/opendata/regions"
   ```

## 검증 노트 (2026-04-05 업데이트)

- ✅ 백엔드 인프라: AWS EC2 → **Render**로 전환 완료
- ✅ PM2 제거 → Render 네이티브 프로세스 관리로 대체
- ✅ `render.yaml` Blueprint 저장소 루트에 추가
- ✅ `CORS_ORIGINS` 환경변수 `render.yaml`에 기본값 포함
- ❓ Vercel 환경변수 `NEXT_PUBLIC_API_BASE_URL`을 Render URL로 업데이트 필요
- ❓ Render Dashboard에서 `api_key`, `CLIENT_OPENDATA_TOKEN` 직접 입력 필요
