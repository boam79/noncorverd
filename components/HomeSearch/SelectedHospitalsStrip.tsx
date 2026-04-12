'use client';

import type { Hospital } from '@/types';
import { scrollToHomeSection } from '@/lib/home/homeSearchSectionIds';

export interface SelectedHospitalsStripProps {
  hospitals: Hospital[];
  maxSelection: number;
  onRemove: (hospital: Hospital) => void;
}

/**
 * 본문용 컴팩트 선택 요약(상세·비교 액션은 하단 CompareBar 위주).
 */
export function SelectedHospitalsStrip({
  hospitals,
  maxSelection,
  onRemove,
}: SelectedHospitalsStripProps) {
  if (hospitals.length === 0) return null;

  const goCompare = () => {
    scrollToHomeSection('compareBar');
  };

  return (
    <div className="rounded-card border border-primary-200 bg-gradient-to-b from-primary-50/80 to-surface px-4 py-3 shadow-sm md:px-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-primary-950">
          선택된 의료기관{' '}
          <span className="font-bold text-primary-800">
            {hospitals.length}/{maxSelection}
          </span>
        </p>
        <button
          type="button"
          onClick={goCompare}
          className="text-xs font-semibold text-primary-800 underline decoration-primary-400 underline-offset-2 hover:text-primary-950"
        >
          하단 비교 바로 이동
        </button>
      </div>
      <p className="mb-2 text-xs text-gray-600">
        이름 옆 체크를 바꾸거나, 아래 비교 바에서 제거·비교하기를 진행할 수 있어요.
      </p>
      <ul className="flex flex-wrap gap-2" aria-label="선택된 의료기관">
        {hospitals.map((hospital) => (
          <li key={hospital.id}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-surface px-3 py-1.5 text-sm text-gray-900 shadow-sm">
              <span className="max-w-[14rem] truncate">{hospital.name}</span>
              <button
                type="button"
                onClick={() => onRemove(hospital)}
                className="shrink-0 rounded p-0.5 text-lg font-bold leading-none text-red-600 hover:bg-red-50 hover:text-red-800"
                aria-label={`${hospital.name} 선택 해제`}
              >
                ×
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
