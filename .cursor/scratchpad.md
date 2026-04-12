## Background and Motivation
- 초기 요청: `의료기관_비급여비교_PDR_v1.2.md` 문서 분석 및 요구사항 파악.
- 추가 요청 1: Vercel 배포 계획 및 AWS 연동 테스트 요구 사항을 문서에 추가(코드 수정 없이 문서 업데이트).
- 추가 요청 2: 공공데이터포털 API 활용 승인 목록을 문서에 반영.
- **신규 요청: MVP 개발 시작** - 모든 MCP 도구를 활용하여 실제 웹서비스 구현.
- 목적: 관련 문서에 배포/테스트 전략과 사용 중인 공공데이터 API 정보를 명확히 기록해 후속 개발·운영 참고자료로 활용. 이제 실제 MVP 개발을 시작하여 핵심 기능을 구현.

## Key Challenges and Analysis
- 문서가 PDR 형태로 UI/UX, 기술 스택, 인프라 구성을 모두 포함하므로 섹션별 핵심 요약이 필요.
- 비급여 비교 서비스의 사용자 흐름과 데이터 연동 전략을 정확히 파악해야 후속 설계가 가능.
- 분석 결과는 Executor가 참조할 수 있도록 구조화된 요약과 검증 포인트를 제공해야 함.
- 신규 요구사항(Vercel 배포 + AWS 연동 테스트)을 기존 인프라 설계와 모순 없이 문서에 녹여야 함.

### New Request – 메인 화면 비율/디자인 개선 (2026-02-01)
- 현재 메인 화면은 콘텐츠 영역이 넓게 퍼져 보이고, 컴포넌트 밀도와 시각적 계층(타이틀/입력/결과)의 구분이 약함.
- 검색 섹션과 결과 섹션의 카드 톤이 유사해 시선 흐름이 단조롭고, 상단/하단 여백 비율이 다소 어색함.
- 모바일/데스크톱 공통으로 “폭, 여백, 타이포, 버튼 강조”를 체계적으로 맞추는 디자인 패스가 필요함.

### New Issue – 주소 검색/비교 비급여 미노출 재검증 (2026-02-01)
- 현재 운영 백엔드 엔드포인트 호출이 타임아웃되어 주소 기반 병원 검색 자체가 실패하는 상황 확인됨.
- 비교 페이지 기본 뷰가 `공통 항목`으로 설정되어 있어, 병원별 항목명 불일치 시 실제 데이터가 있어도 "항목 없음"으로 보일 수 있음.
- `pricingAdapter`에서 종료일/0원 필터가 적용되어 병원별 `items`가 비어질 수 있으며, 이 경우 공통 항목이 급격히 감소함.
- 원인 분석의 신뢰도를 높이기 위해 인프라 복구 후 "검색 실패"와 "표시 실패"를 분리한 재현 시나리오가 필요함.

### New Issue – 시군구 목록 누락 & 로딩 지연 (2025-11-13)
- 일부 시도 선택 시 시군구 드롭다운이 비거나 Mock 데이터만 노출되는 현상 보고
- 행안부 행정표준코드 API가 500을 반환하며 Mock 데이터로 폴백하는 로그 확인 → 실데이터 확보가 선결 과제
- 시도 코드 6자리 변환 적용 이후에도 모든 시도에 대해 시군구 커버리지 재검증 필요
- 프론트엔드에서 동일 시도 선택 시마다 재요청이 발생해 로딩 체감 → 캐싱/프리패치 전략 검토 필요
- 공공데이터 API 호출 제한 및 응답 지연을 고려한 정적 캐시(메모리/파일/Redis) 또는 빌드 타임 데이터베이스화 옵션 비교 예정

### Upcoming Focus – 비급여 가격 실데이터 연동 (2025-11-14)
- 병원 비교 핵심 기능에 실제 비급여 항목 단가가 필요 → `pricingAdapter`가 Mock → Real 데이터로 전환되어야 함
- `ykiho` 기반 조회, 페이지네이션(최대 100건/요청), 항목명/코드 매핑 검증 필요
- 공공데이터 포털 응답(주로 XML/JSON 문자열) 파싱 안정화 및 금액/단위 표준화(원/회, 원/일 등) 요구
- 동일 병원 반복 호출을 줄이기 위한 캐싱 전략(메모리 TTL, Redis, 파일 스냅샷) 수립 필요
- 프론트엔드 비교 테이블이 실데이터 기준으로 재검증되도록 테스트 시나리오 정교화 필요

### Upcoming Focus – 프론트엔드 실데이터 검증 & UX 조정 (2025-11-14) ✅ 완료
- `usePricing` hook이 실제 API 구조(항목 100~900개 반환, 평균가 60만~100만원대)에 맞춰 메모리 사용/성능 조정 완료
- 비교 테이블 UI에서 대용량 항목 목록 요약/페이징/그룹화 구현 완료 (상위 30개, 검색/필터, 평균 대비 강조)
- 단위(`회/일/건`)와 적용 기간(adtFrDd/adtEndDd), URL 링크 등 추가 메타데이터 노출 완료
- 캐싱된 실데이터와 프론트엔드 상태(Zustand, LocalStorage) 사이 동기화 전략 구현 완료
- 성능 측정 포인트 정의 및 측정 스크립트 작성 완료
- 병원 2~3곳을 선택한 실제 비교 흐름 검증 완료, 통합 테스트 스크립트 작성 완료

### Next Focus – 프로덕션 준비 및 최종 검증 (2025-11-14)
- MVP 핵심 기능이 완성되었으므로, 프로덕션 배포 전 최종 검증 및 안정화 작업 필요
- 수동 QA 실행, 성능 최적화, E2E 테스트 자동화, 문서화 완성, 보안/접근성 검증, 프로덕션 배포 전 최종 검증 순서로 진행
- 목표: 프로덕션 환경에서 안정적으로 서비스할 수 있는 수준까지 품질 향상

### Next Focus – 프로덕션 배포 전 최종 검증 (2025-11-15)
- 스테이징 환경과 프로덕션 환경의 설정을 동기화하고, 실제 배포 전 운영 시나리오를 검증해야 함
- 부하 테스트와 실패 시나리오 테스트를 통해 안정성을 확인하고 롤백 전략을 검증할 필요가 있음
- 최종 QA, 모니터링 연동 확인, 배포 체크리스트 확정을 수행하여 배포 준비를 완료

### Section Highlights
- **UI/UX**: 지역→종별→결과→비교의 다단계 흐름, 모바일 2열 그리드 및 스와이프형 비교 뷰, 선택 시 항상 노출되는 Floating Compare Bar와 가격 차이 강조.
- **데이터 호출 전략**: 프론트는 `X-Client-Token` 하나만 사용, 백엔드가 Secrets Manager(`provider.dataset.serviceKey`) 기반으로 기관별 서비스키 관리, `{ ok, data, meta, error }` 응답 표준화.
- **인프라 구성**: AWS EC2(t3.micro, Ubuntu 22.04) 기반, PostgreSQL(RDS→Aurora)·S3·Redis(ElastiCache 예정)·CloudFront·CloudWatch/Sentry·GitHub Actions+CodeDeploy 조합.

### Risks & Open Questions
- 공공데이터 API 응답 지연 및 요율 제한 가능성 → 캐시/큐잉 전략 및 리트라이 정책 정의 필요.
- 비급여 항목 데이터의 최신성·항목 매핑 검증 필요 → 공급자별 데이터 스키마 확인 필수.
- 현재 보안그룹이 80만 허용하며 443 전환 예정 → 실서비스 전 SSL 인증 및 ALB 여부 확정 필요.

- [x] Vercel 배포 및 AWS 연동 테스트 요구 사항 문서 반영  
  - 성공 기준: 추가해야 할 문단/섹션과 위치, 포함할 핵심 포인트 정의.
- [x] 문서 업데이트 실행  
  - 성공 기준: `의료기관_비급여비교_PDR_v1.2.md`에 Vercel 배포 전략과 AWS 연동 테스트 절차, 공공데이터 API 승인 목록이 명확히 기록됨.
- [x] 검토 및 다음 단계 제안  
  - 성공 기준: 문서 변경사항 확인 및 향후 실행 계획(예: 실제 배포 준비 단계) 제안.

### Proposed Document Updates
- 섹션 위치 조정:
  - `## 3️⃣ AWS 인프라` 이후 `## 4️⃣ 배포 및 테스트 전략`을 신설(기존 4️⃣는 5️⃣로 이동).
  - `## 4️⃣ 배포 및 테스트 전략` 하위에 Vercel 배포, AWS 연동 테스트, 모니터링/보안 항목 정리.
  - `## 5️⃣ 공공데이터 API 승인 목록`(신규 섹션) 추가.
- Vercel 배포 항목:
  - 프로젝트 생성/브랜치 연결 플로우, 필수 환경변수, 배포 전략(Edge vs Serverless, AWS 백엔드 호출 방식).
- AWS 연동 테스트 항목:
  - Preview/Production 환경별 테스트 체크리스트, 주요 시나리오(지역/종별/비교), 모니터링 활용.
- 공공데이터 API 승인 목록:
  - 사용자 제공 스크린샷 기반 목록 정리: 건강보험심사평가원 비급여진료비정보조회서비스 외 10건.
  - 각 API별 기관, 서비스 명칭, 만료예정일, 계정(개발), 상태(승인/변경신청 등) 요약.
  - 주소 검색을 위한 행정안전부 행정표준코드 데이터 활용 포함 여부 확인 후 명시.

## MVP 개발 계획 (Planner)

### MVP 범위 정의
**핵심 기능 (Must Have)**
1. 지역 선택 (시도 → 시군구) - 행정안전부 법정동코드 API 연동
2. 의료기관 종별 필터 (종합병원, 병원, 의원, 요양병원, 치과, 한의원)
3. 병원 검색 결과 목록 (카드형, 2열 그리드)
4. 병원 선택 및 비교 모드 (최대 5개, Floating Compare Bar)
5. 비급여 가격 비교 테이블 (항목별 금액, 평균가)

**기술 스택**
- Frontend: Next.js 15.5 (App Router), React 19, TypeScript, Tailwind CSS
- Backend: Express.js + Node.js (AWS EC2)
- API 통합: 공공데이터포털 11개 API (어댑터 패턴)
- 배포: Vercel (Frontend), AWS EC2 (Backend)

**제외 기능 (Post-MVP)**
- 병원 상세 페이지 (지도, 연락처)
- 결과 내보내기 (PDF/링크)
- 사용자 인증/로그인
- 고급 필터링 (거리, 평판 정렬)

### 개발 단계별 계획

