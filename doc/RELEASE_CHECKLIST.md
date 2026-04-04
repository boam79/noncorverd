# 릴리즈 Go/No-Go 체크리스트

프로덕션 배포 전 최종 확인해야 할 항목을 정리했습니다.

## 1. 환경 및 설정

- [ ] `doc/ENVIRONMENT_MATRIX.md` 검토, 누락된 환경변수 없음
- [ ] Vercel 환경변수 최신화 완료 (`NEXT_PUBLIC_API_BASE_URL` → Render URL)
- [ ] Render Dashboard 환경변수 입력 완료 (`api_key`, `CLIENT_OPENDATA_TOKEN`)
- [ ] GitHub Secrets 검증 완료 (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)

## 2. 테스트 및 검증

- [ ] `QA_CHECKLIST.md` 스테이징 환경 기준 통과
- [ ] Playwright E2E (스테이징 URL) 통과
- [ ] `scripts/load-test.js` 실행 결과 SLA 충족 (평균 < 2초, 실패 0건)
- [ ] Render 로그 확인 (Dashboard → Logs 탭)
- [ ] Vercel 배포 로그 확인

## 3. 장애/롤백 대응

- [ ] 백엔드 다운 시 사용자 메시지 확인 (프론트엔드 에러 처리)
- [ ] 공공데이터 API 401/500 Mock 테스트 (백엔드 로그 및 응답 확인)
- [ ] Render Dashboard에서 롤백 절차 확인 (Deploys → 이전 배포 선택)
- [ ] Sentry / 모니터링 알람 정상 동작 확인

## 4. 커뮤니케이션

- [ ] 배포 일정 및 영향 범위 공유 (내부 채널)
- [ ] Go/No-Go 미팅 자료 준비 (테스트 결과 요약)
- [ ] 위험 요소 및 대응 계획 정리

## 5. 배포 실행 전

- [ ] GitHub Actions 워크플로우 점검
- [ ] 코드베이스 최신화 (`git status` clean)
- [ ] `render.yaml`이 main 브랜치에 push 되어 있는지 확인
- [ ] 태그/릴리즈 노트 초안 작성

## 6. 배포 후

- [ ] Smoke Test (실 서비스 URL에서 주요 플로우 실행):
  ```bash
  curl https://noncorverd-backend.onrender.com/health
  ```
- [ ] 모니터링 대시보드 실시간 관찰 (최소 1시간)
- [ ] 사용자 피드백 채널 모니터링
- [ ] 릴리즈 노트 게시

---

> 모든 항목이 체크된 후 Planner에게 최종 Go/No-Go 결정을 요청하세요. No-Go 시에는 Render Dashboard에서 롤백 절차를 실행하고 후속 조치를 문서화해야 합니다.
