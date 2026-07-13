export interface ComparisonHospitalEntry {
  hospitalId: string;
  hospitalName: string;
  price: number;
  unit?: string;
  code?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  diff: number;
  percentDiff: number;
  isHighest: boolean;
  isLowest: boolean;
}

export interface ComparisonItemEntry {
  /** 집계·핀·수량·React key 용 안정 키 (`comparisonItemKey`) */
  itemKey: string;
  name: string;
  averagePrice: number;
  maxPrice: number;
  minPrice: number;
  hospitalCount: number;
  unit?: string;
  code?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  hospitals: Record<string, ComparisonHospitalEntry>;
}

// 비용 시뮬레이터(티켓 A-1) 데이터 모델 — 키는 comparisonItemKey(또는 레거시 항목명)
export type QuantityByItemName = Record<string, number>;

export type EstimatedTotalByHospitalId = Record<string, number>;

export interface OutlierEntry {
  hospitalId: string;
  hospitalName: string;
  itemName: string;
  price: number;
  averagePrice: number;
  ratioPercent: number;
}

/** 비용 시뮬레이터 횟수 localStorage 키 (공유 링크 복원과 동일 값 유지) */
export const COMPARISON_QUANTITIES_STORAGE_KEY = 'comparison-item-quantities-v1';


