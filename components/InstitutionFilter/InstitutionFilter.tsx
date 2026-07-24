'use client';

import type { MedicalInstitutionType } from '@/types';

const INSTITUTION_TYPES: MedicalInstitutionType[] = [
  '종합병원',
  '병원',
  '요양병원',
  '치과',
];

interface InstitutionFilterProps {
  selectedTypes: MedicalInstitutionType[];
  onChange: (types: MedicalInstitutionType[]) => void;
}

export function InstitutionFilter({
  selectedTypes,
  onChange,
}: InstitutionFilterProps) {
  const toggleType = (type: MedicalInstitutionType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink">의료기관 종별</legend>
      <p className="text-xs text-ink-muted">선택하지 않으면 종별 제한 없이 검색합니다.</p>
      <div className="flex flex-wrap gap-2 pt-1">
        {INSTITUTION_TYPES.map((type) => {
          const selected = selectedTypes.includes(type);
          return (
            <label
              key={type}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors touch-target ${
                selected
                  ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-sm ring-1 ring-brand-200'
                  : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:bg-surface-muted'
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleType(type)}
                className="sr-only"
                aria-label={`${type} ${selected ? '선택 해제' : '선택'}`}
              />
              <span className="font-medium">{type}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
