'use client';

import {
  CLINICAL_FOCUS_OPTIONS,
  type ClinicalFocusId,
} from '@/lib/constants/clinicalFocusBuckets';

interface ClinicalFocusSelectorProps {
  value: ClinicalFocusId;
  onChange: (id: ClinicalFocusId) => void;
}

export function ClinicalFocusSelector({
  value,
  onChange,
}: ClinicalFocusSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-0.5">
        <span id="clinical-focus-label" className="text-sm font-medium text-gray-800">
          관심 분야 (선택)
        </span>
        <p className="text-xs text-gray-500 leading-relaxed">
          병원명·기관 종별·공공데이터 진료과목 코드를 조합한 추정 필터입니다. 행정
          구분과 다를 수 있습니다.
        </p>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="clinical-focus-label"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
      >
        {CLINICAL_FOCUS_OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors touch-target min-h-[48px] sm:min-w-[140px] ${
              value === opt.id
                ? 'border-primary-400 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="clinical-focus"
              value={opt.id}
              checked={value === opt.id}
              onChange={() => onChange(opt.id)}
              className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 border-gray-300 focus:ring-primary-500"
              aria-label={opt.label}
            />
            <span>
              <span className="font-medium text-gray-900">{opt.label}</span>
              {opt.id !== 'none' && (
                <span className="mt-0.5 block text-xs font-normal text-gray-500">
                  {opt.description}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
