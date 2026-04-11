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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 animate-slide-up">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? '▲ 접기' : '▼ 펼치기'} ({selectedHospitals.length}
              /{maxSelection})
            </button>
            {isExpanded && (
              <div className="flex flex-wrap gap-2">
                {selectedHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    <span>{hospital.name}</span>
                    {onRemoveHospital && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveHospital(hospital.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold"
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
              className="px-3 py-2 text-sm text-primary-700 hover:text-primary-900 border border-primary-200 rounded-lg touch-target transition-colors"
              aria-label="비교 화면 공유 링크 복사"
            >
              {shareCopied ? '복사됨' : '링크 공유'}
            </button>
            <button
              onClick={onClear}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg touch-target transition-colors"
              aria-label="선택 초기화"
            >
              초기화
            </button>
            <Link
              href="/comparison"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium text-center touch-target transition-colors shadow-md hover:shadow-lg"
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

