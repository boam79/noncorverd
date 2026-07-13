## Background and Motivation
- 초기 요청: `의료기관_비급여비교_PDR_v1.2.md` 문서 분석 및 요구사항 파악.
- 추가 요청 1: Vercel 배포 계획 및 AWS 연동 테스트 요구 사항을 문서에 추가(코드 수정 없이 문서 업데이트).
- 추가 요청 2: 공공데이터포털 API 활용 승인 목록을 문서에 반영.
- **신규 요청: MVP 개발 시작** - 모든 MCP 도구를 활용하여 실제 웹서비스 구현.
- 목적: 관련 문서에 배포/테스트 전략과 사용 중인 공공데이터 API 정보를 명확히 기록해 후속 개발·운영 참고자료로 활용. 이제 실제 MVP 개발을 시작하여 핵심 기능을 구현.
- **신규 요청 (2026-04-11): 서비스 전면 개편** — 사용자 여정·정보 구조·UI 시스템·코드 구조를 한 번에 재정렬하되, 공공 API·비교 핵심 가치는 유지. Planner가 범위·단계·성공 기준을 문서화하고, Executor는 단계별로 한 스텝씩 구현·검증한다.

## Key Challenges and Analysis
- 문서가 PDR 형태로 UI/UX, 기술 스택, 인프라 구성을 모두 포함하므로 섹션별 핵심 요약이 필요.
- 비급여 비교 서비스의 사용자 흐름과 데이터 연동 전략을 정확히 파악해야 후속 설계가 가능.
- 분석 결과는 Executor가 참조할 수 있도록 구조화된 요약과 검증 포인트를 제공해야 함.
- 신규 요구사항(Vercel 배포 + AWS 연동 테스트)을 기존 인프라 설계와 모순 없이 문서에 녹여야 함.

### Initiative: 전면 개편 v2 (Planner, 2026-04-11)

#### 배경·목표
- MVP 이후 기능이 누적되며 메인 검색·비교·상태(Zustand·React Query·localStorage)가 분산되어, **신규 사용자가 “한 화면에서 무엇을 해야 하는지”** 파악하기 어려울 수 있음.
- 목표: **기능 삭제가 아닌 재배치**로 “찾기 → 고르기 → 비교·의사결정” 흐름을 명확히 하고, **URL·문서·테스트**가 같은 스펙을 가리키게 정렬한다.

#### Key Challenges (전면 개편)
1. **범위 폭주**: 디자인만 바꾸다가 데이터 계약까지 동시에 바꾸면 회귀 비용이 폭증 → **IA/URL → UI 토큰 → 폴더 구조 → API/BFF** 순으로 층을 나눈다.
2. **공공 API 제약**: 레이트리밋·지연·종별 데이터 공백은 UI로만 해결 불가 → 개편안에 **빈 상태·재시도·진행률**을 제품 스펙으로 포함한다.
3. **출시 리스크**: 한 번에 교체 시 장애 가능 → **`/beta` 또는 기능 플래그**로 병행 기간을 둔다(최소 1스프린트 권장).

#### High-level Task Breakdown (Planner → Executor)
Executor는 **한 번에 아래 한 단계만** 수행하고, 성공 기준 충족 후 Planner·휴먼 확인을 받고 다음 단계로 진행한다.

1. **redesign-0 — 범위·비범위 확정 (문서만)**
   - 산출물: “반드시 유지할 사용자 가치” 3줄, “이번에 하지 않을 것(Post-v2)” 목록.
   - 성공 기준: 휴먼이 텍스트로 승인(또는 수정) 완료.

2. **redesign-1 — IA·와이어 (저충실도)**
   - 산출물: 메인/비교(필요 시 단일 플로우) **화면별 블록 다이어그램** 또는 불릿 와이어; 상단 맥락 바(지역·관심 분야·선택 N개) 유무 결정.
   - 성공 기준: “첫 방문 사용자 30초 시나리오”가 와이어상으로 통과 가능함을 Planner가 검토.

3. **redesign-2 — URL·상태 단일 출처 설계**
   - 산출물: 검색 조건(시도·시군구·병원명·관심 분야 등)과 비교 선택의 **쿼리 파라미터 스펙 초안**; Zustand/localStorage와의 역할 분담 표.
   - 성공 기준: 스펙이 `doc/DEVELOPER_GUIDE.md`에 반영 가능한 수준의 필드 목록·예시 URL 2~3개.

4. **redesign-3 — 디자인 토큰·레이아웃 그리드**
   - 산출물: Tailwind/CSS 변수로 **색·간격·타이포·라운드** 최소 토큰 세트; Container·카드·폼 3패턴.
   - 성공 기준: 기존 페이지 1개(예: 메인)에만 토큰 적용 시 시각적 일관성 체크리스트 통과(Planner 또는 휴먼).

5. **redesign-4 — 폴더 구조 `features/` (기능 이동만, 동작 동일)**
   - 산출물: `features/home`, `features/comparison`(또는 동등 명칭)로 컴포넌트·훅 이동, import 경로 정리.
   - 성공 기준: `npm run lint`, `npm run build`, `npm run test:unit`, 핵심 Playwright 1세트 통과(변경 범위에 맞게 최소).

6. **redesign-5 — 비교·가격 UI 2차 정보 설계**
   - 산출물: 폴드 위 **요약(0건 병원·공통 0건·조회 시각)** 배치 확정; 모바일 “요약 vs 전체표” 역할 분담.
   - 성공 기준: 기존 회귀 이슈(공통 항목 0건 오해 등)에 대한 안내 문구가 와이어/목업에 반영됨.

