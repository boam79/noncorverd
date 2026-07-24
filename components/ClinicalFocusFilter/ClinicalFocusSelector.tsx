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
        <span id="clinical-focus-label" className="text-sm font-medium text-ink">
          관심 분야 (선택)
        </span>
        <p className="text-xs leading-relaxed text-ink-soft">
          병원명·기관 종별·공공데이터 진료과목 코드를 조합한 추정 필터입니다. 행정
          구분과 다를 수 있습니다.
        </p>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="clinical-focus-label"
        className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar swipeable"
      >
        {CLINICAL_FOCUS_OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <label
              key={opt.id}
              title={opt.id === 'none' ? opt.label : opt.description}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors touch-target ${
                selected
                  ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-sm ring-1 ring-brand-200'
                  : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:bg-surface-muted'
              }`}
            >
              <input
                type="radio"
                name="clinical-focus"
                value={opt.id}
                checked={selected}
                onChange={() => onChange(opt.id)}
                className="sr-only"
                aria-label={opt.label}
              />
              <span className="whitespace-nowrap font-medium">{opt.label}</span>
            </label>
          );
        })}
      </div>
      {value !== 'none' && (
        <p className="text-xs text-ink-soft" role="status">
          {CLINICAL_FOCUS_OPTIONS.find((o) => o.id === value)?.description}
        </p>
      )}
    </div>
  );
}
