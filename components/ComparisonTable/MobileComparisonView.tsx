'use client';

import { useState } from 'react';
import type { HospitalPricing, NonCoveredItem } from '@/types';

interface MobileComparisonViewProps {
  pricingData: HospitalPricing[];
}

export function MobileComparisonView({
  pricingData,
}: MobileComparisonViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (pricingData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        비교할 데이터가 없습니다.
      </div>
    );
  }

  // 모든 항목 수집
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

  const currentHospital = pricingData[currentIndex];
  const avgPrice = currentHospital.averagePrice || 0;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pricingData.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + pricingData.length) % pricingData.length);
  };

  return (
    <div className="md:hidden">
      {/* 병원 선택 인디케이터 */}
      <div className="flex items-center justify-between mb-4 px-4">
        <button
          onClick={goToPrev}
          className="touch-target flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          aria-label="이전 병원"
        >
          <span className="text-2xl">‹</span>
        </button>
        <div className="flex-1 text-center">
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {pricingData.length}
          </div>
          <div className="font-semibold text-gray-900">
            {currentHospital.hospitalName}
          </div>
          {avgPrice > 0 && (
            <div className="text-xs text-gray-400">
              평균: {avgPrice.toLocaleString()}원
            </div>
          )}
        </div>
        <button
          onClick={goToNext}
          className="touch-target flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          aria-label="다음 병원"
        >
          <span className="text-2xl">›</span>
        </button>
      </div>

      {/* 항목 리스트 */}
      <div className="space-y-2 px-4">
        {itemNames.map((itemName) => {
          const item = currentHospital.items.find((i) => i.name === itemName);
          if (!item) return null;

          const allItemPrices = allItems.get(itemName)!;
          const maxPrice = Math.max(...allItemPrices.map((i) => i.price));
          const minPrice = Math.min(...allItemPrices.map((i) => i.price));
          const avgItemPrice = calculateAverage(allItemPrices);
          const isHighest = item.price === maxPrice;
          const isLowest = item.price === minPrice;
          const diff = item.price - avgItemPrice;
          const percentDiff =
            avgItemPrice > 0 ? Math.round((diff / avgItemPrice) * 100) : 0;

          return (
            <div
              key={itemName}
              className="bg-white border border-gray-200 rounded-lg p-4 animate-fade-in"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 flex-1">
                  {itemName}
                </h3>
                <div
                  className={`text-right ${
                    isHighest
                      ? 'text-error-600 font-semibold'
                      : isLowest
                      ? 'text-primary-600 font-semibold'
                      : 'text-gray-900'
                  }`}
                >
                  <div className="text-lg">
                    {item.price.toLocaleString()}원
                  </div>
                  {diff !== 0 && (
                    <div
                      className={`text-xs flex items-center justify-end gap-1 ${
                        diff > 0 ? 'text-error-500' : 'text-primary-500'
                      }`}
                    >
                      {diff > 0 ? '▲' : '▼'} {Math.abs(percentDiff)}%
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                평균: {avgItemPrice.toLocaleString()}원 (최저: {minPrice.toLocaleString()}원, 최고: {maxPrice.toLocaleString()}원)
              </div>
            </div>
          );
        })}
      </div>

      {/* 페이지 인디케이터 */}
      <div className="flex justify-center gap-2 mt-6">
        {pricingData.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-primary-600'
                : 'w-2 bg-gray-300'
            }`}
            aria-label={`병원 ${index + 1}로 이동`}
          />
        ))}
      </div>
    </div>
  );
}