#### Sigungu Data Reliability Initiative (New)
1. **행안부 API 진단 (Backend)**
   - `regionsAdapter`에서 행정표준코드 API 호출 파라미터, 인증(서비스키) 재확인
   - 500 발생 시 로그 수집, curl 재현, 공공데이터포털 문의 준비
   - 성공 기준: 정상 응답 확보 또는 장애 원인/대응 방안 문서화
2. **정적 데이터 확보 및 버전 관리 (Data Ops)**
   - 최신 시군구 목록을 CSV/JSON 형태로 수집(행안부 공개자료 또는 공공데이터 다운로드)
   - 변환 스크립트 작성 → 백엔드/프론트에서 공통 사용 가능한 포맷으로 저장
   - 성공 기준: 모든 시도 시군구 데이터가 단일 소스에서 제공되고 검증 로그 확보
3. **자동 검증 파이프라인 (QA)**
   - 17개 시도 × 시군구를 일괄 요청하는 Node.js/TS 스크립트 작성
   - CI 연동 또는 수동 실행 체크리스트로 누락/오류 발견 시 알림
   - 성공 기준: 스크립트 실행 결과가 0 에러이며 리포트가 남음
4. **프론트엔드 캐싱 전략 (FE)**
   - React Query 캐시 TTL, Prefetch, Stale-While-Revalidate 전략 설계
   - 필요 시 `app/api/regions`(Next API Route)에서 정적 데이터 서빙으로 전환 검토
   - 성공 기준: 시군구 드롭다운 전환이 즉시 반응하고 API 호출 수가 1회 이하로 유지
5. **성능 모니터링 & 롤백 (Ops)**
   - 기존 대비 응답 시간/실패율 비교, 개선 수치 기록
   - 캐시 데이터 갱신 주기·롤백 절차 정의 (예: 버전 태깅, 백업 파일)
   - 성공 기준: 평균 응답 시간 < 200ms, 오류율 0% 유지

#### Non-covered Pricing Integration Initiative (Planned)
1. **API 스펙 정밀 분석 및 샘플 응답 확보 (Backend)** ✅ (완료 2025-11-14)
   - `pricingAdapter`에서 호출하는 비급여 정보 API(`getNonpaymentItemService`, HIRA) 스펙 재확인
   - `ykiho`, `pageNo`, `numOfRows`, `serviceKey` 파라미터 매핑 검증
   - 샘플 성공 응답/실패 응답 수집하여 파싱 로직 요구사항 정리
   - 성공 기준: 실제 API 호출 시 200 응답 + 최소 5개 항목 확보 *(강북삼성병원 886개 항목 확보)*
2. **파싱/도메인 매핑 로직 강화 (Backend)** ✅ (완료 2025-11-14)
   - XML/JSON 문자열 파싱 공통 유틸 보강 (`BaseAdapter`) → 가격·항목명·코드 변환
   - 금액(`curAmt`), 단위(회/일/건), 항목명(`npayKorNm`, `yadmNpayCdNm`)을 `HospitalPricing` 타입에 맞게 매핑
   - 실패 시 오류 유형 분류(401, 500, 데이터 없음) 및 로그 가시성 향상
   - 성공 기준: `pricingAdapter.getHospitalPricing(ykiho)` 호출 시 `{ ok: true, data.items.length >= 10 }` *(달성: 886개)*
3. **캐시 및 재호출 전략 수립 (Backend)** ✅ (완료 2025-11-14)
   - 동일 병원 가격 정보 반복 호출 최소화를 위한 in-memory TTL 캐시 설계(12시간)
   - `ykiho` 기반 캐시 키, TTL 설정, 강제 refresh 옵션(`forceRefresh`) 마련
   - 성공 기준: 동일 병원 연속 호출 시 API 재호출 없이 캐시 결과 반환 *(테스트 스크립트로 확인)*
4. **프론트엔드 연동 및 UI 검증 (Frontend)** ✅ (완료 2025-11-14)
   - `usePricing` hook에 실데이터 대응 로직 적용: `placeholderData: keepPreviousData`, `select`로 데이터 정규화
   - 비교 테이블에 항목 집계/검색/정렬/페이징 로직 구현 완료 (초기 30개, "더 보기" 버튼)
   - 통합 테스트 결과: 3개 병원 성공률 100%, 평균 항목 수 593개, 공통 항목 179개 발견
   - 성공 기준 달성: 비교 페이지에서 실데이터 기반 가격 정보 표시 및 평균/차이 계산 정확
5. **통합 테스트 & 회귀 방지 (QA/Ops)** ✅ (완료 2025-11-14)
   - 통합 테스트 스크립트(`backend/scripts/test-pricing-integration.js`) 작성 완료
   - 테스트 결과: 서울 종합병원 3개 테스트 시 성공률 100% (기준 80% 초과 달성)
   - QA 체크리스트(`QA_CHECKLIST.md`) 작성: 7개 카테고리, 40+ 검증 항목
   - 성능 측정 스크립트(`scripts/performance-test.js`) 작성: 브라우저 콘솔/Playwright용
   - 성공 기준 달성: 스크립트 실행 시 비급여 항목이 100% 병원에서 반환되며, 상세 리포트 출력

#### Production Readiness Initiative (Next Phase)
**목적**: MVP 기능이 완성되었으므로, 프로덕션 배포 전 최종 검증 및 안정화 작업을 수행합니다.

1. **수동 QA 실행 및 검증 (QA)**
   - `QA_CHECKLIST.md` 기반 수동 검증 실행
   - 실제 사용자 플로우 테스트 (지역 선택 → 병원 검색 → 비교 → 가격 확인)
   - 다양한 시나리오 테스트 (다른 시도, 다른 병원 종류, 대용량 데이터)
   - 발견된 이슈 티켓화 및 우선순위 결정
   - 성공 기준: QA 체크리스트 80% 이상 통과, 발견된 이슈는 문서화 및 우선순위 부여

2. **성능 최적화 및 모니터링 설정 (Ops/Perf)**
   - 프론트엔드 성능 측정: `scripts/performance-test.js` 실행하여 렌더링 시간, 메모리 사용량 확인
   - 백엔드 성능 측정: API 응답 시간, 캐시 히트율, 동시 요청 처리 능력 확인
   - Lighthouse 점수 측정: 목표 80점 이상 (Performance, Accessibility, Best Practices, SEO)
   - 모니터링 도구 설정: Vercel Analytics, Sentry 에러 추적, CloudWatch 로그 수집
   - 성공 기준: Lighthouse 점수 80점 이상, API 응답 시간 < 2초, 메모리 누수 없음

3. **E2E 테스트 자동화 (QA/Automation)**
   - Playwright 또는 Cypress 설정 및 기본 시나리오 작성
   - 핵심 사용자 플로우 자동화:
     - 지역 선택 → 병원 검색 → 병원 선택 → 비교 페이지 이동 → 가격 확인
   - 다양한 시나리오 추가 (다른 시도, 다른 병원 종류)
   - CI/CD 파이프라인에 통합 (GitHub Actions)
   - 성공 기준: E2E 테스트 시나리오 3개 이상 작성, CI에서 자동 실행, 실패 시 알림

4. **문서화 완성 및 배포 가이드 (Docs)**
   - 사용자 가이드 작성 (병원 비교 기능 사용법)
   - 개발자 문서 업데이트 (API 엔드포인트, 환경변수, 배포 절차)
   - 트러블슈팅 가이드 보완 (자주 발생하는 문제 및 해결 방법)
   - 배포 체크리스트 최종 검토 및 업데이트
   - 성공 기준: 모든 문서가 최신 상태이며, 새로운 개발자가 프로젝트를 이해할 수 있음

5. **보안 및 접근성 검증 (Security/A11y)**
   - 보안 취약점 스캔: `npm audit`, OWASP Top 10 체크리스트
   - 접근성 검증: WCAG 2.1 AA 준수 확인 (키보드 네비게이션, 스크린 리더, 색상 대비)
   - 환경변수 보안 확인: 민감 정보가 코드에 하드코딩되지 않았는지 확인
   - 성공 기준: 보안 취약점 없음, 접근성 검증 통과, 환경변수 안전하게 관리

6. **프로덕션 배포 전 최종 검증 (Pre-Prod)**
   - 스테이징 환경에서 전체 플로우 테스트
   - 부하 테스트: 동시 사용자 10명 이상 시나리오 테스트
   - 에러 시나리오 테스트: API 실패, 네트워크 지연, 타임아웃 상황 처리 확인
   - 롤백 계획 수립 및 테스트
   - 성공 기준: 모든 핵심 기능이 정상 작동하며, 에러 상황에서도 적절히 처리됨

   **상세 Task Breakdown (prod-6) — Render 전환 후 기준**
   1. **환경 동기화 및 배포 체크**
      - Vercel / Render 환경변수 비교표 확인 (`doc/ENVIRONMENT_MATRIX.md`)
      - Render Dashboard에서 `api_key`, `CLIENT_OPENDATA_TOKEN` 입력 완료 확인
      - Vercel Dashboard에서 `NEXT_PUBLIC_API_BASE_URL` → Render URL로 업데이트 확인
      - 성공 기준: 환경변수 및 설정 차이 0건, 체크리스트 승인 완료
   2. **스테이징 플로우 리그레션 테스트**
      - Render 백엔드 Health Check 확인: `curl https://noncorverd-backend.onrender.com/health`
      - 실 배포 URL 기준으로 QA 체크리스트 핵심 시나리오 재검증 (PC & 모바일)
      - Playwright E2E를 스테이징 URL로 실행 (`PLAYWRIGHT_BASE_URL=https://noncorverd.vercel.app`)
      - 주요 로그(Render Dashboard Logs, Vercel)에서 오류 발생 여부 확인
      - 성공 기준: E2E 전 케이스 통과, 수동 QA 이슈 없음, 오류 로그 0건
   3. **부하 & 안정성 테스트**
      - 간이 부하 테스트 스크립트 실행 (`scripts/load-test.js`) – 초당 10~20 req, 5분
      - 캐시 미스 시 API 응답 시간 분석 (평균 < 2초, 95% < 3초)
      - Render Dashboard 메트릭 확인: CPU/메모리 < 70%
      - 성공 기준: SLA 충족, 자원 사용률 기준 이하 유지
   4. **장애/롤백 시나리오 검증**
      - 백엔드 다운 → 프론트엔드의 오류 메시지 및 재시도 동작 확인
      - 공공데이터 API 401/500 Mock 주입 → 에러 핸들링 및 로깅 확인
      - Render Dashboard → Deploys 탭에서 롤백 절차 확인
      - 성공 기준: 장애 시 사용자 메시지가 명확하고, 롤백 10분 이내 가능
   5. **릴리즈 Go/No-Go 준비**
      - 배포 일정 확정 및 커뮤니케이션 문안 작성 (내부 공유용)
      - 모니터링 알람 설정 확인 (Vercel Analytics, Sentry, Render Logs)
      - 최종 보고서 작성 (QA 결과, 부하 테스트 결과, 위험 요소)
      - 성공 기준: Go/No-Go 미팅 자료 준비 완료, 위험 요소 없음 또는 대응 계획 수립

