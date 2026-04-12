'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRegions } from '@/lib/hooks/useRegions';

interface RegionSelectorProps {
  onRegionChange: (sido?: string, sigungu?: string) => void;
  sido?: string; // 부모 컴포넌트의 sido 상태
  sigungu?: string; // 부모 컴포넌트의 sigungu 상태
}

export function RegionSelector({ onRegionChange, sido: parentSido, sigungu: parentSigungu }: RegionSelectorProps) {
  const [selectedSido, setSelectedSido] = useState<string>('');
  const [selectedSigungu, setSelectedSigungu] = useState<string>('');
  
  // 부모 컴포넌트의 상태와 동기화
  useEffect(() => {
    if (parentSido !== undefined) {
      setSelectedSido(parentSido || '');
    }
  }, [parentSido]);
  
  useEffect(() => {
    if (parentSigungu !== undefined) {
      setSelectedSigungu(parentSigungu || '');
    }
  }, [parentSigungu]);

  const { data: sidoBundle, isLoading: isLoadingSido, error: sidoError } = useRegions();
  const { data: sigunguBundle, isLoading: isLoadingSigungu, error: sigunguError } =
    useRegions(selectedSido);

  const safeSidoList = useMemo(
    () => sidoBundle?.regions ?? [],
    [sidoBundle]
  );
  const safeSigunguList = useMemo(
    () => sigunguBundle?.regions ?? [],
    [sigunguBundle]
  );

  // 시도 변경 시 시군구 초기화
  useEffect(() => {
    if (selectedSido) setSelectedSigungu('');
  }, [selectedSido]);

  // 지역 변경 알림 (시도와 시군구 변경 시)
  useEffect(() => {
    if (selectedSido) {
      // 시도가 있을 때만 알림
      // sigungu가 빈 문자열이면 undefined로 전달 (전체 선택)
      onRegionChange(selectedSido, selectedSigungu || undefined);
    } else {
      // 시도가 없으면 모두 초기화
      onRegionChange(undefined, undefined);
    }
  }, [selectedSido, selectedSigungu, onRegionChange]);

  return (
    <div className="space-y-4">
      {/* 에러 메시지 표시 */}
      {(sidoError || sigunguError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {sidoError && <p>시도 목록을 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.</p>}
          {sigunguError && <p>시군구 목록을 불러오는데 실패했습니다.</p>}
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 시도 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            시도
          </label>
          <select
            value={selectedSido}
            onChange={(e) => setSelectedSido(e.target.value)}
            className="w-full touch-target rounded-control border border-gray-300 bg-surface px-4 py-3.5 transition-all focus:border-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-100"
            disabled={isLoadingSido}
            aria-label="시도 선택"
          >
            <option value="">전체</option>
            {safeSidoList.length === 0 && !isLoadingSido && (
              <option value="" disabled>시도 목록을 불러올 수 없습니다</option>
            )}
            {safeSidoList.map((sido) => (
              <option key={sido.code} value={sido.code}>
                {sido.name}
              </option>
            ))}
          </select>
          {isLoadingSido && (
            <p className="text-xs text-gray-500 mt-1">시도 목록 로딩 중...</p>
          )}
        </div>

        {/* 시군구 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            시군구
          </label>
          <select
            value={selectedSigungu}
            onChange={(e) => setSelectedSigungu(e.target.value)}
            className="w-full touch-target rounded-control border border-gray-300 bg-surface px-4 py-3.5 transition-all focus:border-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-100"
            disabled={!selectedSido || isLoadingSigungu}
            aria-label="시군구 선택"
          >
            <option value="">
              {!selectedSido ? '시도를 먼저 선택하세요' : '전체'}
            </option>
            {selectedSido && safeSigunguList.length === 0 && !isLoadingSigungu && (
              <option value="" disabled>시군구 목록을 불러올 수 없습니다</option>
            )}
            {safeSigunguList.map((sigungu) => (
              <option key={sigungu.code} value={sigungu.code}>
                {sigungu.name}
              </option>
            ))}
          </select>
          {selectedSido && isLoadingSigungu && (
            <p className="text-xs text-gray-500 mt-1">시군구 목록 로딩 중...</p>
          )}
        </div>
      </div>
    </div>
  );
}
