'use client';

import { HospitalCard } from './HospitalCard';
import type { Hospital } from '@/types';

interface HospitalCardListProps {
  hospitals: Hospital[];
  selectedHospitals: Hospital[];
  onToggleHospital: (hospital: Hospital) => void;
  maxSelection: number;
}

export function HospitalCardList({
  hospitals,
  selectedHospitals,
  onToggleHospital,
  maxSelection,
}: HospitalCardListProps) {
  const maxSelectionReached = selectedHospitals.length >= maxSelection;

  if (hospitals.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line bg-surface-muted/70 py-14 text-center">
        <p className="font-medium text-ink">검색 결과가 없습니다.</p>
        <p className="mt-2 text-sm text-ink-soft">
          시도/시군구 또는 의료기관명을 변경해 다시 검색해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {hospitals.map((hospital) => (
        <HospitalCard
          key={hospital.id}
          hospital={hospital}
          isSelected={selectedHospitals.some((h) => h.id === hospital.id)}
          onToggle={onToggleHospital}
          maxSelectionReached={maxSelectionReached}
        />
      ))}
    </div>
  );
}