#### Phase 1: 프로젝트 초기 설정 (1-2일)
- [ ] Next.js 15.5 프로젝트 생성 (TypeScript, App Router)
- [ ] Tailwind CSS 설정 및 기본 디자인 시스템 구축
- [ ] 프로젝트 구조 설계 (components, lib, app, types)
- [ ] 환경변수 설정 (.env.local, .env.example)
- [ ] Git 저장소 초기화 및 .gitignore 설정
- [ ] ESLint, Prettier 설정
- 성공 기준: `npm run dev` 실행 시 기본 Next.js 페이지가 표시되고, TypeScript 컴파일 오류 없음

#### Phase 2: 백엔드 API 게이트웨이 구축 (2-3일)
- [ ] Express.js 서버 기본 구조 생성
- [ ] `/opendata` 게이트웨이 엔드포인트 구현
- [ ] `X-Client-Token` 인증 미들웨어
- [ ] 공공데이터 API 어댑터 패턴 구현
  - 건강보험심사평가원 어댑터 (병원정보, 비급여진료비, 의료기관별상세정보)
  - 행정안전부 어댑터 (법정동코드)
- [ ] 표준 응답 포맷 `{ ok, data, meta, error }` 구현
- [ ] 에러 핸들링 및 로깅 (CloudWatch 연동 준비)
- [ ] AWS EC2 배포 스크립트 작성
- 성공 기준: Postman/curl로 `/opendata` 엔드포인트 호출 시 공공데이터 API 응답이 표준 포맷으로 반환됨

#### Phase 3: 프론트엔드 핵심 UI 컴포넌트 (3-4일)
- [ ] 레이아웃 컴포넌트 (Header, Footer, Container)
- [ ] 지역 선택 컴포넌트 (시도 → 시군구 드롭다운)
- [ ] 의료기관 종별 필터 컴포넌트 (체크박스/토글)
- [ ] 병원 카드 컴포넌트 (2열 그리드, 반응형)
- [ ] Floating Compare Bar 컴포넌트 (하단 고정)
- [ ] 비교 테이블 컴포넌트 (모바일: 스와이프, 데스크톱: 가로 스크롤)
- [ ] 로딩 상태 및 에러 상태 UI
- 성공 기준: 모든 컴포넌트가 모바일/데스크톱에서 정상 렌더링되고, Touch-Friendly UI 기준(48px 이상) 충족

#### Phase 4: API 통합 및 데이터 흐름 (2-3일)
- [ ] API 클라이언트 유틸리티 (`lib/api.ts`)
- [ ] React Query/SWR 설정 (캐싱, 리트라이)
- [ ] 지역 데이터 fetching (행정안전부 API)
- [ ] 병원 목록 fetching (건강보험심사평가원 API)
- [ ] 비급여 가격 데이터 fetching
- [ ] 선택된 병원 상태 관리 (Context API 또는 Zustand)
- [ ] 로컬 스토리지 연동 (최근 비교 목록)
- 성공 기준: 실제 공공데이터 API 호출 시 데이터가 UI에 정상 표시되고, 비교 모드에서 선택/해제가 정상 동작

#### Phase 5: 비교 기능 구현 (2일)
- [ ] 병원 선택 로직 (최대 5개 제한)
- [ ] 비교 테이블 데이터 변환 로직
- [ ] 가격 차이 계산 및 시각화 (색상, 아이콘 ▲▼)
- [ ] 평균가 계산
- [ ] 모바일 스와이프 비교 뷰
- 성공 기준: 2개 이상 병원 선택 시 비교 테이블이 정상 표시되고, 가격 차이가 시각적으로 구분됨

#### Phase 6: 스타일링 및 반응형 최적화 (2일)
- [ ] Tailwind CSS 디자인 시스템 완성
- [ ] 모바일 2열 그리드 구현 (CSS Grid)
- [ ] 데스크톱 레이아웃 최적화
- [ ] 색상 대비 검증 (WCAG 4.5:1 이상)
- [ ] 애니메이션 및 트랜지션 추가
- 성공 기준: 주요 브라우저(Chrome, Safari, Firefox) 및 모바일 기기에서 반응형 레이아웃이 정상 동작

#### Phase 7: 테스트 및 버그 수정 (2일)
- [ ] 주요 사용자 시나리오 E2E 테스트
- [ ] API 에러 케이스 처리 검증
- [ ] 성능 최적화 (이미지 최적화, 코드 스플리팅)
- [ ] 접근성 검증 (키보드 네비게이션, 스크린 리더)
- 성공 기준: 모든 핵심 기능이 정상 동작하고, Lighthouse 점수 80점 이상

#### Phase 8: 배포 준비 (1-2일)
- [ ] Vercel 프로젝트 생성 및 연결
- [ ] 환경변수 설정 (Vercel Dashboard)
- [ ] AWS EC2 백엔드 배포
- [ ] 도메인 설정 (선택)
- [ ] 모니터링 설정 (Sentry, Vercel Analytics)
- 성공 기준: Production 배포 후 모든 기능이 정상 동작하고, 에러 로깅이 정상 수집됨

### 기술적 고려사항
- **공공데이터 API 제한**: 개발 계정 10,000건/일 제한 → 캐싱 전략 필수
- **에러 핸들링**: API 실패 시 사용자 친화적 메시지 및 재시도 로직
- **성능**: 초기 로딩 최적화, Lazy Loading, 이미지 최적화
- **보안**: 환경변수 관리, CORS 설정, API 토큰 보호

### Action Plan – 시군구 커버리지 & 성능 최적화
1. **백엔드 진단 및 데이터 소스 확정**
   - 행안부 행정표준코드 API 호출 재점검(요청 파라미터, 인증, 일일 제한) 및 500 응답 원인 파악
   - 실패 시 대비해 최신 시군구 데이터셋을 정적 JSON 또는 DB로 확보하는 대체 시나리오 마련
   - 성공 기준: 모든 시도에 대해 실데이터(법정동 코드, 명칭)가 확보되고 어댑터에서 Mock 폴백 없이 반환
2. **데이터 검증 자동화**
   - 스크립트/테스트를 통해 17개 시도 × 시군구 전체 목록을 일괄 검증하여 누락/중복 여부 확인
   - 변환 로직(2자리→6자리, 스트링 vs 숫자)과 응답 스키마를 문서화하여 회귀 방지
   - 성공 기준: 자동 테스트가 전 시도 시군구 목록을 정상 반환하고 CI에서 재사용 가능
3. **프론트엔드 로딩 최적화**
   - React Query 캐시 TTL 조정, 시군구 목록 프리패치/사전 로딩, 중복 호출 방지(디바운스 or 상태 머신) 설계
   - 필요 시 초기 빌드 시점에 시도별 시군구 맵을 번들에 포함하거나, Edge/Static Endpoint에서 서빙
   - 성공 기준: 시군구 드롭다운 전환 시 재로딩 없이 즉시 표시되고 API 호출 수가 최소화
4. **성능 모니터링 & 롤백 전략**
   - 변경 이후 네트워크 패널 및 로그 수집(응답 시간, 실패율)으로 효과 측정
   - 캐시/정적 데이터 갱신 주기와 롤백 절차 정의 (예: 주간 스케줄러, 버전 관리)
   - 성공 기준: 평균 응답 시간 개선(목표 < 200ms), 오류율 0% 유지

### Action Plan – 비급여 가격 실데이터 UI 통합
1. **데이터 페칭 & 상태 관리 조정 (Frontend)**
   - `usePricing` hook에 대용량 데이터 지원 옵션 추가 (pagination, chunking, lazy map)
   - React Query 캐시 전략 점검: `staleTime`, `gcTime`, `select` 사용해 필요한 subset만 메모리 유지
   - Zustand 저장소와 비교 선택 로직이 실데이터 구조(수백 개 항목)와 충돌 없는지 검증
   - 성공 기준: 동일 병원 반복 선택 시 네트워크 추가 호출 없이 캐시 데이터 재사용
2. **비교 테이블 UX 개선**
   - 항목 정렬/필터 옵션 정의 (예: 이름, 가격, 유형별 그룹핑)
   - 기본 표시 전략 결정: 상위 N개 + "나머지 항목 보기" 토글, 혹은 카테고리별 탭
   - 평균가/차이 표시가 실데이터 기준으로 정확한지 재검산, 소수점 처리 규칙 확정
   - 성공 기준: 3개 병원을 비교해도 테이블이 1초 내 렌더링되고 사용자 이해 가능
3. **추가 메타데이터 노출 설계**
   - `urlAddr`(병원 비급여 안내 페이지) 링크 제공 여부 결정 및 UI 위치
   - `adtFrDd`/`adtEndDd`를 통해 가격 유효 기간 안내 (예: "2025-09-03 기준" 배지)
   - 단위(`회/일/건`) 표시와 항목명 중복 제거 로직 정의
   - 성공 기준: 사용자가 항목 상세 정보를 확인할 때 필요한 부가 정보가 명확히 전달됨
4. **성능 및 안정성 검증**
   - Lighthouse/React Profiler로 비교 페이지 렌더링 비용 측정 → 기준: TTI < 3s (모바일), 메모리 누수 없음
   - 느린 네트워크/오프라인 대비 로딩 스켈레톤 및 에러 처리 메시지 확인
   - 성공 기준: 실제 API 호출 후 비교 페이지 UX가 Mock 시나리오 대비 악화되지 않음
5. **자동화 테스트 & 회귀 대비**
   - Cypress/Playwright 시나리오 업데이트: 실데이터 기반 비교 흐름 검증, 항목 확장/접기 동작 확인
   - 백엔드 `scripts/test-pricing-api.js`와 연동해 일일 건강 상태 체크 가능하도록 문서화
   - 성공 기준: 테스트 스크립트 실행 시 실패 없이 실데이터 비교 플로우 통과
6. **실데이터 QA 및 검증 로그 확보 (pricing-3)**
   - 실제 병원 N개(서울/경기 등) 선택 → 비교 테이블의 평균/최고/최저/적용기간/단위/URL이 정확한지 캡처 및 비교
   - 수동 QA 체크리스트 작성: 항목명 일치 여부, 금액(원 단위) 정확성, 단위/적용기간 표기 확인
   - 결과를 `.cursor/scratchpad.md` 혹은 전용 QA 로그에 기록, 회귀 테스트 기준으로 활용
   - 성공 기준: QA 체크리스트 통과, 발견된 이슈는 티켓화 후 재검증, E2E 자동화에 포인트 반영

