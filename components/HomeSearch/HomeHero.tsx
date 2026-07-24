'use client';

/**
 * 홈 첫 화면 히어로 — 브랜드 우선, 한 줄 헤드라인, 짧은 설명, CTA, 풀블리드 비주얼.
 */
export function HomeHero({ onStart }: { onStart: () => void }) {
  return (
    <section
      className="relative isolate overflow-hidden hero-visual text-white"
      aria-labelledby="home-brand"
    >
      <div className="atmosphere-grid absolute inset-0 opacity-40" aria-hidden />

      {/* 가격 비교를 암시하는 막대 비주얼 (장식, 오버레이 배지 아님) */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] items-end gap-3 px-10 pb-16 md:flex"
        aria-hidden
      >
        {[42, 68, 55, 88, 61].map((h, i) => (
          <div
            key={i}
            className="animate-bar-grow origin-bottom rounded-sm bg-white/20"
            style={{
              height: `${h}%`,
              width: '18%',
              animationDelay: `${120 + i * 90}ms`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex min-h-[72vh] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 md:min-h-[68vh] lg:px-8">
        <p
          id="home-brand"
          className="animate-hero-rise font-display text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl"
        >
          비급여비교
        </p>
        <h1 className="animate-hero-rise mt-5 max-w-xl text-balance text-2xl font-medium leading-snug text-white/95 md:text-3xl" style={{ animationDelay: '80ms' }}>
          병원 비급여, 나란히 보고 고르세요
        </h1>
        <p className="animate-hero-rise mt-4 max-w-md text-base leading-relaxed text-white/75 md:text-lg" style={{ animationDelay: '140ms' }}>
          지역과 관심 분야로 의료기관을 찾고, 공공데이터 비급여 수가를 한 화면에서 비교합니다.
        </p>
        <div className="animate-hero-rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '200ms' }}>
          <button
            type="button"
            onClick={onStart}
            className="touch-target rounded-control bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800"
          >
            지역으로 찾기
          </button>
          <a
            href="#search-heading"
            className="touch-target rounded-control border border-white/35 px-5 py-3 text-sm font-medium text-white/90 transition-colors hover:border-white/60 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            검색하기
          </a>
        </div>
      </div>
    </section>
  );
}
