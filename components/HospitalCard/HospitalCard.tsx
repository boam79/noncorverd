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
    <article
      data-testid="hospital-card"
      className={`rounded-card border p-4 transition-shadow duration-200 animate-fade-in ${
        isSelected
          ? 'border-primary-400 bg-primary-50/90 shadow-md ring-2 ring-primary-300/60'
          : 'border-line bg-surface hover:border-gray-300 hover:shadow-md'
      } ${maxSelectionReached && !isSelected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{hospital.name}</h3>
            {hospital.rating && (
              <span className="text-sm text-yellow-600">⭐ {hospital.rating}</span>
            )}
          </div>
          <p className="mb-2 line-clamp-2 text-xs leading-snug text-gray-600">
            <span className="font-medium text-gray-700">
              {hospital.clCdNm ?? hospital.type}
            </span>
            {hospital.address ? (
              <>
                <span className="mx-1.5 text-gray-300" aria-hidden>
                  ·
                </span>
                <span>{hospital.address}</span>
              </>
            ) : null}
          </p>
          {(hospital.departments ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {(hospital.departments ?? []).slice(0, 3).map((dept) => (
                <span
                  key={dept}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {dept}
                </span>
              ))}
              {(hospital.departments ?? []).length > 3 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{(hospital.departments ?? []).length - 3}
                </span>
              )}
            </div>
          )}
          {hospital.phone && (
            <p className="text-sm text-gray-500">📞 {hospital.phone}</p>
          )}
        </div>
        <label className="flex items-center touch-target">
          <button
            type="button"
            data-testid="hospital-select-button"
            onClick={() => onToggle(hospital)}
            disabled={maxSelectionReached && !isSelected}
            className="flex h-6 w-6 items-center justify-center rounded border-gray-300 text-primary-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`${hospital.name} ${isSelected ? '선택 해제' : '선택'}`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              readOnly
              disabled={maxSelectionReached && !isSelected}
              className="pointer-events-none h-6 w-6 rounded border-gray-300 text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`${hospital.name} ${isSelected ? '선택 해제' : '선택'}`}
            />
          </button>
        </label>
      </div>
    </article>
  );
}

