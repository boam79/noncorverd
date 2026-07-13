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
  const disabled = maxSelectionReached && !isSelected;

  return (
    <label
      data-testid="hospital-card"
      className={`flex cursor-pointer items-start justify-between gap-3 px-3 py-4 transition-colors duration-200 animate-fade-in sm:px-4 ${
        isSelected ? 'bg-brand-50/50' : 'bg-transparent hover:bg-surface-muted/60'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-baseline gap-2">
          <h3 className="text-lg font-semibold tracking-tight text-ink">{hospital.name}</h3>
          {hospital.rating != null && (
            <span className="font-display text-sm tabular-nums text-ink-soft">
              {hospital.rating}
            </span>
          )}
        </div>
        <p className="mb-2 line-clamp-2 text-xs leading-snug text-ink-muted">
          <span className="font-medium text-ink-muted">
            {hospital.clCdNm ?? hospital.type}
          </span>
          {hospital.address ? (
            <>
              <span className="mx-1.5 text-line-strong" aria-hidden>
                ·
              </span>
              <span>{hospital.address}</span>
            </>
          ) : null}
        </p>
        {(hospital.departments ?? []).length > 0 && (
          <p className="text-xs text-ink-soft">
            {(hospital.departments ?? []).slice(0, 4).join(' · ')}
            {(hospital.departments ?? []).length > 4
              ? ` 외 ${(hospital.departments ?? []).length - 4}`
              : ''}
          </p>
        )}
        {hospital.phone && (
          <p className="mt-1 text-sm tabular-nums text-ink-soft">{hospital.phone}</p>
        )}
      </div>
      <span className="flex items-center touch-target">
        <input
          type="checkbox"
          data-testid="hospital-select-button"
          checked={isSelected}
          disabled={disabled}
          onChange={() => {
            if (!disabled) onToggle(hospital);
          }}
          className="h-6 w-6 rounded border-line text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${hospital.name} ${isSelected ? '선택 해제' : '선택'}`}
        />
      </span>
    </label>
  );
}
