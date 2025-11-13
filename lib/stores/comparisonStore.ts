import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Hospital } from '@/types';

interface ComparisonState {
  selectedHospitals: Hospital[];
  maxSelection: number;
  addHospital: (hospital: Hospital) => void;
  removeHospital: (hospitalId: string) => void;
  clearHospitals: () => void;
  toggleHospital: (hospital: Hospital) => void;
  isSelected: (hospitalId: string) => boolean;
  canAddMore: () => boolean;
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      selectedHospitals: [],
      maxSelection: 5,

      addHospital: (hospital) => {
        const { selectedHospitals, maxSelection } = get();
        if (
          selectedHospitals.length < maxSelection &&
          !selectedHospitals.some((h) => h.id === hospital.id)
        ) {
          set({
            selectedHospitals: [...selectedHospitals, hospital],
          });
        }
      },

      removeHospital: (hospitalId) => {
        set({
          selectedHospitals: get().selectedHospitals.filter(
            (h) => h.id !== hospitalId
          ),
        });
      },

      clearHospitals: () => {
        set({ selectedHospitals: [] });
      },

      toggleHospital: (hospital) => {
        const { selectedHospitals, maxSelection } = get();
        const isSelected = selectedHospitals.some((h) => h.id === hospital.id);

        if (isSelected) {
          get().removeHospital(hospital.id);
        } else {
          if (selectedHospitals.length < maxSelection) {
            get().addHospital(hospital);
          }
        }
      },

      isSelected: (hospitalId) => {
        return get().selectedHospitals.some((h) => h.id === hospitalId);
      },

      canAddMore: () => {
        return get().selectedHospitals.length < get().maxSelection;
      },
    }),
    {
      name: 'comparison-storage',
      partialize: (state) => ({
        selectedHospitals: state.selectedHospitals,
      }),
    }
  )
);

