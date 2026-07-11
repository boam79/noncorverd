'use client';

type StepState = 'complete' | 'current' | 'upcoming';

function stepMark(state: StepState, n: number) {
  const base =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-sm font-semibold transition-colors';
  if (state === 'complete') {
    return `${base} bg-brand-700 text-white`;
  }
  if (state === 'current') {
    return `${base} bg-brand-100 text-brand-900 ring-2 ring-brand-600 ring-offset-2 ring-offset-[var(--color-page)]`;
  }
  return `${base} border border-line bg-surface-muted text-ink-soft`;
}

function connectorClass(left: StepState) {
  if (left === 'complete') return 'bg-brand-300';
  return 'bg-line';
}

export interface HomeSearchJourneyStepsProps {
  hasSido: boolean;
  selectedCount: number;
}

/**
 * 검색 흐름 안내 — 히어로 아래(두 번째 섹션)에 배치.
 */
export function HomeSearchJourneySteps({ hasSido, selectedCount }: HomeSearchJourneyStepsProps) {
  const s1: StepState = !hasSido ? 'current' : 'complete';
  const s2: StepState = !hasSido ? 'upcoming' : selectedCount > 0 ? 'complete' : 'current';
  const s3: StepState = selectedCount > 0 ? 'current' : 'upcoming';

  return (
    <nav className="mb-8 border-b border-line pb-6" aria-label="검색 진행 단계">
      <ol className="flex flex-wrap items-center gap-2 md:gap-3">
        <li className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:min-w-[7.5rem]">
          <span className={stepMark(s1, 1)} aria-hidden>
            {s1 === 'complete' ? '✓' : '1'}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-soft">1단계</p>
            <p
              className={`truncate text-sm font-medium ${s1 === 'current' ? 'text-brand-900' : 'text-ink'}`}
            >
              지역 정하기
            </p>
          </div>
        </li>
        <div
          className={`mx-1 hidden h-0.5 w-6 shrink-0 rounded sm:block ${connectorClass(s1)}`}
          aria-hidden
        />
        <li className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:min-w-[7.5rem]">
          <span className={stepMark(s2, 2)} aria-hidden>
            {s2 === 'complete' ? '✓' : '2'}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-soft">2단계</p>
            <p
              className={`truncate text-sm font-medium ${s2 === 'current' ? 'text-brand-900' : 'text-ink'}`}
            >
              병원 고르기
            </p>
          </div>
        </li>
        <div
          className={`mx-1 hidden h-0.5 w-6 shrink-0 rounded sm:block ${connectorClass(s2)}`}
          aria-hidden
        />
        <li className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:min-w-[7.5rem]">
          <span className={stepMark(s3, 3)} aria-hidden>
            3
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-soft">3단계</p>
            <p
              className={`truncate text-sm font-medium ${s3 === 'current' ? 'text-brand-900' : 'text-ink'}`}
            >
              비교하기
            </p>
          </div>
        </li>
      </ol>
      <p className="mt-3 text-xs text-ink-soft">
        지역을 고른 뒤 목록에서 병원을 선택하면 하단의 비교 바에서 이어갈 수 있어요.
      </p>
    </nav>
  );
}