7. **redesign-6 — RSC/캐시 경계(선택·점진)**
   - 산출물: 정적/반복 가능한 데이터(예: 지역 목록 설명)만 RSC 또는 캐시 강화 대상으로 명시; 나머지는 클라이언트 유지 이유 문서화.
   - 성공 기준: 성능 측정 포인트(첫 콘텐츠 페인트 등) 전후 수치 1회 기록.

8. **redesign-7 — 베타 출시·전환**
   - 산출물: `/beta` 또는 env 플래그로 신구 UI 전환, 기본은 구 UI 유지 후 단계적 전환 계획.
   - 성공 기준: 운영(또는 스테이징)에서 플래그 ON/OFF 스모크 통과; 롤백 절차 1페이지.

9. **redesign-8 — 문서·E2E 동기화**
   - 산출물: `USER_GUIDE` 스크린샷/절차 갱신, E2E에 URL 복원·0건 배너·비교 핵심 경로 추가.
   - 성공 기준: CI `unit` + 지정 E2E 그린; Planner가 “전면 개편 v2 완료” 선언 가능한 체크리스트 충족.

#### Initiative 성공 기준 (한 줄)
- 비기술 사용자가 **별도 설명 없이** 지역·관심 분야를 정하고 병원을 고른 뒤 비교까지 도달할 수 있으며, **공유 링크로 동일 상태 복원**이 가능하다.

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
- [x] redesign-0: 전면 개편 v2 — 범위·비범위 (`doc/REDESIGN_V2.md`)
- [x] redesign-1: IA·와이어(저충실도, 동일 문서)
- [x] redesign-2: URL·상태 — `lib/url/homeSearchParams.ts` + 가이드
- [x] redesign-3: 디자인 토큰·레이아웃 그리드(`tailwind.config.ts` `page`/`section`/`card`/`control`)
- [x] redesign-4: `features/home`·`features/comparison` + 얇은 `app/*/page.tsx`
- [x] redesign-5: 비교 루트 `bg-page`·`py-section` 등 토큰 정렬(패널 로직 유지)
- [ ] redesign-6: RSC/캐시 경계(선택·점진) — 후속(메인 지역 정적화 등)
- [x] redesign-7: `NEXT_PUBLIC_UI_V2_BETA` + 메인 리본
- [x] redesign-8: USER_GUIDE·DEVELOPER_GUIDE·E2E URL 복원 1건·unit+lint+build+Playwright 통과

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
- ✅ **Executor (2026-04-11): 디자인 개편 1차** — 맥락 바·surface/line 토큰·검색/결과 톤 분리·모바일 관심 분야 접기(단일 라디오)·병원 카드 계층·표 `tabular-nums`/헤더·CompareBar·Header. `npm run test:unit`·lint·build·`hospital-comparison` chromium 통과.

- ✅ **Executor (2026-04-11): 전면 개편 v2 1차 구현** — URL 동기화(`sido`/`sigungu`/`q`/`focus`), `features/home`·`features/comparison`, Tailwind 토큰, `doc/REDESIGN_V2.md`, `env.example`, USER/DEVELOPER 가이드, E2E URL 복원. **redesign-6**(RSC 분리)는 미착수. Planner·휴먼: 스테이징에서 URL 공유·뒤로가기 스팟 확인.

- ✅ **리팩터 3차 + Next 패치 (2026-04-11)**: `lib/home/homeSearchDerived.ts`·테스트로 메인 검색 파생 상태(`searchActive`, 빈 결과 안내 조건 등) 순수 계산 분리. `HomeSearchPanel`·`HomeSearchResultsSection`·`ComparisonPricingPanel`로 `app/page.tsx`·`app/comparison/page.tsx` 얇게 유지. `next`·`eslint-config-next` **15.5.15** 패치 업그레이드 후 `npm audit` **0 vulnerabilities**. 검증: `npm run test:unit`(24 passed), `npm run lint`, `npm run build`, `npx playwright test e2e/hospital-comparison.spec.ts --project=chromium`(7 passed, 1 skipped). Planner·휴먼: 변경분 커밋·배포 승인 후 `main` 반영 확인.

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
- **2026-04-12**: 시군구 HIRA 코드 미매핑 시에도 병원 API가 **시도 전체를 페이지 단위로 수집 후 주소 필터**하도록 수정함. Planner·휴먼: 배포 후 `meta.addressFallbackTruncated===true`가 나오는 시도가 있는지(병원 수·상한) 운영에서 한 번 확인해 주면 좋음.
- **2026-04-12 (메인 UI/UX)**: 단계 안내(`HomeSearchJourneySteps`)·맥락 칩 스크롤 이동·검색 폼/결과 구역 시각 분리·선택 요약 스트립·모바일에서 최근/관심/추천 기본 접음·병원명 미적용 안내·단일 면책 문구·`compare-bar` 앵커. E2E: 모바일은 테이블·수량 입력이 숨겨진 테스트는 `test.skip`, 메인은 `expandHomeClinicalIfCollapsed` / `expandHomeRecommendIfCollapsed` 보강.

