# 전면 개편 v2 (Planner 스펙 요약)

## 유지할 사용자 가치 (redesign-0)

1. **공공데이터 기반**으로 지역·이름·관심 분야로 병원을 찾고, **비급여 항목을 여러 병원과 나란히** 비교할 수 있을 것.
2. **데이터가 없거나 필터로 0건**일 때, 원인을 숨기지 않고 **이해 가능한 안내**를 보여 줄 것.
3. **비교 링크 공유**(`?s=` 등 기존 규칙)과 **메인 검색 조건 공유**(`sido`, `sigungu`, `q`, `focus`)가 가능할 것.

## 이번 스코프에서 제외 (Post-v2)

- 로그인·개인화·즐겨찾기 서버 동기화.
- 병원 상세 페이지·지도·리뷰.
- 완전한 행정 진료과목 트리 UI(이름·코드 추정 규칙은 기존 유지).

## 정보 구조 (redesign-1)

- **메인**: 검색 조건(지역·이름·관심 분야) → 결과 목록 → 선택 칩 → 하단 비교 바.
- **비교**: 선택 병원 고정 후 가격 점진 로딩·표·모바일 뷰(기존 패널 유지, 토큰·레이아웃만 정렬).

## URL 계약 (redesign-2)

| 파라미터   | 의미 |
|-----------|------|
| `sido`    | 시도 코드 (예: `11`) |
| `sigungu` | 시군구 코드 |
| `q`       | **확정** 병원명 검색어(검색 버튼 또는 동일 의미의 확정 시 반영) |
| `focus`   | 관심 분야 ID (`ClinicalFocusId`, `none`은 생략) |

- 구현: `lib/url/homeSearchParams.ts`.
- 첫 로드는 `window.location.search`로 복원한 뒤, 이후 `router.replace`로 동기화한다.
- 브라우저 **뒤로가기**는 `popstate`로 복원한다(App Router 소프트 내비와 함께 쓸 때는 주소줄 기준).

## 디자인 토큰 (redesign-3)

- `tailwind.config.ts`: `colors.page`, `spacing.section` / `section-lg`, `borderRadius.card` / `control`.
- 메인·비교 루트에 `bg-page`, `py-section`, `rounded-card` 등 적용(점진 확대 가능).

## 코드 구조 (redesign-4)

- `features/home/HomePageContent.tsx` — 메인 클라이언트 화면.
- `features/comparison/ComparisonPageClient.tsx` — 비교 클라이언트 화면.
- `app/page.tsx`, `app/comparison/page.tsx` — RSC + `Suspense` 얇은 래퍼.

## 베타 플래그 (redesign-7)

- `NEXT_PUBLIC_UI_V2_BETA=1` 시 메인 상단에 베타 안내 리본 표시(`lib/featureFlags.ts`).

## 검증 체크리스트 (redesign-8)

- [x] `npm run test:unit`
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npx playwright test e2e/hospital-comparison.spec.ts --project=chromium`

## 다음 Executor 제안

- 메인·비교 외 화면에 동일 토큰 적용.
- `q`와 입력창 미확정 값 분리 UX(디바운스 반영 여부)를 기획과 합의 후 문서·URL 규칙에 명시.
