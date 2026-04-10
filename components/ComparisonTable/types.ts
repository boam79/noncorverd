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

// 비용 시뮬레이터(티켓 A-1) 데이터 모델
export type QuantityByItemName = Record<string, number>;

export type EstimatedTotalByHospitalId = Record<string, number>;


