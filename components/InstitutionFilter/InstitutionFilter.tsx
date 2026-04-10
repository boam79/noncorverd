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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        의료기관 종별
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {INSTITUTION_TYPES.map((type) => (
          <label
            key={type}
            className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors touch-target min-h-[48px]"
          >
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => toggleType(type)}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 transition-all"
              aria-label={`${type} ${selectedTypes.includes(type) ? '선택 해제' : '선택'}`}
            />
            <span className="text-sm text-gray-700 font-medium">{type}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

