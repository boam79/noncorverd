'use client';

import { MobileComparisonView } from './MobileComparisonView';
import type { HospitalPricing, NonCoveredItem } from '@/types';

interface ComparisonTableProps {
  pricingData: HospitalPricing[];
}

export function ComparisonTable({ pricingData }: ComparisonTableProps) {
  if (pricingData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        비교할 데이터가 없습니다.
      </div>
    );
  }

  // 모든 항목 수집 및 정렬
  const allItems = new Map<string, NonCoveredItem[]>();
  pricingData.forEach((hospital) => {
    hospital.items.forEach((item) => {
      if (!allItems.has(item.name)) {
        allItems.set(item.name, []);
      }
      allItems.get(item.name)!.push(item);
    });
  });

  const itemNames = Array.from(allItems.keys()).sort();

  // 평균가 계산
  const calculateAverage = (items: NonCoveredItem[]) => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + item.price, 0);
    return Math.round(sum / items.length);
  };

  // 가격 차이 계산 (최고가 대비)
  const getPriceDifference = (
    price: number,
    items: NonCoveredItem[]
  ): {
    diff: number;
    percentDiff: number;
    isHighest: boolean;
    isLowest: boolean;
  } => {
    if (items.length === 0) {
      return { diff: 0, percentDiff: 0, isHighest: false, isLowest: false };
    }
    const maxPrice = Math.max(...items.map((i) => i.price));
    const minPrice = Math.min(...items.map((i) => i.price));
    const avgPrice = calculateAverage(items);
    const diff = price - avgPrice;
    const percentDiff = avgPrice > 0 ? Math.round((diff / avgPrice) * 100) : 0;
    return {
      diff,
      percentDiff,
      isHighest: price === maxPrice,
      isLowest: price === minPrice,
    };
  };

  return (
    <>
      {/* 모바일 뷰 */}
      <MobileComparisonView pricingData={pricingData} />

      {/* 데스크톱 뷰 */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              항목
            </th>
            {pricingData.map((hospital) => (
              <th
                key={hospital.hospitalId}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]"
              >
                <div className="font-semibold">{hospital.hospitalName}</div>
                {hospital.averagePrice && (
                  <div className="text-xs text-gray-400 mt-1">
                    평균: {hospital.averagePrice.toLocaleString()}원
                  </div>
                )}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              평균가
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {itemNames.map((itemName) => {
            const items = allItems.get(itemName)!;
            const avgPrice = calculateAverage(items);

            return (
              <tr key={itemName} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {itemName}
                </td>
                {pricingData.map((hospital) => {
                  const item = hospital.items.find((i) => i.name === itemName);
                  if (!item) {
                    return (
                      <td
                        key={hospital.hospitalId}
                        className="px-4 py-3 whitespace-nowrap text-sm text-gray-400"
                      >
                        -
                      </td>
                    );
                  }

                  const { diff, percentDiff, isHighest, isLowest } =
                    getPriceDifference(item.price, items);

                  return (
                    <td
                      key={hospital.hospitalId}
                      className={`px-4 py-3 whitespace-nowrap text-sm ${
                        isHighest
                          ? 'text-red-600 font-semibold'
                          : isLowest
                          ? 'text-blue-600 font-semibold'
                          : 'text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{item.price.toLocaleString()}원</span>
                        {diff !== 0 && (
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              diff > 0
                                ? 'text-red-700 bg-red-50'
                                : 'text-blue-700 bg-blue-50'
                            }`}
                            title={`평균 대비 ${diff > 0 ? '+' : ''}${diff.toLocaleString()}원 (${diff > 0 ? '+' : ''}${percentDiff}%)`}
                          >
                            {diff > 0 ? '▲' : '▼'} {Math.abs(percentDiff)}%
                          </span>
                        )}
                        {isHighest && (
                          <span className="text-xs text-red-600 font-semibold" title="최고가">
                            최고
                          </span>
                        )}
                        {isLowest && (
                          <span className="text-xs text-blue-600 font-semibold" title="최저가">
                            최저
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {avgPrice.toLocaleString()}원
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}

