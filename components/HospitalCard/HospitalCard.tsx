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
      className={`group relative flex h-full cursor-pointer flex-col gap-3 rounded-card border p-4 transition-all duration-200 animate-fade-in ${
        isSelected
          ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-200 shadow-sm'
          : 'border-line bg-surface hover:border-line-strong hover:bg-surface-muted/70 hover:shadow-sm'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
            <h3 className="text-base font-semibold tracking-tight text-ink md:text-lg">
              {hospital.name}
            </h3>
            {hospital.rating != null && (
              <span className="font-display text-sm tabular-nums text-ink-soft">
                {hospital.rating}
              </span>
            )}
          </div>
          <span className="inline-flex items-center rounded-full border border-line bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-ink-muted">
            {hospital.clCdNm ?? hospital.type}
          </span>
        </div>
        <span className="flex shrink-0 items-center touch-target">
          <input
            type="checkbox"
            data-testid="hospital-select-button"
            checked={isSelected}
            disabled={disabled}
            onChange={() => {
              if (!disabled) onToggle(hospital);
            }}
            className="h-5 w-5 rounded border-line text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`${hospital.name} ${isSelected ? '선택 해제' : '선택'}`}
          />
        </span>
      </div>

      {hospital.address ? (
        <p className="line-clamp-2 text-xs leading-snug text-ink-muted">{hospital.address}</p>
      ) : null}

      {(hospital.departments ?? []).length > 0 && (
        <p className="text-xs text-ink-soft">
          {(hospital.departments ?? []).slice(0, 4).join(' · ')}
          {(hospital.departments ?? []).length > 4
            ? ` 외 ${(hospital.departments ?? []).length - 4}`
            : ''}
        </p>
      )}

      {hospital.phone && (
        <p className="mt-auto text-sm tabular-nums text-ink-soft">{hospital.phone}</p>
      )}
    </label>
  );
}
