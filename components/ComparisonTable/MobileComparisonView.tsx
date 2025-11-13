'use client';

import { useState } from 'react';
import type { HospitalPricing } from '@/types';
import type { ComparisonItemEntry } from './types';

interface MobileComparisonViewProps {
  pricingData: HospitalPricing[];
  items: ComparisonItemEntry[];
}

export function MobileComparisonView({
  pricingData,
  items,
}: MobileComparisonViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (pricingData.length === 0 || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        비교할 데이터가 없습니다.
      </div>
    );
  }

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
        {items.map((item) => {
          const hospitalEntry = item.hospitals[currentHospital.hospitalId];
          if (!hospitalEntry) {
            return null;
          }

          const diff = hospitalEntry.diff;
          const percentDiff = hospitalEntry.percentDiff;
          const isHighest = hospitalEntry.isHighest;
          const isLowest = hospitalEntry.isLowest;

          return (
            <div
              key={`${item.name}-${currentHospital.hospitalId}`}
              className="bg-white border border-gray-200 rounded-lg p-4 animate-fade-in"
            >
              <div className="flex items-start justify-between mb-2 gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  <div className="mt-1 text-xs text-gray-500 space-y-1">
                    {item.unit && <div>{item.unit} 기준</div>}
                    {item.code && <div>코드: {item.code}</div>}
                    {item.startDate && (
                      <div>
                        적용: {item.startDate}
                        {item.endDate
                          ? item.endDate === '9999-12-31'
                            ? ' ~ 현재'
                            : ` ~ ${item.endDate}`
                          : ''}
                      </div>
                    )}
                    {item.url && (
                      <div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-600 underline"
                        >
                          상세보기
                        </a>
                      </div>
                    )}
                  </div>
                </div>
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
                    {hospitalEntry.price.toLocaleString()}원
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
                평균: {item.averagePrice.toLocaleString()}원 (최저:{' '}
                {item.minPrice.toLocaleString()}원, 최고:{' '}
                {item.maxPrice.toLocaleString()}원) · 비교 병원 {item.hospitalCount}
                곳
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

