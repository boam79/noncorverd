'use client';

import { useEffect, useMemo, useState } from 'react';
import { MobileComparisonView } from './MobileComparisonView';
import type { HospitalPricing } from '@/types';
import type { ComparisonHospitalEntry, ComparisonItemEntry } from './types';

interface ComparisonTableProps {
  pricingData: HospitalPricing[];
}

type ViewMode = 'common' | 'all';
type SortMode = 'popularity' | 'priceDesc' | 'variance' | 'name';

export function ComparisonTable({ pricingData }: ComparisonTableProps) {
  const aggregatedItems = useMemo<ComparisonItemEntry[]>(() => {
    const map = new Map<
      string,
      Array<{
        hospitalId: string;
        hospitalName: string;
        price: number;
        unit?: string;
        code?: string;
        url?: string;
        startDate?: string;
        endDate?: string;
      }>
    >();

    pricingData.forEach((hospital) => {
      hospital.items.forEach((item) => {
        if (!map.has(item.name)) {
          map.set(item.name, []);
        }

        map.get(item.name)!.push({
          hospitalId: hospital.hospitalId,
          hospitalName: hospital.hospitalName,
          price: item.price,
          unit: item.unit,
          code: item.code,
          url: item.url,
          startDate: item.startDate,
          endDate: item.endDate,
        });
      });
    });

    return Array.from(map.entries()).map(([name, entries]) => {
      const prices = entries.map((entry) => entry.price);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      const averagePrice =
        prices.length > 0
          ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length)
          : 0;

      // 모든 병원에 대한 레코드 초기화 (공통 항목일 경우 모든 병원이 있어야 함)
      const hospitalsRecord: Record<string, ComparisonHospitalEntry> = {};

      // 실제 데이터가 있는 병원만 entries에 있으므로, 모든 pricingData의 병원을 확인
      pricingData.forEach((hospital) => {
        const entry = entries.find((e) => e.hospitalId === hospital.hospitalId);
        if (entry) {
          const diff = entry.price - averagePrice;
          const percentDiff = averagePrice > 0 ? Math.round((diff / averagePrice) * 100) : 0;

          hospitalsRecord[hospital.hospitalId] = {
            ...entry,
            diff,
            percentDiff,
            isHighest: entry.price === maxPrice,
            isLowest: entry.price === minPrice,
          };
        }
      });

      const exemplar = entries.find((entry) => entry.unit || entry.code || entry.url) ?? entries[0];

      return {
        name,
        averagePrice,
        maxPrice,
        minPrice,
        hospitalCount: entries.length,
        unit: exemplar?.unit,
        code: exemplar?.code,
        url: exemplar?.url,
        startDate: exemplar?.startDate,
        endDate: exemplar?.endDate,
        hospitals: hospitalsRecord,
      };
    });
  }, [pricingData]);

  const totalUniqueItems = aggregatedItems.length;
  const commonItemCount = useMemo(
    () => aggregatedItems.filter((item) => {
      // 모든 병원이 해당 항목을 가지고 있어야 함
      return item.hospitalCount === pricingData.length && 
             pricingData.every((hospital) => item.hospitals[hospital.hospitalId] !== undefined);
    }).length,
    [aggregatedItems, pricingData]
  );

  const [viewMode, setViewMode] = useState<ViewMode>('common');
  const [sortMode, setSortMode] = useState<SortMode>('popularity');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    setVisibleCount(30);
  }, [viewMode, sortMode, searchTerm]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    let items = aggregatedItems;

    // 공통 항목 필터: 모든 병원이 해당 항목을 가지고 있어야 함
    if (viewMode === 'common' && pricingData.length > 0) {
      items = items.filter((item) => {
        // hospitalCount가 pricingData.length와 같고, 모든 병원의 hospitals 레코드에 항목이 있어야 함
        const hasAllHospitals = pricingData.every((hospital) => 
          item.hospitals[hospital.hospitalId] !== undefined
        );
        return item.hospitalCount === pricingData.length && hasAllHospitals;
      });
    }

    if (query) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.code && item.code.toLowerCase().includes(query))
      );
    }

    const sorted = [...items];

    sorted.sort((a, b) => {
      switch (sortMode) {
        case 'priceDesc':
          return b.averagePrice - a.averagePrice || a.name.localeCompare(b.name, 'ko');
        case 'variance': {
          const varianceA = a.maxPrice - a.minPrice;
          const varianceB = b.maxPrice - b.minPrice;
          return varianceB - varianceA || b.hospitalCount - a.hospitalCount || a.name.localeCompare(b.name, 'ko');
        }
        case 'name':
          return a.name.localeCompare(b.name, 'ko');
        case 'popularity':
        default: {
          if (b.hospitalCount !== a.hospitalCount) {
            return b.hospitalCount - a.hospitalCount;
          }
          const varianceA = a.maxPrice - a.minPrice;
          const varianceB = b.maxPrice - b.minPrice;
          if (varianceB !== varianceA) {
            return varianceB - varianceA;
          }
          return a.name.localeCompare(b.name, 'ko');
        }
      }
    });

    return sorted;
  }, [aggregatedItems, pricingData, viewMode, sortMode, searchTerm]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) {
      return undefined;
    }
    const endLabel =
      !end || end === '9999-12-31' || end === '9999-12-31T00:00:00'
        ? '현재'
        : end;
    return `${start ?? '미상'} ~ ${endLabel}`;
  };

  return (
    <>
      <div className="space-y-4 md:space-y-3 mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setViewMode('common')}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                viewMode === 'common'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              공통 항목 ({commonItemCount})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                viewMode === 'all'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              전체 항목 ({totalUniqueItems})
            </button>
          </div>
          <div className="flex flex-wrap gap-2 md:items-center">
            <label className="text-sm text-gray-600" htmlFor="pricing-sort">
              정렬
            </label>
            <select
              id="pricing-sort"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="popularity">공통도 순</option>
              <option value="priceDesc">평균가 높은 순</option>
              <option value="variance">가격 차이 큰 순</option>
              <option value="name">가나다순</option>
            </select>
            <div className="relative">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="항목명 또는 코드 검색"
                className="pl-3 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          총 {totalUniqueItems}개 항목 중{' '}
          <span className="font-semibold text-gray-700">{filteredItems.length}</span>개
          를 표시 중입니다. 현재 선택된 병원 수: {pricingData.length}곳.
        </div>
      </div>

      {/* 모바일 뷰 */}
      <MobileComparisonView pricingData={pricingData} items={visibleItems} />

      {/* 데스크톱 뷰 */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                항목
              </th>
              {pricingData.map((hospital) => (
                <th
                  key={hospital.hospitalId}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[170px]"
                >
                  <div className="font-semibold text-gray-900">{hospital.hospitalName}</div>
                  {hospital.averagePrice && (
                    <div className="text-xs text-gray-400 mt-1">
                      평균: {hospital.averagePrice.toLocaleString()}원
                    </div>
                  )}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                평균가
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleItems.length === 0 && (
              <tr>
                <td
                  colSpan={pricingData.length + 2}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  조건에 맞는 비급여 항목이 없습니다. 검색어나 필터를 변경해보세요.
                </td>
              </tr>
            )}
            {visibleItems.length > 0 &&
              visibleItems.map((item) => {
              const dateLabel = formatDateRange(item.startDate, item.endDate);

              return (
                <tr key={item.name} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{item.name}</div>
                    <div className="mt-1 text-xs text-gray-500 space-y-1">
                      <div>
                        평균 {item.averagePrice.toLocaleString()}원 · 비교 병원{' '}
                        {item.hospitalCount}곳
                      </div>
                      <div>
                        범위 {item.minPrice.toLocaleString()}원 ~ {item.maxPrice.toLocaleString()}원
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.unit && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">단위 {item.unit}</span>}
                        {item.code && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">코드 {item.code}</span>}
                        {dateLabel && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            적용 {dateLabel}
                          </span>
                        )}
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 underline"
                        >
                          상세보기
                          <span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </div>
                  </td>
                  {pricingData.map((hospital) => {
                    const entry = item.hospitals[hospital.hospitalId];

                    if (!entry) {
                      return (
                        <td
                          key={`${item.name}-${hospital.hospitalId}`}
                          className="px-4 py-3 text-sm text-gray-400 text-center"
                        >
                          -
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${item.name}-${hospital.hospitalId}`}
                        className={`px-4 py-3 text-sm ${
                          entry.isHighest
                            ? 'text-red-600 font-semibold'
                            : entry.isLowest
                            ? 'text-blue-600 font-semibold'
                            : 'text-gray-900'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">
                              {entry.price.toLocaleString()}원
                            </span>
                            {entry.diff !== 0 && (
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                  entry.diff > 0
                                    ? 'text-red-700 bg-red-50'
                                    : 'text-blue-700 bg-blue-50'
                                }`}
                                title={`평균 대비 ${entry.diff > 0 ? '+' : ''}${entry.diff.toLocaleString()}원 (${entry.diff > 0 ? '+' : ''}${entry.percentDiff}%)`}
                              >
                                {entry.diff > 0 ? '▲' : '▼'} {Math.abs(entry.percentDiff)}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {entry.isHighest && <span className="font-semibold text-red-600">최고</span>}
                            {entry.isLowest && <span className="font-semibold text-blue-600">최저</span>}
                            {entry.unit && <span>{entry.unit} 기준</span>}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.averagePrice.toLocaleString()}원
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 30)}
            className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
          >
            더 보기 ({filteredItems.length - visibleCount}개 남음)
          </button>
        </div>
      )}
    </>
  );
}

