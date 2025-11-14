'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRegions } from '@/lib/hooks/useRegions';
import { apiClient } from '@/lib/api';
import type { Region } from '@/types';

interface RegionSelectorProps {
  onRegionChange: (sido?: string, sigungu?: string) => void;
}

export function RegionSelector({ onRegionChange }: RegionSelectorProps) {
  const [selectedSido, setSelectedSido] = useState<string>('');
  const [selectedSigungu, setSelectedSigungu] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: sidoList, isLoading: isLoadingSido, error: sidoError } = useRegions();
  const { data: sigunguList, isLoading: isLoadingSigungu, error: sigunguError } = useRegions(selectedSido);
  
  // 배열이 아닌 경우 빈 배열로 처리 (useMemo로 최적화)
  const safeSidoList = useMemo(() => (Array.isArray(sidoList) ? sidoList : []), [sidoList]);
  const safeSigunguList = useMemo(() => (Array.isArray(sigunguList) ? sigunguList : []), [sigunguList]);

  // 시군구 프리패치 함수
  const prefetchSigungu = useCallback(async (sidoCode: string) => {
    const queryKey = ['regions', sidoCode];
    
    // 이미 캐시에 있고 fresh한 데이터가 있으면 스킵
    const cached = queryClient.getQueryState(queryKey);
    if (cached?.data && cached?.dataUpdatedAt && Date.now() - cached.dataUpdatedAt < 24 * 60 * 60 * 1000) {
      return;
    }

    // 백그라운드에서 프리패치
    queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const response = await apiClient.getRegions(sidoCode);
        if (response.ok && response.data) {
          const data = response.data;
          if (Array.isArray(data)) {
            return data as Region[];
          }
          if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
            return (data as { data: Region[] }).data;
          }
          throw new Error('지역 정보 형식이 올바르지 않습니다.');
        }
        throw new Error(response.error?.message || '지역 정보를 불러오는데 실패했습니다.');
      },
      staleTime: 24 * 60 * 60 * 1000, // 24시간
    });
  }, [queryClient]);

  // 시도 목록이 로드되면 주요 시도들의 시군구를 프리패치
  useEffect(() => {
    if (safeSidoList.length > 0) {
      // 주요 시도들(서울, 경기, 부산 등)의 시군구를 미리 로드
      const majorSidos = ['11', '41', '26', '27', '28']; // 서울, 경기, 부산, 대구, 인천
      majorSidos.forEach((code) => {
        prefetchSigungu(code);
      });
    }
  }, [safeSidoList, prefetchSigungu]);

  // 시도 변경 시 시군구 초기화
  useEffect(() => {
    if (selectedSido) {
      // 시도 변경 시 시군구 초기화
      setSelectedSigungu('');
      // 선택된 시도의 시군구를 프리패치 (이미 로드 중이면 스킵)
      prefetchSigungu(selectedSido);
    }
  }, [selectedSido, prefetchSigungu]);

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
