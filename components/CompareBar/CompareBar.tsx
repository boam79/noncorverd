'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Hospital } from '@/types';
import { encodeSharePayload, SHARE_PARAM } from '@/lib/utils/shareLink';
import { COMPARISON_QUANTITIES_STORAGE_KEY } from '@/components/ComparisonTable/types';

interface CompareBarProps {
  selectedHospitals: Hospital[];
  onCompare: () => void;
  onClear: () => void;
  onRemoveHospital?: (hospitalId: string) => void;
  maxSelection: number;
}

export function CompareBar({
  selectedHospitals,
  onCompare,
  onClear,
  onRemoveHospital,
  maxSelection,
}: CompareBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handleCopyShareLink = async () => {
    if (typeof window === 'undefined' || selectedHospitals.length === 0) return;
    const ids = selectedHospitals.map((h) => h.id);
    let q: Record<string, number> | undefined;
    try {
      const raw = window.localStorage.getItem(COMPARISON_QUANTITIES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
          const qmap: Record<string, number> = {};
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
              qmap[k] = Math.min(99, Math.max(0, Math.floor(v)));
            }
          }
          const keys = Object.keys(qmap);
          if (keys.length > 0) {
            keys.sort();
            q = keys.slice(0, 50).reduce<Record<string, number>>((acc, key) => {
              acc[key] = qmap[key];
              return acc;
            }, {});
          }
        }
      }
    } catch {
      // ignore
    }
    const payload = {
      v: 1 as const,
      i: ids,
      ...(q && Object.keys(q).length > 0 ? { q } : {}),
    };
    const url = `${window.location.origin}/comparison?${SHARE_PARAM}=${encodeSharePayload(payload)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2200);
    } catch {
      window.prompt('아래 링크를 복사해 주세요.', url);
    }
  };

  if (selectedHospitals.length === 0) {
    return null;
  }

  return (
    <div
      id="compare-bar"
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up border-t border-line bg-surface-glass backdrop-blur-md"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-4">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-ink-muted hover:text-ink"
            >
              {isExpanded ? '접기' : '펼치기'} ({selectedHospitals.length}/{maxSelection})
            </button>
            {isExpanded && (
              <div className="flex flex-wrap gap-2">
                {selectedHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className="flex items-center gap-2 rounded-control border border-brand-200 bg-brand-50 px-3 py-1 text-sm text-brand-900"
                  >
                    <span>{hospital.name}</span>
                    {onRemoveHospital && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveHospital(hospital.id);
                        }}
                        className="font-bold text-brand-700 hover:text-brand-900"
                        aria-label={`${hospital.name} 선택 해제`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="touch-target rounded-control border border-brand-200 px-3 py-2 text-sm text-brand-800 transition-colors hover:bg-brand-50"
              aria-label="비교 화면 공유 링크 복사"
            >
              {shareCopied ? '복사됨' : '링크 공유'}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="touch-target rounded-control border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
              aria-label="선택 초기화"
            >
              초기화
            </button>
            <Link
              href="/comparison"
              className="touch-target rounded-control bg-brand-700 px-6 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-brand-800"
              aria-label="병원 비교하기"
            >
              비교하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

