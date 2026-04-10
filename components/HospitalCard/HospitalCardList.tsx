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
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 text-center py-14">
        <p className="text-gray-700 font-medium">검색 결과가 없습니다.</p>
        <p className="mt-2 text-sm text-gray-500">
          시도/시군구 또는 의료기관명을 변경해 다시 검색해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
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

