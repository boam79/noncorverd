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
      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
        {INSTITUTION_TYPES.map((type) => (
          <label
            key={type}
            className="inline-flex items-center gap-2 text-sm text-ink touch-target"
          >
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => toggleType(type)}
              className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
              aria-label={`${type} ${selectedTypes.includes(type) ? '선택 해제' : '선택'}`}
            />
            <span>{type}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
