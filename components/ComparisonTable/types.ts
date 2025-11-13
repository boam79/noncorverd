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


