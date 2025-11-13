# 스테이징 리그레션 테스트 플랜

프로덕션 배포 전 스테이징 환경에서 수행해야 할 검증 항목을 정리했습니다.

## 1. 준비 사항
- 스테이징 URL (예: `https://staging.nonvovered.com`)
- 백엔드 API 엔드포인트 (예: `https://staging-api.nonvovered.com`)
- 인증 토큰 (`NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN`, `X-Client-Token`)
- 최신 브라우저 (Chrome, Safari, Edge), 모바일 디바이스 혹은 시뮬레이터
- Playwright 환경 (CI 또는 로컬) – `PLAYWRIGHT_BASE_URL`을 스테이징 URL로 설정

## 2. 수동 QA 체크리스트 (요약)
| ID | 항목 | 세부 내용 |
|----|------|-----------|
| QA-01 | 지역 선택 | 시도/시군구 목록 로딩 속도, 캐시 동작 확인 |
| QA-02 | 병원 검색 | 필터(종별) 조합 테스트, 결과 개수 확인 |
| QA-03 | 병원 선택 | 비교 바 표시, 최대 5개 제한, 제거 기능 확인 |
| QA-04 | 비교 페이지 | 가격 테이블 로딩, 공통 항목 모드, 정렬/검색 |
| QA-05 | 모바일 | 스와이프 비교 뷰, 터치 영역 확인 |
| QA-06 | 오류 처리 | API 실패 시 메시지, 재시도 버튼 확인 |
| QA-07 | 접근성 | 키보드 네비게이션, 포커스 표시, 스크린 리더 라벨 |

세부 항목은 `QA_CHECKLIST.md`를 참조하세요. 테스트 결과는 해당 문서의 “검증 결과 기록” 섹션에 기록합니다.

## 3. Playwright E2E 실행
```bash
PLAYWRIGHT_BASE_URL=https://staging.nonvovered.com npm run test:e2e
```

- `playwright-report/` 폴더를 보관하고, GitHub Actions에서 아티팩트로 확인합니다.
- 실패 케이스가 있을 경우 스크린샷/Trace를 공유합니다.

## 4. 로그 검증
- **Vercel Functions**: `/api/opendata` 호출 로그 (Latency, Error Rate)
- **AWS EC2 (PM2)**: `pm2 logs nonvovered-backend --lines 200`
- **CloudWatch**: 시스템 메트릭 (CPU, Network)

## 5. 승인 기준
- 수동 QA 필수 항목(상위 10개) 100% 통과
- Playwright 핵심 시나리오 100% 통과
- 에러 로그 없음 (또는 허용 가능한 수준, 원인 분석 완료)
- 사용자 영향도가 있는 이슈 0건

## 6. 보고 템플릿
- 실행 날짜 / 수행자 / 환경
- 성공 항목 / 실패 항목 / 비고
- 발견된 이슈 (링크 포함)
- 권장 조치 및 차기 액션

> 스테이징 검증이 완료되면 `docs/RELEASE_CHECKLIST.md`의 항목을 업데이트하고, Planner에게 Go/No-Go 결정을 요청하세요.
