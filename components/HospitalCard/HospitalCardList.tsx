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
      <div className="text-center py-12">
        <p className="text-gray-500">검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