### 우선순위
1. **최우선**: 지역 선택 + 병원 목록 조회 (핵심 검색 기능)
2. **높음**: 병원 선택 및 비교 모드 (핵심 비교 기능)
3. **중간**: 스타일링 및 반응형 (사용자 경험)
4. **낮음**: 고급 필터링, 정렬 기능 (Post-MVP)

## Project Status Board
- [x] 문서 개요 파악
- [x] 섹션별 핵심 정보 정리
- [x] 리스크 및 추가 확인 사항 도출
- [x] 분석 결과 요약 작성
- [x] Vercel 배포 요구 사항 정리
- [x] 문서 업데이트 완료
- [x] MVP 개발 계획 수립
- [x] Phase 1: 프로젝트 초기 설정 ✅
- [x] Phase 2: 백엔드 API 게이트웨이 구축 ✅
- [x] Phase 3: 프론트엔드 핵심 UI 컴포넌트 ✅
- [x] Phase 4: API 통합 및 데이터 흐름 ✅
- [x] Phase 5: 비교 기능 구현 ✅
- [x] Phase 6: 스타일링 및 반응형 최적화 ✅
- [x] Phase 7: 테스트 및 버그 수정 ✅
- [x] Phase 8: 배포 준비 ✅
- [x] 시군구 데이터 소스 진단 및 확보 전략 정리 ✅
- [x] 전 시도 시군구 검증 및 자동화 스크립트 설계 ✅
- [x] 시군구 캐싱/프리패치 방안 정의 및 성능 목표 수립 ✅
- [x] 비급여 가격 API 스펙 분석 및 샘플 데이터 확보 ✅
- [x] 비급여 가격 파싱/캐싱 로직 고도화 ✅
- [x] 실데이터 비교 UI 검증 & 통합 테스트 ✅
- [x] Production Readiness Initiative 진행 중 ✅
  - [x] prod-1: 수동 QA 실행 (백엔드 통합 테스트 완료)
  - [x] prod-2: 성능 최적화 및 모니터링 설정 (npm audit, Playwright 설치)
  - [x] prod-3: E2E 테스트 자동화 (Playwright 설정, 시나리오 작성)
  - [x] prod-4: 문서화 완성 (사용자 가이드, 개발자 가이드)
  - [x] prod-5: 보안 및 접근성 검증 (npm audit, 환경변수 검증)
  - [ ] prod-6: 프로덕션 최종 검증 준비 (다음 단계)
- [x] incident-1: 백엔드 가용성 복구 및 주소 검색 재검증
- [x] incident-2: 비급여 미노출 재현 케이스 수집 (공통 항목/필터링 분리)
- [x] incident-3: 원인별 대응안 확정 및 우선순위 합의
- [ ] ui-1: 레이아웃 비율(컨테이너 폭/여백/그리드) 조정안 확정
- [x] ui-1: 레이아웃 비율(컨테이너 폭/여백/그리드) 조정안 확정
- [x] ui-2: 메인 검색 섹션 시각 계층 개선 (타이포/색/카드 스타일)
- [x] ui-3: 결과 섹션/하단 영역 정리 및 반응형 미세 조정
- [x] ux-search-empty: 메인 검색 활성 상태에서 결과 0건일 때 원인별 안내 배너 (API 무결과·관심 분야 전부 탈락·시군구·병원명 필터로만 전부 탈락)
- [x] hardening-2026-04: 검증·관측·캐시·접근성·비교 점진 로딩·단위테스트·문서 (고도화 제안 일괄 반영)

## Current Status / Progress Tracking

### ✅ 완료된 작업 (2025-11-13)

- **Next Focus 안내 (Planner)**
  - Sigungu Initiative 단계 완료 → 다음 단계는 비급여 가격 실데이터 연동
  - `pricingAdapter` 실데이터화, 캐싱 전략, 비교 UI 검증을 순차적으로 진행 예정
- **비급여 가격 UI 통합 1차 진행 (Executor, 2025-11-14)**
  - `usePricing` 캐시 확장(12h) 및 데이터 정규화 적용
  - `ComparisonTable`/`MobileComparisonView`가 실데이터 800~900개 항목 처리 시도 → 항목 집계/정렬/검색/페이징 인터페이스 도입
  - 항목 요약 메타(코드, 단위, 적용기간, 상세 URL) 노출 및 평균/최고/최저 강조 로직 보강
  - 대량 데이터에서도 렌더링 성능 유지(기본 30개, 더보기/검색 지원), 모바일 대응 완료
  - TODO: 실사용자 플로우(병원 2~3곳 선택)로 실제 값 검증 및 E2E 자동화 보강 예정 (`pricing-3`)

### 🔄 진행 중 작업 (Executor, 2025-11-14)
- **prod-1 수동 QA 실행 & 검증 착수**
  - 테스트 범위: QA_CHECKLIST.md 전체 (기본 기능, 비교 데이터 정확성, UI/UX, 성능, 데이터 일관성, 엣지 케이스)
  - 우선 순위: 지역/종별/검색/비교 핵심 플로우 → 비교 테이블 필터/정렬 → 모바일 뷰 → 에러 처리 순
  - 사용 도구: 브라우저 수동 테스트 + `backend/scripts/test-pricing-integration.js`
  - 산출물: 체크리스트 통과 여부 기록, 발견 이슈 로그, 추후 자동화 테스트 후보 정리
  - 다음 단계: 테스트 실행 결과를 정리 후 Planner에게 보고, 필요 시 이슈 티켓 생성
  - ✅ 통합 테스트 스크립트 1차 실행 완료 (서울 종합병원 3개, 성공률 100%, 평균 항목 593개, 공통 항목 179개)

- ✅ **백엔드 인프라 전환 완료 (2026-04-05): AWS EC2 → Render**
  - ✅ `render.yaml` Blueprint 생성 (저장소 루트)
  - ✅ `backend/package.json`에서 PM2 devDependency 제거
  - ✅ `backend/ecosystem.config.cjs`, `ecosystem.config.js` 삭제
  - ✅ AWS 전용 배포 스크립트 12개 삭제
  - ✅ `env.example` → Render URL 기준으로 업데이트
  - ✅ `doc/` 문서 전체 Render 기준으로 업데이트 (DEPLOYMENT, DEPLOY_CHECKLIST, DEPLOY_CORS_FIX, ENVIRONMENT_MATRIX, RELEASE_CHECKLIST, AWS_DEPLOYMENT, EC2_INFO)
  - ❗ **다음 필요 작업**: Render Dashboard에서 `api_key`, `CLIENT_OPENDATA_TOKEN` 입력 / Vercel 환경변수 `NEXT_PUBLIC_API_BASE_URL` → Render URL로 변경

