# CORS 설정 가이드

## 현재 구성

백엔드(`backend/src/server.js`)는 `CORS_ORIGINS` 환경변수를 쉼표로 구분하여 여러 Origin을 허용합니다.

## Render 환경에서 설정 방법

Render Dashboard → 서비스 → **Environment** 탭에서 아래 변수 설정:

```
CORS_ORIGINS=http://localhost:3000,https://noncorverd.vercel.app
```

추가 도메인이 필요하면 쉼표로 구분하여 추가하면 됩니다.

## 배포 후 CORS 검증

```bash
curl -I -H "Origin: https://noncorverd.vercel.app" \
     -H "X-Client-Token: your-token" \
     "https://noncorverd-backend.onrender.com/opendata/regions"
```

**예상 응답:**
```
Access-Control-Allow-Origin: https://noncorverd.vercel.app
Access-Control-Allow-Credentials: true
```

## Playwright E2E 재실행

```bash
PLAYWRIGHT_BASE_URL=https://noncorverd.vercel.app npm run test:e2e
```

## 참고

- CORS 설정은 보안에 영향을 주므로 프로덕션 배포 전 반드시 검증 필요
- `render.yaml`에 `CORS_ORIGINS`가 기본값으로 설정되어 있어 별도 수정 없이 배포 가능