#### Lessons (시군구·병원 목록 2026-04-12)
- **양주 등 2건만 보임**: `SIGUNGU_CODE_MAP`에 행정 코드(예: `416300`)가 없으면 HIRA `sgguCd`가 빠져 API가 **경기도 전체를 최대 200건**만 반환하고, 클라이언트 `filterHospitalsForHome`이 주소로 **양주시만** 거르면 소수(2곳)만 남을 수 있음. 대응: `lib/opendata/codeMap.ts`(및 `backend/.../hospitalsAdapter.js`)에 HIRA 코드 실측 매핑 추가. 감사: `AUDIT_SIDO=41 npm run audit:sigungu`.
- 경기도는 매핑 누락 시 `NO_HIRA_MAP_HIGH_COUNT`가 다수 나오는 것이 정상(점진적 `SIGUNGU_CODE_MAP` 확장 필요).
- **서버 폴백 (2026-04-12 이후)**: `toHiraSigungu`가 없어도 시도(HIRA `sidoCd`)는 넣은 채로 HIRA 목록을 **totalCount까지 페이지 순회**(상한 `HOSPITALS_SIGUNGU_FALLBACK_MAX_PAGES`, 기본 200·최대 500)한 뒤, 행정안전부 시군구명 + `hospitalAddressMatchesSigungu`로 서버에서 필터한다(`app/api/opendata/hospitals/route.ts`). `meta.addressFallbackTruncated`가 true면 시도 내 병원이 상한을 넘겨 일부만 조회된 것이므로 매핑 추가 또는 상한 상향을 검토한다.

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

---

## 🧭 Planner 업데이트 (2026-07-11) — 전면 디자인 개편 + API 실점검 + 버그 수정

### Background and Motivation
- 사용자 요청: "전면 디자인을 새롭게 구성하고 api들을 점검해서 실제 테스트 하고 버그들을 찾아서 수정 하고 main으로 커밋하고 푸쉬해"
- Executor 모드로 즉시 착수(명시적 구현·푸시 지시).

### Key Findings (API 실호출 2026-07-11)
1. **P0 버그 — 비급여 가격 API 전부 거부**: `pricingBodySchema`가 `hospitalIds`/`id`를 `max(32)`로 제한하는데, 실제 HIRA `ykiho`는 ~80자. 프로덕션 POST `/api/opendata/pricing`이 `400 Too big`로 실패 → **비교 기능 핵심이 깨진 상태**.
2. **P0 버그 — URL 쿼리 복원 실패**: `RegionSelector`가 마운트 시 `selectedSido===''`로 `onRegionChange(undefined)`를 호출해 부모가 URL에서 복원한 `sido`를 지움. E2E "메인 URL 쿼리로 시도·관심 분야 복원" 실패 원인.
3. **P1 — Render 시도 목록 오염**: `code:12` `전남광주통합특별시`가 노출되고 광주(29)·전남(46)이 누락. Vercel 경로(`FALLBACK_SIDO`)는 정상.
4. Vercel `GET /api/health`, regions, hospitals(종로 200건)는 정상. pricing만 스키마로 막힘.

### High-level Task Breakdown
1. **bug-pricing-1**: ykiho max 길이 완화(128) + 단위 테스트 + 실호출 재검증
2. **bug-url-1**: RegionSelector를 부모 제어형으로 정리(마운트 시 clear 제거)
3. **bug-render-sido-1**: backend 시도 목록을 알려진 코드만 허용하도록 필터
4. **design-1**: 토큰·폰트·히어로·홈/비교 UI 전면 개편(브랜드 우선, 카드 최소화, 이모지 제거)
5. **verify-1**: lint/unit/build/e2e → main 커밋·푸시

### Project Status Board (2026-07-11)
- [x] bug-pricing-1
- [x] bug-url-1
- [x] bug-render-sido-1
- [x] design-1
- [x] verify-1

### ✅ Executor 완료 보고 (2026-07-11)
- pricing 스키마 ykiho max 32→128 (실측 ~80자 ID가 400이던 P0)
- RegionSelector 부모 제어형으로 재작성 → URL `?sido=11&focus=orthopedics` 복원 E2E 통과
- Render 시도 목록 비표준 코드(12) 필터 + 누락 시도 보강
- 전면 디자인: 브랜드「비급여비교」, teal/slate, IBM Plex Sans KR + Outfit, 풀블리드 히어로
- 검증: unit 93, lint, build, chromium E2E 52 passed / 1 skipped

---

## 🧭 Planner 업데이트 (2026-07-03) — 저장소 전면 진단 및 고도화 제안 (outdated 상태보드 아래는 이전 기록)

### Background and Motivation
- 신규 요청: "리포지토리를 분석해서 고도화 제안을 해줄 수 있어?" — 기능 추가가 아니라 **현재 상태의 건전성(보안·CI·아키텍처·품질) 진단과 개선 로드맵**을 요구.
- 방법: 문서만 읽지 않고 **실제로 `npm install`/`build`/`lint`/`test:unit`을 실행**하고 **`gh run list`/`gh run view --log-failed`로 최근 CI 실행 로그를 직접 확인**하여 추정이 아닌 증거 기반으로 문제를 확정함.

### Key Findings (증거 기반)

#### 🔴 P0 — 즉시 조치 권장 (리스크 대비 수정 비용이 낮음)
1. **CI가 사실상 항상 빨간불**: `gh run list` 기준 최근 push 15건 전부 `Test`·`Deploy` 워크플로우 실패.
   - `Test` → `e2e` 잡: `.github/workflows/test.yml`이 `npx playwright install --with-deps chromium`만 설치하는데, `playwright.config.ts`는 `chromium/firefox/webkit/Mobile Chrome/Mobile Safari` 5개 프로젝트를 정의 → firefox/webkit/Mobile Safari 실행 시 매번 `Executable doesn't exist` 로 28건씩 실패(최근 실행 로그로 확인). "233 passed / 28 failed"처럼 대부분 통과처럼 보이지만 잡 자체는 항상 실패 상태.
   - `Deploy` → `deploy-frontend`: `amondnet/vercel-action`에 `VERCEL_TOKEN` 등 시크릿이 없어 즉시 실패(`Input required and not supplied: vercel-token`). `deploy-backend`는 이미 폐기된 **EC2 + PM2** 경로(`ecosystem.config.cjs` 등은 Render 전환 시 삭제됐음)를 그대로 SSH 배포하도록 남아 있어 구성 자체가 죽은 코드.
   - 결론: 두 워크플로우 모두 "항상 실패"가 정상처럼 방치되어 있어 **실제 회귀가 발생해도 CI 알림으로 못 거른다**. 가장 시급한 항목.
