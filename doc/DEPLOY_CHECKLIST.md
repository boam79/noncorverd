# Render 배포 체크리스트

## ✅ 배포 전 확인사항

- [ ] `render.yaml`이 저장소 루트에 존재하고 최신 상태인지 확인
- [ ] `backend/` 코드 최신화 완료 (`git status` clean)
- [ ] 백엔드 로컬 동작 확인 (`cd backend && npm start`)
- [ ] 환경변수 값 준비:
  - [ ] `CLIENT_OPENDATA_TOKEN`
  - [ ] `api_key` (공공데이터 서비스키)

## 🚀 배포 실행

[Render Blueprint 배포 링크](https://dashboard.render.com/blueprint/new?repo=https://github.com/boam79/noncorverd) 클릭 후:

1. GitHub OAuth 인증
2. 서비스 이름 확인 (`noncorverd-backend`)
3. `sync: false` 환경변수 직접 입력
4. **"Apply"** 클릭

## ✅ 배포 후 확인

- [ ] Health Check 통과:
  ```bash
  curl https://noncorverd-backend.onrender.com/health
  ```
- [ ] CORS 검증:
  ```bash
  curl -I -H "Origin: https://noncorverd.vercel.app" \
       -H "X-Client-Token: your-token" \
       "https://noncorverd-backend.onrender.com/opendata/regions"
  ```
- [ ] Render Dashboard → Logs 탭에서 에러 없음 확인
- [ ] Vercel 프론트엔드에서 병원 검색 정상 동작 확인

## 🔧 문제 발생 시

1. **서비스 슬립 상태**: Render Free 플랜은 15분 비활성 후 슬립 → 첫 요청 후 대기
2. **환경변수 누락**: Render Dashboard → 서비스 → Environment 탭에서 확인/추가
3. **빌드 실패**: Dashboard → Logs에서 빌드 로그 확인
4. **CORS 오류**: `CORS_ORIGINS` 값에 Vercel 도메인 포함 여부 확인

## 🔄 롤백 방법

Render Dashboard → 서비스 → **Deploys** 탭에서 이전 배포 선택 후 **"Rollback to this deploy"** 클릭