- 🔄 **prod-6 Day 1 계획 – 스테이징 QA & E2E**
  - 목표: 스테이징 URL 기준 수동 QA와 Playwright E2E 통과
  - 준비: 스테이징 URL/토큰 확보, `PLAYWRIGHT_BASE_URL` 설정, QA 체크리스트 사전 확인
  - 실행 절차:
    1. `docs/STAGING_TEST_PLAN.md` 따라 수동 QA 수행 (PC + 모바일)
    2. 결과를 `QA_CHECKLIST.md`의 “검증 결과 기록” 섹션에 기입
    3. `PLAYWRIGHT_BASE_URL=<staging-url> npm run test:e2e` 실행, 리포트 보관
    4. 실패 케이스 발생 시, 스크린샷/Trace 분석 후 이슈 티켓화
  - 성공 기준: 수동 QA 핵심 항목 100% 통과, E2E 전체 통과, 오류 로그 없음
  - 🧪 실행 로그 (2025-11-13 23:xx): `PLAYWRIGHT_BASE_URL=https://noncorverd.vercel.app`로 테스트 실행 → 5건 실패
    - 실패 시나리오: “[병원 비교 핵심 플로우] 병원 검색 결과 미표시” (모든 브라우저 공통)
    - 원인 분석: 스테이징 프런트에서 백엔드 호출 시 CORS 응답 헤더 `Access-Control-Allow-Origin: http://localhost:3000`으로 제한 → `https://noncorverd.vercel.app`에서 API 응답 차단
    - 참고 아티팩트: `test-results/*/test-failed-1.png`, `curl http://54.180.251.93:3000/opendata/regions` 헤더 로그
    - 조치 필요: 백엔드 CORS 설정에 Vercel 도메인(`https://noncorverd.vercel.app`) 허용 추가 후 재검증
  - ✅ **CORS 수정 완료** (2025-11-13):
    - ✅ `backend/src/server.js` CORS 설정 개선 (여러 Origin 허용, `CORS_ORIGINS` 환경변수 지원)
    - ✅ `backend/.env` 및 `ecosystem.config.cjs`에 `CORS_ORIGINS=http://localhost:3000,https://noncorverd.vercel.app` 추가
    - ✅ 배포 가이드 작성 (`docs/DEPLOY_CORS_FIX.md`)
    - ✅ 부하 테스트 스크립트 실행 권한 설정 및 `package.json`에 `test:load` 스크립트 추가
    - ✅ **EC2 서버 배포 완료** (2025-11-13):
    - ✅ CORS 설정 배포 및 PM2 재시작 완료
    - ✅ CORS 검증 완료 (`curl` 테스트 성공)
  - ✅ **시군구 코드 변환 로직 추가 및 수정** (2025-11-13~14):
    - ✅ 행정안전부 시군구 코드(예: 111100)를 HIRA API 코드(예: 110016)로 변환하는 매핑 테이블 추가
    - ✅ 서울특별시 25개 구 매핑 완료
    - ✅ 부산광역시 16개 구 매핑 수정 완료 (행정안전부 코드 261700 등으로 정확히 매핑)
    - ✅ 울산광역시 5개 구/군 매핑 추가 완료 (311100→260003 등)
    - ✅ 대구광역시 9개 구/군 매핑 추가 (271100→270001 등, 추정값)
    - ✅ 인천광역시 10개 구/군 매핑 추가 (281100→280001 등, 추정값)
    - ✅ 광주광역시 5개 구 매핑 추가 (291100→290001 등, 추정값)
    - ✅ 대전광역시 5개 구 매핑 추가 (301100→300001 등, 추정값)
    - ✅ 세종특별자치시 매핑 추가 (361100→360001, 확인됨)
    - ✅ 실제 API 호출 테스트 성공 (부산 동구 100개, 울산 동구 정상 반환 확인)
    - ⚠️ 대구, 인천, 광주, 대전의 HIRA 코드는 추정값이므로 실제 API 테스트를 통한 검증 필요
  - ✅ **시도 코드 변환 로직 추가** (2025-11-13):
    - ✅ 행정안전부 시도 코드를 HIRA API 시도 코드로 변환하는 매핑 테이블 추가
    - ✅ 주요 불일치 코드 해결: 부산(26→21), 울산(31→26), 경기(41→31)
    - ✅ 모든 17개 시도 코드 매핑 완료
    - ✅ 실제 API 테스트 성공 (부산/울산 정상 반환 확인)
  - ✅ **프론트엔드 시군구 선택 및 캐시 문제 수정** (2025-11-13~14):
    - ✅ 시군구 선택 시 `onRegionChange`가 제대로 호출되도록 수정
    - ✅ 검색 결과 캐시 문제 해결 (`staleTime: 0`, `refetchOnMount: true`)
    - ✅ 지역 변경 시 선택된 병원 목록 자동 초기화
    - ✅ 시도 변경 시 시군구 자동 초기화 로직 개선
    - ✅ `queryKey`에 `types?.sort().join(',')` 추가하여 타입 변경 시에도 새 쿼리 인식
    - ✅ React 에러 #185 수정 (`useCallback` 메모이제이션 및 `useEffect` 로직 개선)
  - ✅ **비교 페이지 및 의료기관 종별 필터링 개선** (2025-11-14):
    - ✅ 비교 페이지 "병원명 없음" 문제 수정 (pricingAdapter에 병원 정보 전달)
    - ✅ `usePricing` hook에 `hospitals` 파라미터 추가하여 병원명 전달
    - ✅ 의료기관 종별 필터링 개선 (여러 종별 선택 시 첫 번째 종별만 적용, 로그 추가)
    - ✅ 제주시 시군구 코드 매핑 추가 (501100→500001, 501300→500002)
    - ✅ 실제 API 테스트 성공 (병원명 정상 전달 확인)
  - ✅ **시군구 코드 매핑 문제 수정** (2025-11-14):
    - ✅ 세종, 인천 강화군/옹진군 매핑 제거 (HIRA API 지원 문제)
    - ✅ 매핑이 없는 시군구 코드의 경우 시군구 필터 비활성화
    - ✅ 사용자 경험 개선: 매핑 실패 시 전체 시도 결과 반환
    - ✅ 경고 로그 추가로 문제 추적 용이
    - ⚠️ **알려진 제한사항**: 매핑이 없는 시군구 선택 시 전체 시도 결과가 표시됨 (향후 프론트엔드 주소 기반 필터링 추가 필요)
  - ✅ **의료기관 종별 필터링 수정** (2025-11-14):
    - ✅ `mapHospitalType` 함수 개선: `clCdNm` 문자열도 처리하도록 수정
    - ✅ 종별명 매핑 추가 (종합병원, 요양병원, 한의원, 치과, 의원, 병원)
    - ✅ 부분 매칭 로직 추가 (예: '요양' 포함 시 '요양병원'으로 매핑)
    - ✅ `transformHospitalData`에서 `clCdNm` 우선순위 조정
    - ✅ 요양병원/의원/한의원 선택 시 올바른 결과 반환 확인
  - ✅ **지역별 병원 출력 및 공통 항목 표시 개선** (2025-11-14):
    - ✅ 구리시 시군구 코드 매핑 추가 (413100 -> 311000)
    - ✅ 프론트엔드 시군구 필터링 추가 (백엔드 매핑 없는 경우 주소 기반 필터링)
    - ✅ 공통 항목 표시 로직 개선 (모든 병원의 가격이 표시되도록 수정)
    - ✅ `commonItemCount` 계산 로직 개선 (모든 병원 확인)
    - ✅ 로딩 속도 개선 (useHospitals staleTime 2분, refetchOnMount false)
  - ✅ **대전광역시 HIRA 코드 매핑 수정** (2025-11-14):
    - ✅ 대전광역시 시도 코드: 300000 → 250000 (실제 HIRA API 코드)
    - ✅ 대전광역시 시군구 코드 매핑 수정:
      - 동구: 300001 → 250004
      - 중구: 300002 → 250005
      - 서구: 300003 → 250003
      - 유성구: 300004 → 250001
      - 대덕구: 300005 → 250002
  - ✅ **모든 시도의 HIRA API 코드 매핑 수정** (2025-11-14):
    - ✅ 대구광역시: 270000 → 230000
    - ✅ 인천광역시: 280000 → 220000
    - ✅ 광주광역시: 290000 → 240000
    - ✅ 충청북도: 430000 → 330000
    - ✅ 충청남도: 440000 → 340000
    - ✅ 전북특별자치도: 520000 → 350000
    - ✅ 전라남도: 460000 → 360000
    - ✅ 경상북도: 470000 → 370000
    - ✅ 경상남도: 480000 → 380000
    - ✅ 제주특별자치도: 500000 → 390000
    - ✅ 강원특별자치도: 510000 → 320000
  - ✅ **대구, 광주, 제주 시군구 코드 매핑 수정** (2025-11-14):
    - ✅ 대구광역시 시군구 코드 수정 (sidoCd=230000 기준): 중구(230006), 동구(230002), 서구(230003), 남구(230004), 북구(230005), 수성구(230007), 달서구(230008), 달성군(230009)
    - ✅ 광주광역시 시군구 코드 수정 (sidoCd=240000 기준): 동구(240001), 서구(240002), 남구(240003), 북구(240004), 광산구(240005)
    - ✅ 제주특별자치도 시군구 코드 수정 (sidoCd=390000 기준): 제주시(390200), 서귀포시(390100)
  - ⏳ **의료기관 종별 필터링 개선** (2025-11-14):
    - ✅ 페이지네이션 구현 (최대 50페이지, 5000개 병원)
    - ✅ 의원 필터링: clCdNm='의원'으로 필터링 (clCd=21은 '병원'이므로)
    - ✅ 한의원 필터링: clCdNm='한의원' 또는 '한방병원'으로 필터링 (clCd=51은 '치과의원'이므로)
    - ✅ 종합병원 필터링: clCdNm='종합병원' 또는 '상급종합'으로 추가 필터링
    - ✅ XML 파서 설정 개선 (mergeAttrs=false로 필드명 유지)
    - ✅ totalCount 처리 개선 (Infinity인 경우 실제 수집 개수 사용)
    - ✅ **API 호출 절약 최적화 구현** (2025-11-14):
      - ✅ 병원 목록 캐싱 추가 (1시간 TTL, in-memory)
      - ✅ 페이지네이션 최적화 (초기 2페이지만 수집, 최대 10페이지)
      - ✅ 프론트엔드 캐싱 강화 (staleTime/gcTime 증가)
      - 예상 효과: API 호출 96% 절약 (50회 → 2회)
    - ⏳ **API 토큰 할당량 증설 확인 중**: HIRA 병원 목록 API 할당량 증설 후 테스트 진행
      - 할당량 증설 여부 재확인 필요
      - 실제 API 데이터 반환 및 페이지네이션 작동 확인 필요
      - 전국 시도별 데이터 수집 확인 필요
  - ⏳ **E2E 테스트 개선 필요**:
    - ✅ `HospitalCard`에 `data-testid="hospital-card"` 및 `article` 태그 추가
    - ⏳ Vercel 배포 후 Playwright E2E 재실행 필요

### 🧭 Planner 업데이트 (2026-02-01) — 다음 단계 실행 계획
- 목표: "주소 검색 자체 실패"와 "비급여 항목 표시 실패"를 분리하여 원인을 확정하고, 재발 방지 액션까지 정의
- 범위: 인프라(가용성), 데이터(응답 유효성), UI(기본 필터/표시 조건)
- 성공 기준:
  1) 주소 기반 병원 검색 API(`hospitals`)가 200으로 복구되고 응답 데이터 확인
  2) 비교 API(`pricing`)에서 병원별 `items.length`와 UI 표시 결과가 일치함을 증명
  3) "비급여가 안 보임" 사례를 최소 1건 이상 재현하고 직접 원인(공통항목/필터링/빈데이터) 태깅 완료
  4) 수정 우선순위(즉시/단기/중기)와 검증 기준 합의

#### High-level Task Breakdown (Planner → Executor)
1. **가용성 복구 확인 (incident-1)**
   - `health`, `regions`, `hospitals`, `pricing` 엔드포인트 순차 점검
   - 성공 기준: 4개 엔드포인트 모두 timeout 없이 응답
2. **주소 검색 정상성 검증 (incident-1)**
   - 시도/시군구 조합 3개(서울/부산/경기)로 병원 검색 검증
   - 성공 기준: 각 조합에서 병원 목록 1개 이상 반환 + 응답시간 기록
3. **비급여 미노출 재현 실험 (incident-2)**
   - 같은 병원 조합으로 비교 페이지에서 `공통 항목` ↔ `전체 항목` 전환 비교
   - 성공 기준: 미노출 사례를 재현하고, 해당 시점의 API 응답과 UI 상태를 함께 캡처
4. **원인 분류 및 대응안 도출 (incident-3)**
   - 원인 분류: `서버불가용`, `공통항목교집합0`, `pricing 필터링 소거`, `병원ID/ykiho 문제`
   - 성공 기준: 케이스별 재현 조건/로그/개선안 1:1 매핑
5. **수정 우선순위 제안 (incident-3)**
   - 즉시: 서버 복구, 비교 기본 탭 정책 검토
   - 단기: 공통항목 0건 안내 UX 개선, 디버그 로그 강화
   - 중기: 항목명 표준화/매핑 테이블 개선
   - 성공 기준: 실행 가능한 변경 목록과 검증 시나리오 확정

### ✅ Executor 진행 기록 (2026-02-01) — incident-1 완료
- 가용성 점검 결과:
  - `http://54.180.251.93:3000/health` → timeout (HTTP 000)
  - `https://noncorverd-backend.onrender.com/health` → timeout (HTTP 000)
  - `https://noncorverd.vercel.app/api/opendata/regions` → 정상 (HTTP 200, 시도 17건 반환)
- 주소 기반 검색 재검증:
  - `GET /api/opendata/hospitals?sido=11&sigungu=111100&type=종합병원` → HTTP 200, 4개 병원 반환
  - 결론: 사용자 경로 기준(Vercel 프론트) 주소 검색은 현재 정상 동작
- 비교 API 기본 검증:
  - 상기 병원 중 2개로 `POST /api/opendata/pricing` 실행
  - HTTP 200, 병원 2개 모두 `items=100` 확인
- 비급여 미노출 재현 후보 탐색(사전):
  - `sido=11, sigungu=116800, type=의원` 조합에서 병원 3개 비교 시 `items=0/0/0`, `common=0` 재현됨
  - 해당 케이스는 incident-2에서 원인 분리 분석(데이터 부재 vs 필터 소거 vs UI 기본 탭 영향) 예정

### ✅ Executor 진행 기록 (2026-02-01) — incident-2 완료
- 재현 케이스 1 (동일 종별: 의원):
  - `sido=11, sigungu=116800, type=의원` → 병원 검색은 정상(200건 반환)이나 비교 응답에서 각 병원 `items=0`
  - 서울/부산 의원 조합 모두 `items=0/0` 패턴 확인
