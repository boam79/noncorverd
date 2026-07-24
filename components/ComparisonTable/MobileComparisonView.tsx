'use client';

import { useRef, useState } from 'react';
import type { HospitalPricing } from '@/types';
import type { ComparisonItemEntry } from './types';
import type { TrustScoreResult } from '@/lib/utils/trustScore';

interface MobileComparisonViewProps {
  pricingData: HospitalPricing[];
  items: ComparisonItemEntry[];
  estimatedTotalsByHospitalId: Record<string, number>;
  densityMode?: 'comfortable' | 'compact';
  trustByHospitalId?: Record<string, TrustScoreResult>;
}

export function MobileComparisonView({
  pricingData,
  items,
  estimatedTotalsByHospitalId,
  densityMode = 'comfortable',
  trustByHospitalId,
}: MobileComparisonViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const cardPad = densityMode === 'compact' ? 'p-3' : 'p-4';
  const titleClass =
    densityMode === 'compact' ? 'text-sm font-medium' : 'font-medium';

  if (pricingData.length === 0 || items.length === 0) {
    return (
      <div className="py-8 text-center text-ink-soft">
        비교할 데이터가 없습니다.
      </div>
    );
  }

  const currentHospital = pricingData[currentIndex];
  const avgPrice = currentHospital.averagePrice || 0;
  const estimatedTotal = estimatedTotalsByHospitalId[currentHospital.hospitalId] ?? 0;
  const trust = trustByHospitalId?.[currentHospital.hospitalId];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pricingData.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + pricingData.length) % pricingData.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) goToNext();
    else goToPrev();
  };

  return (
    <div
      className="tabular-nums md:hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 병원 탭 스위처 */}
      <div className="mb-4 flex gap-2 overflow-x-auto px-1 pb-1 custom-scrollbar swipeable">
        {pricingData.map((hospital, index) => {
          const active = index === currentIndex;
          return (
            <button
              key={hospital.hospitalId}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`swipeable-item shrink-0 rounded-full border px-3.5 py-2 text-sm transition-colors touch-target ${
                active
                  ? 'border-brand-500 bg-brand-50 font-semibold text-brand-900 ring-1 ring-brand-200'
                  : 'border-line bg-surface text-ink-muted hover:bg-surface-muted'
              }`}
              aria-pressed={active}
              aria-label={`${hospital.hospitalName} 보기`}
            >
              {hospital.hospitalName}
            </button>
          );
        })}
      </div>

      {/* 현재 병원 요약 카드 */}
      <div className="mx-1 mb-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-ink-soft">
              {currentIndex + 1} / {pricingData.length} · 좌우로 밀어 병원 전환
            </div>
            <div className="mt-1 truncate font-semibold text-ink">
              {currentHospital.hospitalName}
            </div>
            {avgPrice > 0 && (
              <div className="mt-1 text-xs text-ink-soft">
                평균: {avgPrice.toLocaleString()}원
              </div>
            )}
            <div className="mt-1 text-xs font-semibold text-brand-700">
              예상 총비용: {estimatedTotal.toLocaleString()}원
            </div>
            {trust && (
              <div
                className="mt-1 text-[11px] text-ink-muted"
                title={trust.hints.join(' · ')}
              >
                데이터 신뢰도{' '}
                <span className="font-semibold text-brand-700">
                  {trust.score}점 ({trust.label})
                </span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={goToPrev}
              className="touch-target flex items-center justify-center rounded-control border border-line bg-surface hover:bg-surface-muted"
              aria-label="이전 병원"
            >
              <span className="text-xl text-ink-muted">‹</span>
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="touch-target flex items-center justify-center rounded-control border border-line bg-surface hover:bg-surface-muted"
              aria-label="다음 병원"
            >
              <span className="text-xl text-ink-muted">›</span>
            </button>
          </div>
        </div>
      </div>

      {/* 항목 리스트 */}
      <div className="space-y-2 px-1">
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
              key={`${item.itemKey}-${currentHospital.hospitalId}`}
              className={`rounded-2xl border border-line bg-surface ${cardPad} animate-fade-in shadow-sm`}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`${titleClass} text-ink`}>{item.name}</h3>
                    {isLowest && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                        최저
                      </span>
                    )}
                    {isHighest && (
                      <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-semibold text-warning-800">
                        최고
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1 text-xs text-ink-soft">
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
                          className="text-brand-700 underline"
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
                      ? 'font-semibold text-error-600'
                      : isLowest
                      ? 'font-semibold text-brand-700'
                      : 'text-ink'
                  }`}
                >
                  <div className="text-lg">
                    {hospitalEntry.price.toLocaleString()}원
                  </div>
                  {diff !== 0 && (
                    <div
                      className={`flex items-center justify-end gap-1 text-xs ${
                        diff > 0 ? 'text-error-500' : 'text-brand-600'
                      }`}
                    >
                      {diff > 0 ? '▲' : '▼'} {Math.abs(percentDiff)}%
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-ink-soft">
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
      <div className="mt-6 flex justify-center gap-2">
        {pricingData.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-brand-600'
                : 'w-2 bg-line-strong'
            }`}
            aria-label={`병원 ${index + 1}로 이동`}
          />
        ))}
      </div>
    </div>
  );
}