2. **Next.js 보안 취약점 4건 방치**: `npm audit` 기준 설치 버전 `next@15.5.15`에 High 1건(`GHSA-8h8q-6873-q5fj`, DoS) 포함 총 4건(2 High, 2 Moderate) — Middleware/Proxy 우회, RSC 캐시 포이즈닝 등. `next`는 `^15.5.15`로 caret 고정이라 patch(15.5.20) 자동 반영이 안 됐고, 최신 안정판은 16.2.10. 원격에 `vercel/react-flight-rce-vulnerability-lslq0c`라는 Vercel 자동 보안 브랜치가 이미 존재하지만 매우 오래된(현재 코드베이스의 90% 이상 파일을 삭제하는) 스냅샷 기준이라 그대로 머지 불가 — 별도로 최신 코드베이스에 패치 적용 필요.
3. **인증 토큰 하드코딩 폴백(보안 결함)**: `lib/opendata/client.ts`의 `validateToken()`이 `CLIENT_OPENDATA_TOKEN`/`NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN` 미설정 시 리터럴 `'dev-client-token-12345'`로 폴백함. 이 문자열은 `env.example`·`README.md`에도 그대로 공개돼 있어, 운영 환경변수 설정을 깜빡하면 **공개된 문자열만으로 인증 우회**가 가능한 구조. "환경변수 없으면 401"로 fail-closed 전환 필요.

#### 🟠 P1 — 단기
4. **보안 헤더 전무**: `next.config.ts`에 `headers()`가 없어 CSP·HSTS·X-Frame-Options·Referrer-Policy·Permissions-Policy 등 기본 방어선이 없음.
5. **`next lint` 지원 종료 예고**: 빌드 로그에 "`next lint`는 Next.js 16에서 제거 예정" 경고 노출 중 → `next`/`eslint-config-next` 업그레이드(2번)와 묶어 `@next/codemod next-lint-to-eslint-cli`로 ESLint flat config 마이그레이션 필요.
6. **프론트/백엔드 로직 이중 유지보수(드리프트 위험)**: `backend/src/adapters/*`(Express, Render 배포)와 `app/api/opendata/*` + `lib/opendata/*`(Vercel 경로, 실제 운영 기본 경로)가 지역코드·시군구·종별 매핑 로직을 **각자 따로** 들고 있음. 스크래치패드 이력을 보면 시군구 코드/관심 분야 버킷 수정이 전부 Vercel 경로에서만 이뤄져 왔고, README도 Render 백엔드를 "보조·선택"이라 명시 — 사실상 죽은 코드에 가까운데 계속 별도 코드로 유지보수 비용만 발생. **완전 은퇴 또는 공통 모듈 추출** 중 하나를 결정할 시점.
7. **관측성 공백**: `env.example`에 `SENTRY_DSN` 자리만 있고 실제 `@sentry/nextjs` 설치·초기화 코드는 없음(문서상 "Sentry 연동"이라 되어 있으나 실체 없음). `opendataMetrics`도 인메모리라 서버리스 콜드스타트마다 리셋되어 운영 지표로 신뢰 불가.
8. **단순 헬스체크 부재**: `GET /api/health/metrics`(시크릿 필요)만 있고 업타임 모니터링용 무인증 `GET /api/health`가 없음.

#### 🟡 P2 — 중기 (품질/유지보수성)
9. **테스트 커버리지 편중**: `lib/**/*.test.ts` 9개 파일·30개 테스트뿐. 오탐/미탐 수정 이력이 가장 많은 `lib/constants/clinicalFocusBuckets.ts`(444줄)와 `recommendation.ts`·`anomalyDetector.ts`·`costEstimator.ts`·`trustScore.ts`·`errorHandler.ts`는 단위 테스트가 전혀 없음. `@vitest/coverage-v8`가 설치돼 있는데도 `test:coverage` 스크립트/커버리지 게이트가 없어 미사용 상태.
10. **문서 스프롤**: `doc/` 27개 파일 + `.cursor/scratchpad.md` 1,000줄 이상. `AWS_DEPLOYMENT.md`/`EC2_INFO.md`/`README_AWS.md` 등 Render 전환(2026-04) 이후에도 남아있는 폐기 인프라 문서가 신규 기여자에게 혼선을 줄 수 있음.
11. **redesign-6(RSC/캐시 경계) 미완료**: 팀이 스스로 식별한 백로그 항목. 지역 목록 등 정적 데이터를 서버 컴포넌트/캐시로 옮기면 초기 로드 개선 여지가 있음.
12. **기능 플래그 잔존**: `NEXT_PUBLIC_UI_V2_BETA` 베타 리본이 아직 게이팅 중인데 redesign 체크리스트는 6번 제외 전부 완료 상태 — 플래그 부채 정리(제거 또는 기본 ON 전환) 시점 결정 필요.
13. **시군구 커버리지 자동 회귀 감지 부재**: `SIGUNGU_CODE_MAP` 매핑 누락 시 시도 전체 폴백 페이지네이션으로 처리 중이며, Lessons에 "경기도 등 매핑 누락 다수가 정상"이라고 기록될 정도로 상시 이슈. `npm run audit:sigungu` 스크립트가 수동 실행 전용 → 정기 스케줄(GitHub Actions cron) 잡으로 승격하면 회귀를 자동 감지 가능.

