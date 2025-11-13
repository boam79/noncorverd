'use client';

import type { Hospital } from '@/types';

interface HospitalCardProps {
  hospital: Hospital;
  isSelected: boolean;
  onToggle: (hospital: Hospital) => void;
  maxSelectionReached: boolean;
}

export function HospitalCard({
  hospital,
  isSelected,
  onToggle,
  maxSelectionReached,
}: HospitalCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-300 animate-fade-in ${
        isSelected
          ? 'border-primary-500 bg-primary-50 shadow-md scale-[1.02]'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } ${maxSelectionReached && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {hospital.name}
            </h3>
            {hospital.rating && (
              <span className="text-sm text-yellow-600">
                ⭐ {hospital.rating}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{hospital.address}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {hospital.departments.slice(0, 3).map((dept) => (
              <span
                key={dept}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {dept}
              </span>
            ))}
            {hospital.departments.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{hospital.departments.length - 3}
              </span>
            )}
          </div>
          {hospital.phone && (
            <p className="text-sm text-gray-500">📞 {hospital.phone}</p>
          )}
        </div>
        <label className="flex items-center touch-target">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(hospital)}
            disabled={maxSelectionReached && !isSelected}
            className="w-6 h-6 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label={`${hospital.name} ${isSelected ? '선택 해제' : '선택'}`}
          />
        </label>
      </div>
    </div>
  );
}

