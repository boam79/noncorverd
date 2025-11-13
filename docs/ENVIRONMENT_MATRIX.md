# 환경 변수 매트릭스

프로덕션 배포 전 환경 구성을 검증하기 위한 비교표입니다. 로컬(.env.local, backend/.env), Vercel(Frontend), EC2 Backend(PM2 환경) 간 환경변수를 비교하여 누락/불일치 여부를 확인하세요.

| 범주 | 변수 | 로컬(.env / backend/.env) | Vercel (Frontend) | EC2 (backend/.env / PM2) | 비고 |
|------|------|------------------------|--------------------|--------------------------|------|
| 공통 | `api_key` | ✅ (.env, backend/.env) | ❓ (Vercel Secret 필요) | ✅ (ecosystem.config.cjs) | 공공데이터 단일 서비스키. Vercel Secret `API_KEY` 혹은 `api_key` 명으로 설정 권장 |
| 공통 | `CLIENT_OPENDATA_TOKEN` | ✅ (backend/.env) | ✅ (`NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN`) | ✅ (ecosystem.config.cjs) | 프론트/백에서 동일 값 사용 필요 |
| 프론트 | `NEXT_PUBLIC_API_BASE_URL` | ✅ (`http://localhost:3001/opendata`) | ⛔ (프록시 사용시 비워도 됨) | - | Vercel 배포 시 Next.js API Route 사용하므로 비워도 문제 없음 |
| 프론트 | `NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN` | ⛔ (로컬은 `CLIENT_OPENDATA_TOKEN`) | ✅ | - | 프론트에서 토큰을 사용해야 하므로 Vercel 환경에 설정 필수 |
| 프론트 | `SENTRY_DSN` | ⛔ | ❓ (선택) | - | Sentry 연동 시 설정 |
| 프론트 | `NEXT_PUBLIC_ANALYTICS_ID` | ⛔ | ❓ (선택) | - | Vercel Analytics / GA 등 |
| 백엔드 | `PORT` | ✅ (3000) | - | ✅ (3000) | EC2 보안그룹/ufw 포트와 일치 확인 |
| 백엔드 | `FRONTEND_URL` | ✅ (`http://localhost:3000`) | - | ✅ (배포 URL) | 프로덕션 배포 시 실제 프론트 URL로 갱신 필요 |
| 백엔드 | `ADMINISTRATIVE_CODE_SERVICE_KEY` | ✅ | - | ✅ | `api_key` 자동 fallback 존재. 중복 설정 체크 |
| 백엔드 | `HIRA_SERVICE_KEY` | ✅ | - | ✅ | 상동 |
| 백엔드 | `HIRA_PRICING_SERVICE_KEY` | ✅ | - | ✅ | 상동 |
| 배포 | `VERCEL_TOKEN` | - | ✅ (GitHub Secret) | - | GitHub Actions `deploy.yml` 사용 |
| 배포 | `VERCEL_ORG_ID` | - | ✅ (GitHub Secret) | - | |
| 배포 | `VERCEL_PROJECT_ID` | - | ✅ (GitHub Secret) | - | |
| 배포 | `EC2_HOST` | - | - | ✅ (GitHub Secret) | ssh-action |
| 배포 | `EC2_SSH_KEY` | - | - | ✅ (GitHub Secret) | PEM 키 |
| 배포 | `PLAYWRIGHT_BASE_URL` | ⛔ | ❓ | ❓ | CI에서 E2E 실행 시 설정 |

✅ 체크 항목은 해당 환경에 값이 존재함을 의미합니다. ❓는 확인이 필요하거나 미설정 상태입니다.

## 검증 절차

1. Vercel Dashboard → Environment Variables에서 `api_key`, `NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN` 등이 정확히 설정되어 있는지 확인합니다.
2. EC2 서버에서 `/var/www/nonvovered/backend/.env` 및 `pm2 env` 출력으로 현재 값과 일치 여부를 확인합니다.
3. Secrets Manager 또는 별도 Vault를 사용 중이라면 최신 값인지 확인하고, 만료일이 있는 경우 갱신 일정을 기록합니다.
4. 변경 사항이 있을 경우 `backend/ecosystem.config.cjs` 와 GitHub Actions Secrets도 함께 업데이트합니다.

> 참고: `ecosystem.config.cjs`는 `process.env.api_key`를 우선 사용하므로, PM2 실행 환경에서 `api_key`가 설정되어 있는지 확인하세요. `pm2 start ecosystem.config.cjs --env production` 실행 시 `.env`를 자동으로 로드합니다.

## 검증 노트 (2025-11-14 기준)
- ✅ 로컬 `.env` 및 `backend/.env`의 `api_key`, `CLIENT_OPENDATA_TOKEN` 값 일치 확인
- ✅ `ecosystem.config.cjs`에서 `api_key` fallback 로직 확인 (PM2 환경)
- ❓ Vercel 환경변수(`api_key`, `NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN`)는 Dashboard에서 확인 필요
- ❓ EC2 실환경(`/var/www/nonvovered/backend/.env`) 최신화 여부 SSH 접속 후 검증 필요
- 🔁 Secrets Manager / GitHub Secrets는 배포 직전 재확인 권장