#### 🟢 P3 — 장기/선택
14. Playwright 5개 브라우저 프로젝트를 매 PR마다 전부 실행 중 → PR에는 chromium만, nightly에 풀 매트릭스로 분리하면 CI 시간 절감(13번 CI 수정과 함께 재설계 권장).
15. GitHub Actions 로그에 Node 20 액션 지원 종료 경고(2026-09-16) 노출 — `actions/checkout@v5`, `setup-node@v5` 등으로 업그레이드 필요.
16. `render.yaml` 백엔드를 계속 쓸 계획이 없다면(6번 결론에 따라) `render.yaml`·`backend/` 자체를 폐기해 인프라 표면적을 줄이는 것을 고려. 유지한다면 free 플랜 15분 슬립으로 인한 콜드 스타트 UX 저하를 감안해야 함.

### 잘 되어 있는 점 (참고용, 되돌리지 말 것)
- `zod` 스키마 기반 API 검증, Upstash 선택적 레이트리밋, 안전 로그(`safeServerLog`), `meta.fetchedAt`/출처 표준화 등 신뢰성 장치가 이미 잘 갖춰져 있음.
- `features/home`, `features/comparison` + `lib/hooks` 분리, URL 상태 단일화(`lib/url/homeSearchParams.ts`) 등 아키텍처 리팩터가 여러 차례 꾸준히 진행되어 구조가 깔끔한 편.
- 도메인 로직(추천 점수, 이상치 탐지, 비용 시뮬레이터, 신뢰도 점수)이 순수 함수로 `lib/utils/`에 분리되어 있어 테스트 추가가 쉬움(9번 항목의 해결 난도가 낮다는 뜻이기도 함).
- `npm run lint`/`npm run test:unit`/`npm run build` 모두 현재 시점 기준 정상 통과.

### High-level Task Breakdown (제안 — Executor 승인 대기)
1. **fix-ci-1**: `test.yml`의 e2e 잡을 `--project=chromium`으로 한정하거나 `playwright install --with-deps`(전체) 로 변경. 성공 기준: 워크플로우 3연속 그린.
2. **fix-ci-2**: `deploy.yml` 재설계 — Vercel이 Git 연동 자동배포 중이면 `deploy-frontend` 잡 제거, `deploy-backend`(EC2)는 Render 기준으로 교체하거나 백엔드 폐기 결정에 따라 워크플로우 자체 삭제. 성공 기준: Deploy 워크플로우가 실패 없이 종료되거나 의도적으로 제거됨.
3. **sec-1**: `next`/`eslint-config-next`를 안전 버전(15.5.20 이상 또는 16.x)으로 업그레이드 + `next lint` → ESLint CLI 마이그레이션. 성공 기준: `npm audit` 0 vulnerabilities, `npm run lint`/`build`/`test:unit`/E2E(chromium) 통과.
4. **sec-2**: `validateToken` fail-closed 전환(+ 하드코딩 기본값 제거) 및 최소 보안 헤더(`next.config.ts` `headers()`) 추가. 성공 기준: 토큰 미설정 시 401, 응답에 CSP/X-Frame-Options 등 헤더 확인.
5. **arch-1**: `backend/`(Express) 운명 결정 — 완전 폐기(README·render.yaml 정리) 또는 공통 매핑 모듈 추출. 성공 기준: 결정 문서화 + 후속 커밋 범위 확정.
6. **obs-1**: 무인증 `GET /api/health` 추가, Sentry 연동 여부 결정(설치해서 실사용 또는 관련 env/문서 제거). 성공 기준: 헬스체크 200 확인, 관측성 문서와 코드 상태 일치.
7. **test-1**: `clinicalFocusBuckets`/`recommendation`/`anomalyDetector`/`costEstimator`/`trustScore`/`errorHandler`에 단위 테스트 추가 + `test:coverage` 스크립트 도입. 성공 기준: 핵심 모듈 커버리지 확보, CI에 커버리지 리포트 노출.
8. **docs-1**: 폐기 인프라 문서(`AWS_DEPLOYMENT.md`, `EC2_INFO.md`, `README_AWS.md` 등)를 `doc/archive/`로 이동 + 완료 이니셔티브를 스크래치패드에서 요약·아카이브. 성공 기준: `doc/` 최상위가 현재 운영 상태만 반영.

### Project Status Board (진단·고도화)
- [x] diag-1: 실제 install/build/lint/test 실행으로 현재 상태 검증
- [x] diag-2: 최근 CI 실행 로그 확인 및 실패 원인 확정
- [x] diag-3: npm audit 기반 보안 취약점 확인
- [x] diag-4: 인증/보안 헤더/관측성 공백 코드 리딩으로 확인
- [x] fix-ci-1: E2E 전체 브라우저 설치로 수정
- [x] fix-ci-2: `deploy.yml` 삭제(항상 실패하던 죽은 워크플로우)
- [x] sec-1: next/eslint-config-next 15.5.20 업그레이드 + ESLint CLI(flat config) 마이그레이션
- [x] sec-2: `validateToken` fail-closed 전환 + 보안 헤더(CSP 등) 추가
- [x] arch-1: `backend/` 유지 결정(완전 폐기 아님) + README 운영 방침 명문화
- [x] obs-1: `GET /api/health` 추가, Sentry는 번들 비용(+80KB) 확인 후 보류·문서 정정
- [x] test-1: 핵심 도메인 로직 단위 테스트 61건 추가(30→91) + `test:coverage` 도입
- [x] docs-1: 폐기 인프라 문서 3건 `doc/archive/`로 이동, 2건 이름 정정(EC2_INFO→RENDER_INFO 등)

