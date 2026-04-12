'use client';

type StepState = 'complete' | 'current' | 'upcoming';

function stepCircle(state: StepState, n: number) {
  const base =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors';
  if (state === 'complete') {
    return `${base} bg-primary-600 text-white`;
  }
  if (state === 'current') {
    return `${base} bg-primary-100 text-primary-900 ring-2 ring-primary-500 ring-offset-2 ring-offset-white`;
  }
  return `${base} border border-line bg-surface-muted text-gray-500`;
}

function connectorClass(left: StepState, right: StepState) {
  if (left === 'complete' && right !== 'upcoming') return 'bg-primary-300';
  if (left === 'complete' && right === 'upcoming') return 'bg-primary-200';
  return 'bg-line';
}

export interface HomeSearchJourneyStepsProps {
  /** 시도 선택 여부 */
  hasSido: boolean;
  /** 비교 예정 병원 수 */
  selectedCount: number;
}

/**
 * 메인 검색 흐름: 지역 → 목록에서 선택 → 비교
 */
export function HomeSearchJourneySteps({ hasSido, selectedCount }: HomeSearchJourneyStepsProps) {
  const s1: StepState = !hasSido ? 'current' : 'complete';
  const s2: StepState = !hasSido ? 'upcoming' : selectedCount > 0 ? 'complete' : 'current';
  const s3: StepState = selectedCount > 0 ? 'current' : 'upcoming';

  return (
    <nav
      className="mb-6 rounded-card border border-line bg-surface px-4 py-4 shadow-sm md:px-6"
      aria-label="검색 진행 단계"
    >
      <ol className="flex flex-wrap items-center gap-2 md:gap-3">
        <li className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:min-w-[7.5rem]">
          <span className={stepCircle(s1, 1)} aria-hidden>
            {s1 === 'complete' ? '✓' : '1'}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500">1단계</p>
            <p
              className={`truncate text-sm font-medium ${s1 === 'current' ? 'text-primary-900' : 'text-gray-900'}`}
            >
              지역 정하기
            </p>
          </div>
        </li>
        <div
          className={`mx-1 hidden h-0.5 w-6 shrink-0 rounded sm:block ${connectorClass(s1, s2)}`}
          aria-hidden
        />
        <li className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:min-w-[7.5rem]">
          <span className={stepCircle(s2, 2)} aria-hidden>
            {s2 === 'complete' ? '✓' : '2'}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500">2단계</p>
            <p
              className={`truncate text-sm font-medium ${s2 === 'current' ? 'text-primary-900' : 'text-gray-900'}`}
            >
              병원 고르기
            </p>
          </div>
        </li>
        <div
          className={`mx-1 hidden h-0.5 w-6 shrink-0 rounded sm:block ${connectorClass(s2, s3)}`}
          aria-hidden
        />
        <li className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:min-w-[7.5rem]">
          <span className={stepCircle(s3, 3)} aria-hidden>
            3
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500">3단계</p>
            <p
              className={`truncate text-sm font-medium ${s3 === 'current' ? 'text-primary-900' : 'text-gray-900'}`}
            >
              비교하기
            </p>
          </div>
        </li>
      </ol>
      <p className="mt-3 text-xs text-gray-500">
        지역을 고른 뒤 목록에서 병원을 선택하면 하단의 비교 바에서 이어갈 수 있어요.
      </p>
    </nav>
  );
}
