'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Hospital } from '@/types';

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