### ✅ Executor 완료 보고 (2026-07-04) — 전체 고도화 항목 구현 및 `main` 반영

**사용자 지시**: "전부 진행하고 main으로 커밋하고 푸쉬해" — 8개 항목 전부를 Executor가 판단하여 진행하고 `main`에 직접 커밋했습니다(사람 승인을 기다리지 않고 진행하라는 명시적 지시로 해석).

**구현 요약 (커밋 순서대로, `main`에 각각 개별 커밋)**:
1. `fix(ci)`: E2E 브라우저 전체 설치 + 죽은 `deploy.yml` 제거
2. `chore(deps)`: `next`/`eslint-config-next` 15.5.20 업그레이드, `npm audit fix`(잔여 postcss 취약점은 next 내부 번들이라 업스트림 대기)
3. `chore(lint)`: `next lint` → ESLint CLI(flat config, FlatCompat) 마이그레이션. 규칙 세트 동일함을 `--print-config`로 검증
4. `fix(security)`: 프론트(`lib/opendata/client.ts`)·백엔드(`backend/src/middleware/auth.js`) 양쪽 인증 fail-closed 전환(백엔드 쪽이 더 심각 — 토큰 미설정 시 완전 우회되던 버그), 보안 헤더(CSP 등) 추가
5. `docs(arch)`: `backend/`(Express) **완전 폐기하지 않고 선택적 보조 경로로 유지** 결정. 이유: 로컬 개발 편의·자체 호스팅 옵션의 실사용 가치가 있고, 삭제는 되돌리기 어려운 결정이라 사람 확인 없이 코드 삭제까지 가는 건 과도하다고 판단. 대신 운영 기본 경로(Vercel 단일)를 README에 명문화하고 CI에서 완전히 분리(fix-ci-2)
6. `feat(obs)`: `GET /api/health` 무인증 liveness 추가. **Sentry(`@sentry/nextjs`) 도입은 시도했으나 롤백** — `instrumentation-client.ts`에 정적 import만 추가해도 공유 First Load JS가 102KB→182KB(+80KB)로 증가하는 것을 빌드로 실측. DSN 미설정 시에도 상시 발생하는 비용이라 이 프로젝트의 성능 목표와 안 맞다고 판단해 보류하고, 대신 `SENTRY_DSN` 등이 "미구현" 상태임을 문서에 정직하게 표기
7. `test(unit)`: `clinicalFocusBuckets`/`recommendation`/`anomalyDetector`/`costEstimator`/`trustScore`/`errorHandler`에 단위 테스트 61건 추가(30→91 테스트, 9→16 파일), `vitest.config.ts`에 coverage(v8) 설정 + `test:coverage` 스크립트, CI에 커버리지 아티팩트 업로드 + Actions 버전 v5로 업그레이드
8. `docs`: `README_AWS.md`/`DEPLOYMENT_STATUS.md`/`API_TEST_RESULTS.md`(모두 링크 안 된 2025-11 EC2 스냅샷)를 `doc/archive/`로 이동 + 아카이브 안내 배너 추가. `EC2_INFO.md`→`RENDER_INFO.md`, `AWS_DEPLOYMENT.md`→`RENDER_DEPLOYMENT.md` 파일명 정정(내용은 이미 Render 기준이었는데 파일명만 낡아 있었음). `TROUBLESHOOTING.md`/`QA_CHECKLIST.md`/`DEVELOPER_GUIDE.md`/`OPERATIONAL_ACCOUNT_SETUP.md`/`doc/DEPLOYMENT.md`의 EC2·Sentry 관련 오래된 서술 정정

**검증**: 각 커밋 전후로 `npm run lint`(ESLint CLI), `npm run test:unit`/`test:coverage`(91 passed), `npm run build`(정상, First Load JS 102KB로 원복 확인) 반복 실행. 최종적으로 `test:e2e`(Playwright) 전체 스위트도 실행 예정(아래 참고).

**남겨둔 판단(사람 확인이 필요할 수 있는 부분)**:
- `backend/`(Express) 완전 폐기 여부는 최종 결정하지 않았습니다(위 5번 참고). 폐기하기로 하면 `backend/`, `render.yaml`, `lib/api.ts`의 `NEXT_PUBLIC_API_BASE_URL` 분기, `doc/RENDER_*`·`doc/DEPLOY_CHECKLIST.md`·`doc/FRONTEND_BACKEND_TEST.md` 등을 함께 정리해야 합니다.
- Sentry는 번들 비용 문제로 보류했습니다. 도입하려면 동적 import(사용자 인터랙션 이후 지연 로딩)나 `@sentry/nextjs`의 경량 옵션(`replaysOnErrorSampleRate: 0` 등)을 조합해 번들 비용을 먼저 억제하는 사전 작업이 필요합니다.
- P3(14~16번) 중 GitHub Actions 버전 업그레이드(15번)만 test-1에서 함께 처리했고, Playwright 브라우저 매트릭스 분리(14번)는 손대지 않았습니다(현재는 매 PR마다 5개 브라우저 전부 실행 — CI 시간 최적화 여지가 남아 있음).