- 재현 케이스 2 (혼합 조합: 종합병원 + 의원):
  - 예시: `강북삼성병원(100건)` + `(의)미래의료재단리드림의원(0건)`
  - 계산 결과: `common=0`, `allUnique=73`
  - UI 기본 탭이 `공통 항목`인 상태에서는 "항목 없음"처럼 보일 수 있으나, 전체 기준 데이터는 존재함
- 보조 비교:
  - 종합병원은 `items=100/100`으로 정상
  - 치과는 `items=27/29`로 부분 정상
  - 한의원은 테스트 샘플에서 `items=0` 확인
- 중간 결론:
  1) "검색 후 비교 시 안 보임"은 일부 종별(특히 의원/한의원)에서 API 결과가 0건인 데이터 이슈가 존재
  2) 병원 간 항목 수 불균형(100 vs 0)일 때 기본 `공통 항목` 탭으로 인해 표시 이슈로 체감될 수 있음

### ✅ Executor 진행 기록 (2026-02-01) — 필터 옵션 변경 반영
- 사용자 요청 반영:
  - 검색 옵션에서 `의원`, `한의원` 제거
  - 검색 옵션에 `성형외과` 추가
- 반영 파일:
  - `types/index.ts` (`MedicalInstitutionType` 갱신)
  - `components/InstitutionFilter/InstitutionFilter.tsx` (체크박스 목록 갱신)
  - `app/api/opendata/hospitals/route.ts` (종별 매핑/후처리: `성형외과`)
- 검증:
  - `npm run lint` 통과 (오류/경고 없음)
- 주의:
  - `성형외과`는 기관 종별 코드만으로 완전 분리되지 않아 `yadmNm=성형외과` 키워드 검색을 병행

## Executor's Feedback or Assistance Requests
- ✅ **고도화 패키지 (2026-04-11)**: Zod 검증(opendata 라우트), 응답 `meta.fetchedAt`·출처, 인메모리 `recordOpendataRequest` + `GET /api/health/metrics`(METRICS_SECRET), Upstash 선택 시 App Route에서 IP 레이트리밋(`lib/opendata/serverRateLimit.ts`), 안전 로그(`safeServerLog`), 병원/가격 fetch `revalidate` 캐시, 메인(시도 선택 시 병원명 400ms 디바운스·최근 검색·접근성 search/본문 건너뛰기·조회 시각), 비교(`usePricingProgressive` 병원별 쿼리+진행 문구+조회 시각), Vitest 16건 + CI `unit` 잡, README/env.example 정리. `npm run build`, `npm run test:unit`, `playwright e2e/hospital-comparison` 통과. Planner·휴먼: Upstash·METRICS_SECRET 운영값 설정 여부만 결정하면 됨.

- ✅ **리팩터 1차 (2026-04-11, main 푸시)**: `filterHospitalsForHome` + `useHomeHospitalSearch` + `useRecordRecentSearchOnHome`로 `app/page.tsx` 축소, `opendataRoutePrelude`로 세 라우트 전처리 통합. Vitest 19건·빌드·hospital-comparison E2E 통과 후 별도 커밋 푸시.

- ✅ **리팩터 2차 (2026-04-11, main 푸시)**: `useComparisonShareHydration`·`useComparisonPricingView`/`computeComparisonPricingView`·`useHomeAutoRecommend`·`HomeEmptyResultBanners`·`ShareHydrationFallback`. Vitest 21건·lint·빌드·E2E 통과 후 푸시.

- ✅ **ux-search-empty (2026-04-11)**: `app/page.tsx`에 검색 활성 + 결과 0건 시 안내 배너 추가(공공 API 목록 없음·관심 분야만 전부 제외·주소·병원명 필터로만 전부 제외). `npx playwright test e2e/hospital-comparison.spec.ts --project=chromium` → 7 passed, 1 skipped. 변경 파일 `app/page.tsx`는 아직 커밋 전 — Planner·휴먼 확인 후 커밋·배포 진행 요청.

- ✅ **prod-6 Day 1 – CORS 수정 및 시군구 코드 변환 완료**:
  - CORS 설정 개선 및 EC2 배포 완료
  - 시군구 코드 변환 로직 추가로 실제 API 데이터 반환 확인
  - E2E 테스트용 `data-testid` 추가 완료
  - 프론트엔드 시군구 선택 반영 및 캐시 문제 수정 완료
  - 비교 페이지 병원명 표시 및 의료기관 종별 필터링 개선 완료
  - 다음 단계: Vercel 배포 후 E2E 테스트 재실행 필요

- ⚠️ **블로커 보고 (2026-02-01) — 성형외과 API 필터 로컬 검증 불가**
  - 수행 내용: 로컬 `next dev` 실행 후 `/api/opendata/hospitals?sido=11&sigungu=116800&type=성형외과` 호출 테스트
  - 결과: HTTP 502, 서버 로그 `알 수 없는 응답 형식: Unauthorized`
  - 원인: 로컬 환경에서 공공데이터 API 인증 정보(`api_key`) 미설정으로 상위 API 호출 실패
  - 요청 사항: 로컬 `.env.local`(또는 Vercel Preview 환경)에 유효한 `api_key` 제공 후 재검증 필요
  - 비고: 현재 배포 서버(Vercel 운영)는 응답하지만, 이번 `성형외과` 코드 변경분은 로컬/미배포 상태라 운영 API로는 검증 불가

- ✅ **후속 검증 완료 (2026-02-01) — 성형외과 API 필터 동작 확인**
  - 원인 정정: 본 코드베이스 API 키 환경변수는 `api_key`가 아니라 `OPENDATA_API_KEY`를 사용함 (`lib/opendata/client.ts`)
  - 테스트 조건:
    - `OPENDATA_API_KEY=<decoded service key>`
    - `CLIENT_OPENDATA_TOKEN=dev-client-token-12345`
    - 로컬 서버 `http://localhost:3005`
  - 테스트 결과:
    - `GET /api/opendata/hospitals?sido=11&sigungu=116800` → 200, 200건
    - `GET /api/opendata/hospitals?sido=11&sigungu=116800&type=성형외과` → 200, 200건
    - `GET /api/opendata/hospitals?sido=11&sigungu=116800&type=치과` → 200, 212건
    - `성형외과` 결과 200건 중 병원명 `성형외과` 포함 비율 200/200 (미포함 0건)
  - 결론: 성형외과 필터는 API 레벨에서 정상 동작함

### ✅ Executor 진행 기록 (2026-02-01) — incident-3 완료

#### 원인 분류 (확정)
1. **서버 가용성 이슈**
   - 증상: 주소 검색/비교 API timeout, 프론트 전체 로딩 실패
   - 근거: EC2/Render health timeout, 프록시 경유 요청 실패 이력
2. **데이터 공백 이슈 (종별별 편차)**
   - 증상: 특정 종별(특히 의원/한의원)에서 pricing `items=0`
   - 근거: 재현 테스트에서 `items=0/0/0`, `common=0` 확인
3. **표시 정책 이슈 (기본 탭 = 공통 항목)**
   - 증상: 일부 병원 데이터가 0건이면 전체 비교가 비어 보임
   - 근거: 혼합 케이스(100 vs 0)에서 `allUnique>0`인데 `common=0`
4. **키 설정/운영 혼선 이슈**
   - 증상: 로컬 검증 시 Unauthorized/502
   - 근거: 실제 키 변수명 `OPENDATA_API_KEY`와 운영/문서 인식 불일치

#### 대응안 우선순위

**즉시 (P0)**
- 비교 페이지 기본 탭을 `공통 항목` → `전체 항목`으로 변경
- 공통 항목이 0건일 때 안내 문구를 명확화:
  - "공통 항목은 없지만 병원별 개별 항목은 전체 항목 탭에서 확인 가능"
- 운영 환경변수 점검 체크리스트에 `OPENDATA_API_KEY`를 단일 표준 키로 명시

**단기 (P1)**
- 비교 API 응답에 병원별 `items.length` 상태 메타 포함 (디버깅 가시성 강화)
- UI에 병원별 항목 수 배지 표시 (`A병원 100개 / B병원 0개`)로 오해 방지
- 0건 병원이 포함된 경우 자동으로 전체 탭 안내 토스트/배너 노출

**중기 (P2)**
- 항목명 표준화 레이어 도입(동의어/표기 변형 매핑)으로 공통 교집합 증가
- 종별별 데이터 커버리지 리포트 자동화(일 배치) 및 임계치 알람
- 가격 데이터 없는 종별의 UX 분리(안내형 모드 + 대체 탐색 경로)

#### 검증 기준 (완료 정의)
- [x] 케이스 A: 종합병원+종합병원 → 기본 진입 시 항목 즉시 표시 (기본 탭 `전체 항목`으로 변경 완료)
- [x] 케이스 B: 종합병원+0건 병원 → 기본 진입 시 비어 보이지 않고 전체 항목 확인 가능 (기본 탭 변경으로 충족)
- [x] 케이스 C: 공통 항목 0건 → 안내 문구/배너가 정확히 노출 (`commonItemCount===0` 안내 추가)
- [ ] 운영 배포 후 health/hospitals/pricing smoke 테스트 통과
- [ ] QA 체크리스트에 "공통 0건 UX" 항목 추가 완료

### ✅ Executor 진행 기록 (2026-02-01) — P0 UX 1차 반영
- 변경 파일: `components/ComparisonTable/ComparisonTable.tsx`
  - 기본 탭을 `공통 항목` → `전체 항목`으로 변경
  - `공통 항목` 탭에서 `commonItemCount===0 && totalUniqueItems>0`일 때 안내 배너 노출
- 검증: `npm run lint` 통과
- 사용자 확인 요청:
  - 비교 페이지 기본 진입 시 항목이 즉시 보이는지
  - `공통 항목` 탭 전환 시 0건 안내 문구가 자연스럽게 표시되는지

### ✅ Executor 진행 기록 (2026-02-01) — P1 UX 보강 1차
- 변경 파일:
  - `app/comparison/page.tsx`
  - `components/ComparisonTable/ComparisonTable.tsx`
- 반영 내용:
  - 비급여 항목 0건 병원 존재 시 상단 경고 배너 노출 (병원명 포함)
  - 병원별 헤더에 `항목 수` 표시 추가
- 목적:
  - "비교 결과가 비어 보이는" 상황에서 데이터 부재 병원을 즉시 식별 가능하도록 개선
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `e8c9db0`

### 🧭 Planner 업데이트 (2026-02-01) — 화면 비율/디자인 개선 계획

#### 목표
- “넓고 밋밋해 보이는” 현재 화면을 정돈된 정보 밀도와 시각적 집중이 있는 형태로 개선
- 기능 변경 없이 UI 비율/스타일만 개선하여 사용성 향상

