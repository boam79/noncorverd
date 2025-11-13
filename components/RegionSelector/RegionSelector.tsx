'use client';

import { useState, useEffect } from 'react';
import { useRegions } from '@/lib/hooks/useRegions';

interface RegionSelectorProps {
  onRegionChange: (sido?: string, sigungu?: string) => void;
}

export function RegionSelector({ onRegionChange }: RegionSelectorProps) {
  const [selectedSido, setSelectedSido] = useState<string>('');
  const [selectedSigungu, setSelectedSigungu] = useState<string>('');

  const { data: sidoList, isLoading: isLoadingSido, error: sidoError } = useRegions();
  const { data: sigunguList, isLoading: isLoadingSigungu, error: sigunguError } = useRegions(selectedSido);
  
  // 배열이 아닌 경우 빈 배열로 처리
  const safeSidoList = Array.isArray(sidoList) ? sidoList : [];
  const safeSigunguList = Array.isArray(sigunguList) ? sigunguList : [];

  useEffect(() => {
    if (selectedSido) {
      setSelectedSigungu('');
      onRegionChange(selectedSido, undefined);
    } else {
      onRegionChange(undefined, undefined);
    }
  }, [selectedSido, onRegionChange]);

  useEffect(() => {
    if (selectedSido && selectedSigungu) {
      onRegionChange(selectedSido, selectedSigungu);
    }
  }, [selectedSido, selectedSigungu, onRegionChange]);

  const loading = isLoadingSido || isLoadingSigungu;

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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시도
          </label>
          <select
            value={selectedSido}
            onChange={(e) => setSelectedSido(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 touch-target transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={loading}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시군구
          </label>
          <select
            value={selectedSigungu}
            onChange={(e) => setSelectedSigungu(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed touch-target transition-all"
            disabled={!selectedSido || loading}
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