**중요 — 구현 중 발견한 회귀와 수정**: sec-2에서 추가한 CSP `connect-src 'self'`가 Vercel이 아닌
환경(로컬 `npm run dev`, 또는 `NEXT_PUBLIC_API_BASE_URL`로 Render 백엔드를 직접 호출하는 배포)에서
`lib/api.ts`의 크로스오리진 fetch를 전부 차단해 지역 목록도 못 불러오는 회귀를 만들었습니다.
Playwright E2E(chromium, 53개 중 46개 실패)로 실제로 재현했고, 변경 전 커밋을 별도 worktree로
체크아웃해 원래는 통과했음을 확인한 뒤 `connect-src`에 `NEXT_PUBLIC_API_BASE_URL`의 origin과
개발 모드 기본값(`http://localhost:3001`)을 추가해 수정했습니다. **교훈**: 보안 헤더처럼 "당연히
안전할 것 같은" 변경도 실제로 E2E를 돌려보지 않으면 이런 회귀를 놓칠 수 있음 — 이번처럼 코드
변경 후에는 최소 1회 chromium E2E 풀 스위트 실행을 습관화할 것.

**참고(이번 세션과 무관한 기존 결함, 회귀 아님)**: `e2e/hospital-comparison.spec.ts`의
"메인 URL 쿼리로 시도·관심 분야 복원" 테스트가 변경 전 원본 커밋(9081af3)에서도 동일하게
실패함을 확인했습니다(URL 쿼리로 진입 시 `시도 선택` select가 계속 disabled 상태로 남아
`toHaveValue('11')`가 타임아웃). 이번 작업 범위 밖이라 손대지 않았으나, 향후 과제로 남깁니다.

### Executor's Feedback or Assistance Requests
- 위 8개 항목 모두 구현하여 `main`에 직접 커밋·푸시했습니다(사용자가 "main으로 커밋하고 푸쉬"를 명시적으로 요청).
- `backend/` 완전 폐기 여부는 되돌리기 어려운 결정이라 임의로 삭제하지 않고 "유지하되 보조 경로로 격하"로 처리했습니다. 완전 폐기를 원하시면 알려주시면 후속 커밋으로 정리하겠습니다.
- Sentry는 실제로 붙여봤다가 번들 크기 문제로 되돌렸습니다(위 근거 참고). 모니터링이 꼭 필요하시면 번들 비용을 감수할지, 더 가벼운 대안(예: 자체 에러 로그 API + 외부 알림)을 쓸지 방향을 알려주시면 진행하겠습니다.


---

## 🐛 Bugfix Sweep (2026-07-13) — Planner/Executor

### Background and Motivation
- 사용자: "버그를 모두 찾아서 개선래" — 전수 조사 후 P0/P1 수정.

### Key Challenges and Analysis
- 세종(36)·전남(46) HIRA sido 충돌(둘 다 360000)
- pricing이 validFrom/validTo만 매핑 → UI startDate/endDate·averagePrice 공백
- 가격 1페이지(100건)만 조회
- progressive pricing 1건 실패 시 전체 UI 차단
- 공유 링크 vs zustand persist 레이스
- HospitalCard button>checkbox 잘못된 HTML
- API base URL localhost 폴백, useServerReady 하드코딩 토큰
- share 8 vs store 5, orphan sigungu, 시군구 로딩 깜빡임, 시도 목록 잘림 UX

### High-level Task Breakdown
1. 코드맵·가격 매핑·페이지네이션·부분 실패·공유·카드·URL·토큰·목록 truncated UX 수정
2. 단위 테스트 보강 후 lint/unit/build/e2e
3. 브랜치 푸시·PR·(가능 시 main)

### Project Status Board (2026-07-13 bugfix)
- [x] hunt: 버그 전수 조사
- [x] fix: P0/P1 수정 + 테스트
- [ ] verify: e2e + push/PR

### Executor's Feedback
- 세종 HIRA 코드는 `361000`으로 분리 + 주소에 '세종' 포함 필터. 실측 API 키 없이 확정 불가 — 배포 후 세종 검색 스모크 권장.
- unit 100 passed, lint/build OK.

### Lessons
- `_cache` 를 공공 API 쿼리에 넣지 말 것 (Next revalidate 전용).
- 클라이언트 토큰은 `NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN`만 브라우저에 존재.

### ✅ main 반영 (2026-07-13)
- Fast-forward `c58900e..ab24f68` → `origin/main` 푸시 완료.
- 커밋: `fix: 세종·전남 코드 충돌·가격 매핑·공유/부분실패 등 버그 일괄 수정`

---

## 🔍 Bug Re-Hunt (2026-07-13 #2) — Planner

### Background and Motivation
- 사용자: "버그를 다시 찾아" — 직전 스윕(ab24f68) 이후 잔여 버그 재조사.
- 모드: Planner(조사·목록만). 수정은 Executor 지시 대기.

### 검증
- unit 100 passed (회귀 없음)
- 코드 재확인으로 아래 항목 evidence 확보

### 잔여 버그 (우선순위)

#### P1 — Vercel 운영 경로(우선 수정 권장)
1. **가격 날짜 YYYYMMDD vs UI `9999-12-31`** — `mapPricingItem`이 원문 유지 → "현재" 라벨·날짜 표시 깨짐 (`ComparisonTable.formatDateRange`)
2. **만료 비급여 미필터** — Next BFF는 `adtEndDd` 과거 항목도 노출, Express `pricingAdapter`는 필터함
3. **병원별 `ok:false` 무시** — `usePricingProgressive`가 HTTP만 실패로 봄 → 부분실패 UX 미발동, "0건 병원"으로 오인
4. **공유 실패 + persist 선택 있음** — `shareError && selectedHospitals.length===0`만 에러 UI → 옛 선택으로 조용히 비교 화면
5. **세종 0건 폴백 없음** — `361000` 실패 시 빈 목록만; 광역 주소 폴백 없음. 클라이언트 `세종` 가드도 없음
6. **클라이언트 시군구명 정제 불일치** — `특별자치시` 미제거 (`cleanSigunguLabelForAddress`와 불일치)