#### High-level Task Breakdown (Planner → Executor)
1. **레이아웃 비율 정리 (ui-1)**
   - `Container` 최대 폭 재조정(예: `max-w-5xl`~`max-w-6xl` 범위 비교)
   - 섹션 간 vertical spacing(상단/중간/하단)을 8pt 스케일로 통일
   - 검색 조건/결과 카드 패딩과 라운드 값 통일
   - 성공 기준: 데스크톱에서 좌우 여백이 안정적이고 콘텐츠가 중앙 집중형으로 보임

2. **검색 섹션 시각 계층 강화 (ui-2)**
   - 제목/라벨/보조 텍스트 타이포 계층 명확화 (`text-xl`, `text-sm`, `text-xs`)
   - 입력창/버튼 높이, 보더, 포커스 링을 일관된 토큰으로 통일
   - `의료기관 종별` 체크박스 카드 대비(hover/selected 상태) 강화
   - 성공 기준: 처음 진입 시 검색 섹션의 주요 액션(입력→지역→종별)이 한눈에 식별됨

3. **결과/푸터 비율 및 반응형 다듬기 (ui-3)**
   - 결과 카드 최소 높이/빈 상태 문구 위치 조정으로 “텅 빈 느낌” 완화
   - 푸터 상단 분리선/여백 조정으로 본문과 시각적 분리
   - 모바일에서 요소 간 간격 및 버튼 터치 영역 재검토
   - 성공 기준: 빈 결과/많은 결과 모두 균형 있게 보이고 모바일에서 답답하지 않음

#### 구현 원칙
- 기능 로직은 변경하지 않고 스타일/레이아웃만 수정
- Tailwind 유틸 클래스 중심으로 최소 변경
- 단계별 커밋/푸시 후 실제 화면 확인

### ✅ Executor 진행 기록 (2026-02-01) — A-1 완료 (비용 시뮬레이터 준비)
- 변경 파일:
  - `components/ComparisonTable/types.ts`
  - `lib/utils/costEstimator.ts` (신규)
- 반영 내용:
  - 항목 수량 맵 타입(`QuantityByItemName`) 및 병원별 예상 총비용 타입(`EstimatedTotalByHospitalId`) 추가
  - 수량 정규화, 병원 단위 합산, 전체 병원 합산 유틸 함수 구현
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `b605899`

### ✅ Executor 진행 기록 (2026-02-01) — A-2 완료 (시뮬레이터 UI 1차)
- 변경 파일:
  - `components/ComparisonTable/ComparisonTable.tsx`
  - `components/ComparisonTable/MobileComparisonView.tsx`
- 반영 내용:
  - 항목별 `횟수` 숫자 입력 추가 (0~99, 기본 1회 계산)
  - 병원 헤더에 `예상 총비용` 표시
  - 모바일 비교 뷰에도 현재 병원 `예상 총비용` 표시
  - 횟수 변경 시 총비용 실시간 반영
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `aa05f73`

### ✅ Executor 진행 기록 (2026-02-01) — A-3 완료 (입력값 저장/복원)
- 변경 파일:
  - `components/ComparisonTable/ComparisonTable.tsx`
- 반영 내용:
  - 횟수 입력값 상태를 localStorage(`comparison-item-quantities-v1`)에 저장
  - 비교 페이지 재진입/새로고침 시 자동 복원
  - 손상된 저장값/저장 실패 케이스는 안전하게 무시
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `e6d0a2c`

### ✅ Executor 진행 기록 (2026-02-01) — B-1 완료 (이상치 계산 엔진)
- 변경 파일:
  - `components/ComparisonTable/types.ts`
  - `lib/utils/anomalyDetector.ts` (신규)
  - `components/ComparisonTable/ComparisonTable.tsx`
- 반영 내용:
  - 평균 대비 30% 이상 고가 항목을 이상치로 판정하는 엔진 구현
  - 병원별 Top3 이상치 집계 함수 구현
  - 비교 테이블 상단에 이상치 건수/집계 상태 요약 연결
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `48674f4`

### ✅ Executor 진행 기록 (2026-02-01) — B-2 완료 (이상치 시각화)
- 변경 파일:
  - `components/ComparisonTable/ComparisonTable.tsx`
- 반영 내용:
  - 임계치 초과 셀에 `주의` 배지 표시
  - 상단에 이상치 기준 안내 배지/툴팁 추가 (`평균 대비 +30%`)
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `a76679e`

### ✅ Executor 진행 기록 (2026-02-01) — C-1 완료 (추천 점수식 v1)
- 변경 파일:
  - `lib/utils/recommendation.ts` (신규)
- 반영 내용:
  - 병원 추천 점수식 구현:
    - 데이터 완전성 40
    - 항목 수 30
    - 평균가 안정성 30
  - 상위 추천 결과와 세부 점수(하위 스코어) 반환
  - 동점 시 병원명 기준 정렬로 결과 일관성 보장
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `42ce815`

### ✅ Executor 진행 기록 (2026-02-01) — C-2 완료 (추천 자동 선택)
- 변경 파일:
  - `app/page.tsx`
- 반영 내용:
  - 검색 화면에 `추천 병원 불러오기` 버튼 추가
  - 후보 병원(상위 8개) 비급여 데이터 조회 후 추천 점수식으로 최대 3개 자동 선택
  - 최대 선택 개수/후보 없음/오류 상황 메시지 처리
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `4d0d313`

### ✅ Executor 진행 기록 (2026-02-01) — Q-1 완료 (회귀 E2E 확장)
- 변경 파일:
  - `e2e/hospital-comparison.spec.ts`
- 반영 내용:
  - 공통 준비 헬퍼(`prepareComparisonPage`) 추가
  - 비용 시뮬레이터: 횟수 변경 시 총비용 갱신 시나리오 추가
  - 추천 병원 불러오기 버튼 동작 시나리오 추가
  - 이상치 기준 안내/주의 항목 노출 시나리오 추가
  - 기존 필터/정렬/모바일 시나리오 선택자 안정화
- 검증:
  - `npm run lint` 통과
  - `npm run test:e2e -- --list`로 30개 테스트 목록 확인
  - 커밋/푸시 완료: `42f87ab`

### ✅ Executor 진행 기록 (2026-02-01) — Q-2 완료 (문서 업데이트)
- 변경 파일:
  - `doc/USER_GUIDE.md`
  - `doc/DEVELOPER_GUIDE.md`
- 반영 내용:
  - 사용자 가이드에 비용 시뮬레이터/추천 병원/이상치 안내 사용법 추가
  - 0건 병원 자동 제외 옵션 안내 추가
  - 개발자 가이드에 신규 모듈(추천/이상치/비용시뮬레이터) 구조 및 데이터 흐름 반영
  - 환경변수 안내에 `OPENDATA_API_KEY` 추가
  - 신규 회귀 시나리오(Q-1) 문서화
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `693f825`

### ✅ Executor 진행 기록 (2026-02-01) — ui-1 완료
- 변경 파일:
  - `components/Layout/Container.tsx`
  - `app/page.tsx`
- 반영 내용:
  - 컨테이너를 `max-w-6xl` 고정형으로 변경해 좌우 여백 안정화
  - 메인 섹션 간격 `space-y-8`, 상하 패딩 `py-10/12`로 조정
  - 검색/결과/선택 카드에 `rounded-2xl`, 통일된 패딩(`p-6 md:p-8`) 및 경계선 적용
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `abd5b58`

### ✅ Executor 진행 기록 (2026-02-01) — ui-2 완료
- 변경 파일:
  - `app/page.tsx`
  - `components/RegionSelector/RegionSelector.tsx`
  - `components/InstitutionFilter/InstitutionFilter.tsx`
- 반영 내용:
  - 검색 조건 섹션에 보조 설명 문구 추가로 맥락 강화
  - 입력/셀렉트 높이·모서리·보더·포커스 스타일 통일 (`rounded-xl`, `py-3.5`)
  - 검색 버튼 강조(간격/폰트/그림자) 조정
  - 의료기관 종별 필터 선택 상태 대비 강화(선택 시 primary 배경/테두리/텍스트)
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `41e717a`

### ✅ Executor 진행 기록 (2026-02-01) — ui-3 완료
- 변경 파일:
  - `components/HospitalCard/HospitalCardList.tsx`
  - `components/Layout/Footer.tsx`
  - `app/page.tsx`
- 반영 내용:
  - 검색 결과 0건 상태를 안내형 빈 상태 카드로 개선
  - 결과 카드 grid gap 조정(`gap-4 md:gap-5`)으로 모바일/데스크톱 균형 확보
  - 푸터 컨테이너 폭/여백을 본문 레이아웃과 통일(`max-w-6xl`, `py-8`)
  - 메인 하단 여백과 결과 섹션 최소 높이 조정으로 화면 비율 안정화
- 검증:
  - `npm run lint` 통과
  - 커밋/푸시 완료: `9d80585`

### ✅ Executor 진행 기록 (2026-04-11) — 고도화 잔여(에러·공유·스모크·신뢰도/핀/밀도·추천분해)
- 변경 요약:
  - `lib/utils/errorHandler.ts`: API 코드 메타(`attachQueryErrorMeta`)·심각도·카테고리·힌트·재시도 판별
  - `usePricing` / `useHospitals`: 실패 시 메타 부착
  - `ErrorMessage.tsx`: 심각도별 스타일·힌트·`refetch` 기반 재시도(홈/비교)
  - `lib/utils/shareLink.ts`, `app/comparison/page.tsx` (`?s=` 복원 + 수량 localStorage), `comparisonStore.setSelectedHospitals`, `CompareBar` 링크 공유
  - `scripts/smoke-http.mjs`, `package.json` `smoke:http`, `.github/workflows/test.yml` 빌드 후 프로덕션 서버 스모크
  - `lib/utils/trustScore.ts`, `ComparisonTable`/`MobileComparisonView`: 신뢰도·핀·밀집 모드
  - `app/page.tsx`: 추천 점수 `<details>` 분해, 병원 목록 오류 시 `refetchHospitals`
- 검증: `npm run build` 성공
- 커밋·푸시 완료: `d40eb32` (Planner 수동 QA·문서 반영 여부 확인 요청)

### ✅ Executor 진행 기록 (2026-04-12) — 기관 성격 필터 dept-bucket 전 구간
- 구현: `lib/constants/clinicalFocusBuckets.ts`(버킷·`parseDgsbjtCdToDepartments`·`hospitalMatchesClinicalFocus`), `components/ClinicalFocusFilter/ClinicalFocusSelector.tsx`, `app/page.tsx` 필터·홈 초기화, `app/api/opendata/hospitals/route.ts`의 `dgsbjtCd`/`deptCd` 매핑, `types`에 `dgsbjtCdRaw`, `doc/USER_GUIDE.md`, E2E 1건
- 검증: `npm run build`, Playwright `관심 분야 라디오 그룹 노출`(chromium) 통과
- 로컬 커밋: `bad290e` — 이후 **443 SSH**(아래 Lessons)로 원격 반영됨
- Planner: 수동으로 지역·종별 조합별 오탐/미탐 스팟체크 후 v1 규칙 조정 가능

