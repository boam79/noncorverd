// 공공데이터 API 응답 타입
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// 지역 정보 타입
export interface Region {
  code: string;
  name: string;
  sido?: string;
  sigungu?: string;
}

// 의료기관 종별
export type MedicalInstitutionType =
  | "종합병원"
  | "병원"
  | "의원"
  | "요양병원"
  | "치과"
  | "한의원";

// 병원 정보 타입
export interface Hospital {
  id: string;
  name: string;
  address: string;
  type: MedicalInstitutionType;
  departments: string[];
  phone?: string;
  rating?: number;
  sidoCd?: string;
  sgguCd?: string;
  clCdNm?: string;
  ykiho?: string;
}

// 비급여 항목 타입
export interface NonCoveredItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
  code?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
}

// 병원별 비급여 가격 정보
export interface HospitalPricing {
  hospitalId: string;
  hospitalName: string;
  items: NonCoveredItem[];
  averagePrice?: number;
  totalItems?: number;
}

// 비교 선택 상태
export interface ComparisonState {
  selectedHospitals: Hospital[];
  maxSelection: number; // 기본값: 5
}