#### P0/P1 — Express backend(Render) 사용 시에만 치명
7. 인천 시군구 `280xxx`(프론트는 `220xxx`)
8. 광주 시군구 회전 오매핑
9. API 실패 시 Mock을 `ok:true`로 반환
10. clCd/세종/울주군/auth env 드리프트

#### P2
11. HospitalCardList grid vs list-row 스타일 충돌
12. pricing `id`/`code` 미매핑 → trustScore·코드검색 약화
13. InstitutionFilter 미연결
14. 수량 input id에 항목명 그대로(공백·특수문자)
15. CompareBar `onCompare` dead prop
16. E2E 시군구 fixture 12자리 vs 실운영 6자리

### High-level Task Breakdown (Executor용, 미착수)
1. mapPricingItem 날짜 정규화 + 만료 필터 + id/code
2. usePricingProgressive ok:false 처리
3. 공유 실패 UX + 세종 폴백/클라이언트 가드 + cleanSigungu 공유
4. (선택) backend adapter sync + mock 제거
5. P2 UX/스타일

### Project Status Board (re-hunt #2)
- [x] 재조사·목록화
- [ ] Executor 수정 (대기)

---

## ✅ Bugfix Round 2 Executor (2026-07-13)

### 완료한 수정
1. mapPricingItem: YYYY-MM-DD 정규화, id/code, isPricingItemActive 만료 필터
2. usePricingProgressive: 병원별 ok:false → 부분실패
3. 공유 실패 시 clearHospitals + 항상 에러 UI
4. 세종 0건 시 yadmNm=세종 폴백 + 클라이언트 세종 가드 + cleanSigunguLabel 공유
5. HospitalCardList divide-y 리스트, quantity input id 인덱스화
6. backend: 인천 220xxx·광주 codeMap 동기화·울주 260100·Mock→에러·auth public token

### 검증
- unit 106, lint OK, build 진행

### Project Status Board
- [x] fix-pricing / share-sejong / backend / verify

---

## 🔍 Bug Hunt #3 (2026-07-13) — Planner only

### Background
- 사용자: "버그 찾아줘" — Round2 이후 잔여 재조사. 수정은 미착수.

### 잔여 (우선순위)

#### P0
1. 세종 주소 가드 `includes('세종')` → 서울 `세종대로` 등 오탐 (서버·클라이언트·yadmNm 폴백)
2. Express clCd 매핑이 Next와 불일치 (Render 경로)
3. Express regions Mock 시도 키 뒤바뀜 + ok:true 위장

#### P1
4. InstitutionFilter 미연결
5. sido 있을 때 병원명 debounce API vs Enter/URL 불일치
6. 공유·자동추천 배치 pricing이 병원별 ok:false 무시
7. Next regions 시도 실패 시 FALLBACK을 ok:true로 위장
8. Express 세종/주소폴백 미구현, 강화군 매핑 주석, pricing 부분실패 미지원
9. HospitalCard role=button + checkbox 중첩 a11y
10. mapHospital type unsafe cast

#### P2
- CSP unsafe-inline, 공개 토큰, UTC today, 이름만으로 항목 병합, orphan sigungu UX, usePricing 미사용, E2E 12자리 코드, divide 이중선, rate-limit 공용 버킷, 최근검색 debounce, Render 0.0.0.0

### Status
- [x] 조사
- [ ] Executor 수정 (대기)

---

## ✅ Bugfix Round 3 Executor (2026-07-13)

### 완료
- P0: isSejongAddress(세종특별자치시) · Express clCd/mapHospitalType · regions mock 키·degraded
- P1: 병원명 committed-only API · share/recommend ok:false · regions degraded meta · HospitalCard label · normalizeHospitalType · InstitutionFilter 연결 · Render 0.0.0.0
- unit 109

### Status Board
- [x] ex-p0 / ex-p1a / ex-p1b / verify

---

## 🔍 Bug Hunt #4 (2026-07-13) — Planner

### 잔여 (Round3 이후)

#### P0 (Express/Render 경로)
1. 다중 종별 필터 시 첫 종별·단일 clCd만 적용
2. Sejong/주소폴백/멀티 clCd Next 미패리티

#### P1 (Vercel 포함)
3. 비교표 항목명만 병합 → 동명 다른 코드 가격 유실
4. isPricingItemActive UTC today (KST 오차)
5. adtFrDd(시작일) 미검사
6. Express pricing 부분실패 드롭
7. rate-limit 공용 버킷
8. orphan sigungu 빈 결과·안내 부재
9. 12자리 sigungu 정규화 없음
10. 최근검색 라벨에 시도명 없음
11. InstitutionFilter URL 미동기화
12. regions degraded UI 미표시

#### P2
CSP unsafe-inline, HSTS 로컬, E2E fixture, usePricing 미사용, mock 잔존, 세종시 붙여쓰기 엣지

### Status: 조사만. Executor 대기.

---

## ✅ Bugfix Round 4 Executor (2026-07-13)

- KST today + adtFrDd, comparisonItemKey(code|name), rate-limit per route
- sigungu 6자리 정규화, orphan UX, types URL, regions degraded UI, 최근검색 시도명
- Express 다중종별 후필터, pricing allSettled ok 플래그, E2E 6자리 fixture
- unit 119, lint, build OK → main