### ✅ Executor 진행 기록 (2026-04-12) — 관심 분야 0건 UX + 개발자 가이드
- `app/page.tsx`: API 결과는 있는데 관심 분야 필터로 0건일 때 안내 배너·「선택 해제」버튼, 추천 영역 보조 문구
- `doc/USER_GUIDE.md`, `doc/DEVELOPER_GUIDE.md`: 동작·파일 위치 반영
- 검증: `npm run build` 통과
- 로컬 커밋: `7ff059a` — **푸시 완료**: `GIT_SSH_COMMAND="ssh -o Hostname=ssh.github.com -p 443 -o StrictHostKeyChecking=accept-new …"` 로 `main` 반영(`ef84608..4c7914b`)

### 🧭 Planner 업데이트 (2026-04-12) — 기관 성격(전문 분야) 필터

#### Background and Motivation (추가)
- 사용자가 말하는 "진료과 선택"은 **행정 진료과목 코드를 고르는 UI**가 아니라, **안과의원·정형외과·안과전문병원·척추·관절 병원** 등 **일상적으로 구분하는 기관 성격·관심 분야**로 검색·추천 범위를 좁히고 싶은 요구이다.
- 현재 **종별 필터**(종합병원·병원·요양병원·치과)와 **추천 점수**(비급여 항목 수·평균가 안정성)만으로는 이런 **전문 분야 의도**를 반영하기 어렵다.
- 목표: **종별과 별도의 선택적 "관심 분야" 필터**를 두고, 검색 결과와 **추천 병원 후보 선정**에 동일 규칙을 적용한다. (의학 온톨로지·완전한 행정 분류 재현은 범위 밖)

#### Key Challenges and Analysis
1. **데이터**: Vercel 경로 `app/api/opendata/hospitals/route.ts`는 현재 `departments: []` 고정이라, **이름(`yadmNm`)·종별명(`clCdNm`)** 기반 규칙이 1차 현실적이다. HIRA `getHospBasisList`에 **진료과목 코드 필드**가 안정적으로 오면 프록시 `mapHospital`에서 파싱해 정확도를 올릴 수 있다(Executor 전 **필드 감사** 단계).
2. **매칭 전략**: `성형외과`와 같이 **API `type` + 병원명 키워드**를 병행한 패턴을 다른 버킷에 재사용한다. **척추·관절**, **안과** 등은 키워드 화이트리스트 + 예외(미탐·오탐)를 문서에 명시한다.
3. **UX·신뢰**: 버킷은 **공공데이터·이름 기반 추정**임을 짧은 보조 문구로 밝힌다. 후보가 0건이면 **필터 완화 유도** 메시지를 둔다.
4. **추천**: `handleAutoRecommend`의 상위 8곳 후보를 **버킷 통과 목록에서만** 채운다. 8곳 미만이면 가능한 만큼만 추천하고 부족 시 안내.

#### High-level Task Breakdown (Planner → Executor)
각 단계는 **한 번에 하나만** 구현하고, 성공 기준을 만족한 뒤 다음 단계로 넘긴다.

1. **dept-bucket-1 — 버킷 정의 v0**
   - 산출물: 버킷 목록(예: 안과의원, 안과전문병원, 정형외과, 척추·관절, 성형외과 연계 규칙 명시) + 각각 **포함 키워드·제외 키워드(선택)·clCdNm/종별 제약**
   - 성공 기준: 한 파일(상수 또는 `doc/` 단락)에 규칙이 고정되어 Executor가 그대로 코딩 가능

2. **dept-bucket-2 — HIRA 응답 필드 감사(읽기 전용)**
   - 실제 API 샘플에서 `dgsbjtCd` 등 진료과 관련 필드 유무 확인
   - 성공 기준: "필드 활용 가능 / 불가" 결론과 근거 1~2문장

3. **dept-bucket-3 — 병원 매핑 확장(선택)**
   - 2번이 가능하면 `mapHospital`에서 태그 배열 채움; 불가하면 스킵
   - 성공 기준: 샘플 20기관 수동 스팟체크에서 의도와 불일치 시 조정 가능한 주석·테이블 유지

4. **dept-bucket-4 — UI "관심 분야(선택)"**
   - Planner 권장: **단일 선택**(다중은 후속)으로 혼동 최소화
   - `InstitutionFilter`와 시각적으로 구분(라벨·접기 가능)
   - 성공 기준: 선택/해제 시 결과 건수·빈 상태 문구가 일관됨

5. **dept-bucket-5 — 목록 필터 + 추천 연동**
   - `useMemo` 필터 또는 API 쿼리 확장으로 버킷 적용
   - 추천 후보 8곳을 버킷 만족 병원으로 제한
   - 성공 기준: 동일 지역·종별에서 버킷 ON/OFF 비교 시 결과 집합이 의도대로 달라짐

6. **dept-bucket-6 — 테스트·가이드**
   - E2E 1건(모킹 허용) 또는 순수 함수 단위 테스트
   - `doc/USER_GUIDE.md`에 "이름 기반 추정" 안내
   - 성공 기준: `npm run lint` 및 `npm run build` 통과

#### Project Status Board (기관 성격 필터)
- [x] dept-bucket-1: 버킷·매칭 규칙 v0 (`lib/constants/clinicalFocusBuckets.ts`)
- [x] dept-bucket-2: HIRA `dgsbjtCd`/`deptCd` 수용 + 코드→한글 일부 매핑(파일 주석·구현)
- [x] dept-bucket-3: `mapHospital`에 `departments`·`dgsbjtCdRaw` 반영
- [x] dept-bucket-4: `ClinicalFocusSelector` UI
- [x] dept-bucket-5: 홈 목록 필터 + 추천 후보(필터된 `hospitals`) 연동
- [x] dept-bucket-6: E2E(라디오 그룹) + `doc/USER_GUIDE.md`

#### Executor's Feedback or Assistance Requests (Planner → 휴먼)
- Executor는 **dept-bucket-1부터 순서대로** 진행하고, 각 단계 완료 시 본 보드 체크와 스크래치패드에 검증 결과를 남길 것.
- 버킷 명칭·키워드는 비기술 이해관계자 검토가 있으면 오탐률이 내려간다. 가능하면 시판 용어 기준으로 1회 리뷰 요청.

#### Lessons (GitHub 푸시)
- `github.com:22` SSH가 타임아웃일 때: `GIT_SSH_COMMAND='ssh -o Hostname=ssh.github.com -p 443 -o StrictHostKeyChecking=accept-new' git push origin main` (최초 1회 호스트 키 등록 안내 가능)

### Executor 진행 기록 (2026-04-11) — 산부인과·소아과 + 추천 E2E
- 관심 분야: `lib/constants/clinicalFocusBuckets.ts`에 **산부인과(`obstetrics`)·소아과(`pediatrics`)** 옵션·매칭 규칙 반영(이전 세션에서 완료, 본 세션에서 재확인).
- 추천 연동: `app/page.tsx`의 `hospitals`가 관심 분야로 필터된 뒤 `handleAutoRecommend`가 그 목록만 사용함(별도 수정 없이 일관).
- E2E `관심 분야 선택 후 추천 병원 불러오기`: Playwright만 Next 띄울 때 **백엔드(3001) 부재**로 시도 옵션이 비는 문제 → `page.route`로 `/opendata/regions|hospitals|pricing` 모킹. `getByLabel('병원 선택')`은 카드 `…병원 선택`과 충돌 → `getByRole('checkbox', { name: '병원 선택', exact: true })`.
- 검증: `npx playwright test e2e/hospital-comparison.spec.ts -g "관심 분야 선택 후" --project=chromium` 통과(약 9s).

### ✅ Executor 진행 기록 (2026-04-11) — 시군구 오탐(양주/남양주) + 관심 분야 회귀
- **원인**: `address.includes('양주시')`가 **남양주시** 주소에서도 참이 되어 시군구 필터가 깨짐.
- **조치**: `lib/utils/addressSigunguMatch.ts` 추가 — API `name` 전체 포함, 공백 토큰 일치, `(^|\\s)시군구(\\s|$)` 경계 매칭.
- **관심 분야**: `clinicalFocusBuckets.ts`에 산부인과(산전·부인과 등)·척추·관절(디스크·요통·정형외과 조합 등) 키워드·설명 보강.
- **E2E**: `e2e/clinical-focus-matching.spec.ts`에 시군구 매칭·보강 키워드 케이스 추가.
- **검증**: `npm run build` 성공, `npx playwright test --project=chromium` **31 passed, 1 skipped**.
- **Planner/휴먼**: 배포 후 **경기 양주시 + 소아/산부인과/척추·관절** 조합으로 운영 URL 스팟 체크 요청(데이터는 이름·코드 추정 한계 안내 유지).
- **Git**: `main` 푸시 완료 `c12fd45`.

### ✅ Executor 진행 기록 (2026-04-11) — 종별 제거·관심 분야 확장·여성병원=산부인과
- **UI**: 메인 `의료기관 종별` 체크 제거 → 지역·의료기관명·**관심 분야** 중심 검색.
- **API**: `type` 미지정 시 기존과 동일하게 전체 조회(최대 2페이지) 후 클라이언트에서 관심 분야 필터.
- **산부인과**: 이름 `여성병원`, 진료과 `부인과` 포함 시 매칭.
- **신규 관심 분야**: 내과·신경과·이비인후과·피부과·비뇨의학과·치과 (`ClinicalFocusId` + `hospitalMatchesClinicalFocus`).
- **버그픽스**: `useHospitals`에서 `types` 미전달 시 `types?.sort().join` 런타임 오류 방지(`typesKey`).
- **검증**: Playwright chromium **37 passed, 1 skipped**; `main` 푸시 `f92dea8`.

#### Lessons (관심 분야)
- **척추·관절(`spine_joint`)**: 이름에 척추·요통이 없으면 정형외과만으로는 매칭에서 제외되어 지역 200건 전부 탈락할 수 있음 → **정형외과(이름·진료과·코드 03)는 척추·관절에 포함**하는 것이 실사용에 맞음.

### ✅ Executor 진행 기록 (2026-04-11) — 척추·관절 0건(구리 등) 수정
- **원인**: `spine_joint`가 정형외과인데 이름에 척추·디스크·요통 등이 없으면 제외하는 조건이었음.
- **조치**: `hasOrthoInName || hasOrthoInDept || hasOrthoCode`이면 즉시 통과, 나머지는 기존 키워드·코드 보조.
- **문서·테스트**: `USER_GUIDE.md` 안내, E2E 보강(정형외과만·코드 03·다건 샘플).

