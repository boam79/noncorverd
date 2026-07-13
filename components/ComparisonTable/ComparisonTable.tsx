'use client';

import { useEffect, useMemo, useState } from 'react';
import { MobileComparisonView } from './MobileComparisonView';
import type { HospitalPricing } from '@/types';
import type {
  ComparisonHospitalEntry,
  ComparisonItemEntry,
  QuantityByItemName,
} from './types';
import { COMPARISON_QUANTITIES_STORAGE_KEY } from './types';
import { computeHospitalDataTrust } from '@/lib/utils/trustScore';
import {
  calculateEstimatedTotalsByHospital,
  getItemQuantity,
} from '@/lib/utils/costEstimator';
import {
  DEFAULT_OUTLIER_THRESHOLD_PERCENT,
  detectOutliers,
  getTopOutliersByHospital,
} from '@/lib/utils/anomalyDetector';
import { comparisonItemKey } from '@/lib/opendata/mapPricingItem';

interface ComparisonTableProps {
  pricingData: HospitalPricing[];
}

type ViewMode = 'common' | 'all';
type SortMode = 'popularity' | 'priceDesc' | 'variance' | 'name';
type DensityMode = 'comfortable' | 'compact';

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
        displayName: string;
      }>
    >();

    pricingData.forEach((hospital) => {
      hospital.items.forEach((item) => {
        const key = comparisonItemKey(item);
        if (!map.has(key)) {
          map.set(key, []);
        }

        map.get(key)!.push({
          hospitalId: hospital.hospitalId,
          hospitalName: hospital.hospitalName,
          price: item.price,
          unit: item.unit,
          code: item.code,
          url: item.url,
          startDate: item.startDate,
          endDate: item.endDate,
          displayName: item.name,
        });
      });
    });

    return Array.from(map.entries()).map(([, entries]) => {
      const prices = entries.map((entry) => entry.price);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      const averagePrice =
        prices.length > 0
          ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length)
          : 0;

      const hospitalsRecord: Record<string, ComparisonHospitalEntry> = {};

      pricingData.forEach((hospital) => {
        // 동일 병원·동일 키에 여러 행이 있으면 첫 행만 사용(코드 키로 분리됨)
        const entry = entries.find((e) => e.hospitalId === hospital.hospitalId);
        if (entry) {
          const diff = entry.price - averagePrice;
          const percentDiff = averagePrice > 0 ? Math.round((diff / averagePrice) * 100) : 0;

          hospitalsRecord[hospital.hospitalId] = {
            hospitalId: entry.hospitalId,
            hospitalName: entry.hospitalName,
            price: entry.price,
            unit: entry.unit,
            code: entry.code,
            url: entry.url,
            startDate: entry.startDate,
            endDate: entry.endDate,
            diff,
            percentDiff,
            isHighest: entry.price === maxPrice,
            isLowest: entry.price === minPrice,
          };
        }
      });

      const exemplar = entries.find((entry) => entry.unit || entry.code || entry.url) ?? entries[0];
      const name = exemplar?.displayName ?? entries[0]?.displayName ?? '';
      const uniqueHospitalCount = new Set(entries.map((e) => e.hospitalId)).size;

      return {
        name,
        averagePrice,
        maxPrice,
        minPrice,
        hospitalCount: uniqueHospitalCount,
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

  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('popularity');
  const [densityMode, setDensityMode] = useState<DensityMode>('comfortable');
  const [pinnedItemNames, setPinnedItemNames] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);
  const [quantities, setQuantities] = useState<QuantityByItemName>({});

  const cellPad =
    densityMode === 'compact' ? 'px-2 py-1.5' : 'px-4 py-3';
  const headPad =
    densityMode === 'compact' ? 'px-2 py-2' : 'px-4 py-3';

  const trustByHospitalId = useMemo(() => {
    const map: Record<
      string,
      ReturnType<typeof computeHospitalDataTrust>
    > = {};
    pricingData.forEach((h) => {
      map[h.hospitalId] = computeHospitalDataTrust(h);
    });
    return map;
  }, [pricingData]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMPARISON_QUANTITIES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as QuantityByItemName;
      if (parsed && typeof parsed === 'object') {
        setQuantities(parsed);
      }
    } catch {
      // ignore corrupted localStorage values
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        COMPARISON_QUANTITIES_STORAGE_KEY,
        JSON.stringify(quantities)
      );
    } catch {
      // ignore storage write errors
    }
  }, [quantities]);

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

  const sortedWithPins = useMemo(() => {
    const pinSet = new Set(pinnedItemNames);
    const pinnedList = pinnedItemNames
      .map((name) => filteredItems.find((item) => item.name === name))
      .filter((item): item is ComparisonItemEntry => Boolean(item));
    const rest = filteredItems.filter((item) => !pinSet.has(item.name));
    return [...pinnedList, ...rest];
  }, [filteredItems, pinnedItemNames]);

  const visibleItems = sortedWithPins.slice(0, visibleCount);
  const hasMore = sortedWithPins.length > visibleCount;

  const togglePinItem = (name: string) => {
    setPinnedItemNames((prev) => {
      if (prev.includes(name)) {
        return prev.filter((n) => n !== name);
      }
      return [...prev, name];
    });
  };
  const estimatedTotalsByHospitalId = useMemo(
    () => calculateEstimatedTotalsByHospital(pricingData, quantities),
    [pricingData, quantities]
  );
  const outliers = useMemo(
    () => detectOutliers(aggregatedItems, DEFAULT_OUTLIER_THRESHOLD_PERCENT),
    [aggregatedItems]
  );
  const topOutliersByHospital = useMemo(
    () => getTopOutliersByHospital(outliers, 3),
    [outliers]
  );

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
            <button
              type="button"
              onClick={() =>
                setDensityMode((d) =>
                  d === 'comfortable' ? 'compact' : 'comfortable'
                )
              }
              className={`px-3 py-1.5 rounded-full text-sm border ${
                densityMode === 'compact'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
              aria-pressed={densityMode === 'compact'}
              aria-label="표 밀도 전환"
            >
              {densityMode === 'compact' ? '여유 보기' : '밀집 보기'}
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
        <div className="text-xs text-gray-500">
          평균 대비 {DEFAULT_OUTLIER_THRESHOLD_PERCENT}% 이상 높은 주의 항목 {outliers.length}건
          {pricingData.length > 0 && (
            <span>
              {' '}· 병원별 Top3 이상치 계산 완료 ({Object.keys(topOutliersByHospital).length}개 병원)
            </span>
          )}
        </div>
        {outliers.length > 0 && (
          <div
            className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800"
            title={`주의 항목 기준: 평균 대비 ${DEFAULT_OUTLIER_THRESHOLD_PERCENT}% 이상 높은 가격`}
          >
            <span className="font-semibold">주의 기준</span>
            <span>평균 대비 +{DEFAULT_OUTLIER_THRESHOLD_PERCENT}%</span>
          </div>
        )}
        {viewMode === 'common' && commonItemCount === 0 && totalUniqueItems > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            공통 항목이 없습니다. 병원별 개별 항목은 <span className="font-semibold">전체 항목</span> 탭에서 확인할 수 있습니다.
          </div>
        )}
      </div>

      {/* 모바일 뷰 */}
      <MobileComparisonView
        pricingData={pricingData}
        items={visibleItems}
        estimatedTotalsByHospitalId={estimatedTotalsByHospitalId}
        densityMode={densityMode}
        trustByHospitalId={trustByHospitalId}
      />

      {/* 데스크톱 뷰 */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 tabular-nums">
          <thead className="sticky top-0 z-10 border-b border-line bg-gray-50/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-gray-50/80">
            <tr>
              <th
                className={`${headPad} text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12`}
              >
                핀
              </th>
              <th
                className={`${headPad} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
              >
                항목
              </th>
              {pricingData.map((hospital) => (
                <th
                  key={hospital.hospitalId}
                  className={`${headPad} text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[170px]`}
                >
                  <div className="font-semibold text-gray-900">{hospital.hospitalName}</div>
                  {(() => {
                    const t = trustByHospitalId[hospital.hospitalId];
                    return t ? (
                      <div
                        className="mt-1 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700"
                        title={t.hints.join(' · ')}
                      >
                        데이터 신뢰도{' '}
                        <span className="font-semibold text-primary-700">
                          {t.score}점 ({t.label})
                        </span>
                      </div>
                    ) : null;
                  })()}
                  <div className="text-xs text-gray-500 mt-1">
                    항목 수: {hospital.items.length.toLocaleString()}개
                  </div>
                  <div className="text-xs text-primary-700 font-semibold mt-1">
                    예상 총비용: {(estimatedTotalsByHospitalId[hospital.hospitalId] ?? 0).toLocaleString()}원
                  </div>
                  {hospital.averagePrice && (
                    <div className="text-xs text-gray-400 mt-1">
                      평균: {hospital.averagePrice.toLocaleString()}원
                    </div>
                  )}
                </th>
              ))}
              <th
                className={`${headPad} text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]`}
              >
                평균가
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleItems.length === 0 && (
              <tr>
                <td
                  colSpan={pricingData.length + 3}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  조건에 맞는 비급여 항목이 없습니다. 검색어나 필터를 변경해보세요.
                </td>
              </tr>
            )}
            {visibleItems.length > 0 &&
              visibleItems.map((item, itemIndex) => {
              const dateLabel = formatDateRange(item.startDate, item.endDate);
              const quantityInputId = `quantity-${itemIndex}`;

              return (
                <tr key={item.name} className="hover:bg-gray-50 align-top">
                  <td className={`${cellPad} text-sm text-gray-500 align-middle`}>
                    <button
                      type="button"
                      onClick={() => togglePinItem(item.name)}
                      className={`rounded-md border px-2 py-1 text-xs font-medium touch-target ${
                        pinnedItemNames.includes(item.name)
                          ? 'border-amber-300 bg-amber-50 text-amber-900'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                      aria-pressed={pinnedItemNames.includes(item.name)}
                      aria-label={
                        pinnedItemNames.includes(item.name)
                          ? `${item.name} 핀 해제`
                          : `${item.name} 위로 핀`
                      }
                    >
                      {pinnedItemNames.includes(item.name) ? '★' : '☆'}
                    </button>
                  </td>
                  <td className={`${cellPad} text-sm text-gray-900`}>
                    <div className="font-medium">{item.name}</div>
                    <div className="mt-1 text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor={quantityInputId} className="text-gray-600">
                          횟수
                        </label>
                        <input
                          id={quantityInputId}
                          type="number"
                          min={0}
                          max={99}
                          value={getItemQuantity(quantities, item.name)}
                          onChange={(event) => {
                            const rawValue = Number(event.target.value);
                            const nextValue = Number.isFinite(rawValue)
                              ? Math.min(99, Math.max(0, Math.floor(rawValue)))
                              : 0;
                            setQuantities((prev) => ({
                              ...prev,
                              [item.name]: nextValue,
                            }));
                          }}
                          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
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
                          className={`${cellPad} text-sm text-gray-400 text-center`}
                        >
                          -
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${item.name}-${hospital.hospitalId}`}
                        className={`${cellPad} text-sm ${
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
                            {entry.percentDiff >= DEFAULT_OUTLIER_THRESHOLD_PERCENT && (
                              <span
                                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200"
                                title={`주의 항목: 평균 대비 +${entry.percentDiff}%`}
                              >
                                주의
                              </span>
                            )}
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
                  <td
                    className={`${cellPad} whitespace-nowrap text-sm font-medium text-gray-900`}
                  >
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
            더 보기 ({sortedWithPins.length - visibleCount}개 남음)
          </button>
        </div>
      )}
    </>
  );
}

