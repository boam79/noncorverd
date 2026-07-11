'use client';

import { useMemo } from 'react';
import { useRegions } from '@/lib/hooks/useRegions';

interface RegionSelectorProps {
  onRegionChange: (sido?: string, sigungu?: string) => void;
  sido?: string;
  sigungu?: string;
}

/**
 * 부모 제어형 지역 선택.
 * 내부 state + useEffect로 부모에 다시 알리던 이전 구현은 마운트 시
 * `onRegionChange(undefined)`를 호출해 URL에서 복원한 sido를 지우는 버그가 있었습니다.
 */
export function RegionSelector({
  onRegionChange,
  sido: parentSido,
  sigungu: parentSigungu,
}: RegionSelectorProps) {
  const selectedSido = parentSido ?? '';
  const selectedSigungu = parentSigungu ?? '';

  const { data: sidoBundle, isLoading: isLoadingSido, error: sidoError } = useRegions();
  const { data: sigunguBundle, isLoading: isLoadingSigungu, error: sigunguError } =
    useRegions(selectedSido || undefined);

  const safeSidoList = useMemo(() => sidoBundle?.regions ?? [], [sidoBundle]);
  const safeSigunguList = useMemo(
    () => sigunguBundle?.regions ?? [],
    [sigunguBundle]
  );

  const handleSidoChange = (value: string) => {
    // 시도가 바뀌면 시군구는 항상 초기화(부모 handleRegionChange와 계약 일치)
    onRegionChange(value || undefined, undefined);
  };

  const handleSigunguChange = (value: string) => {
    onRegionChange(selectedSido || undefined, value || undefined);
  };

  return (
    <div className="space-y-4">
      {(sidoError || sigunguError) && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {sidoError && (
            <p>시도 목록을 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.</p>
          )}
          {sigunguError && <p>시군구 목록을 불러오는데 실패했습니다.</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-ink">시도</label>
          <select
            value={selectedSido}
            onChange={(e) => handleSidoChange(e.target.value)}
            className="touch-target w-full rounded-control border border-line bg-surface px-4 py-3.5 transition-colors focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-surface-muted"
            disabled={isLoadingSido}
            aria-label="시도 선택"
          >
            <option value="">전체</option>
            {isLoadingSido && <option disabled>로딩 중...</option>}
            {!isLoadingSido && safeSidoList.length === 0 && (
              <option disabled>시도 목록을 불러올 수 없습니다</option>
            )}
            {safeSidoList.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink">시군구</label>
          <select
            value={selectedSigungu}
            onChange={(e) => handleSigunguChange(e.target.value)}
            className="touch-target w-full rounded-control border border-line bg-surface px-4 py-3.5 transition-colors focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-surface-muted"
            disabled={!selectedSido || isLoadingSigungu}
            aria-label="시군구 선택"
          >
            <option value="">
              {!selectedSido
                ? '시도를 먼저 선택하세요'
                : isLoadingSigungu
                  ? '로딩 중...'
                  : '전체'}
            </option>
            {safeSigunguList.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
