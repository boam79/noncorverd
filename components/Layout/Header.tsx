'use client';

import { useRouter } from 'next/navigation';

interface HeaderProps {
  onHomeClick?: () => void;
  /** 홈 히어로가 브랜드를 이미 크게 보여줄 때 헤더는 얇은 바만 */
  compact?: boolean;
}

export function Header({ onHomeClick, compact = false }: HeaderProps = {}) {
  const router = useRouter();

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    }
    router.push('/');
  };

  if (compact) {
    return (
      <header className="sticky top-0 z-40 border-b border-line/80 bg-surface-glass backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleHomeClick}
            className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            aria-label="비급여비교 홈으로"
          >
            <span className="font-display text-lg font-semibold tracking-tight text-ink transition-colors group-hover:text-brand-700 md:text-xl">
              비급여비교
            </span>
          </button>
          <span className="hidden text-xs text-ink-soft sm:inline">공공데이터 기반</span>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-line/80 bg-surface-glass backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 md:py-6">
        <button
          type="button"
          onClick={handleHomeClick}
          className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          aria-label="비급여비교 홈으로"
        >
          <span className="font-display text-3xl font-semibold tracking-tight text-ink transition-colors group-hover:text-brand-700 md:text-4xl">
            비급여비교
          </span>
          <p className="mt-1.5 text-sm text-ink-muted">전국 병원 비급여 수가 검색·비교</p>
        </button>
      </div>
    </header>
  );
}
