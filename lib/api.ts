import type { ApiResponse } from "@/types";

// Vercel 배포 시 API 프록시 사용, 로컬 개발 시 직접 연결
// Vercel 배포인지 확인하는 함수 (빌드 시점과 런타임 모두 지원)
const isVercelDeployment = () => {
  // 빌드 시점 확인 (환경변수)
  if (process.env.VERCEL || process.env.VERCEL_URL) {
    return true;
  }
  
  // 런타임 확인 (클라이언트 사이드)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname.includes('vercel.app') || hostname.includes('vercel.com');
  }
  
  return false;
};

// API Base URL 결정 함수
const getApiBaseUrl = () => {
  // Vercel 배포인 경우 무조건 프록시 사용 (환경변수 무시)
  if (isVercelDeployment()) {
    return '/api/opendata';
  }
  
  // 로컬 개발 또는 다른 환경
  // 환경변수가 설정되어 있으면 사용, 없으면 기본값
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/opendata';
};

// 런타임에 동적으로 결정 (클라이언트 사이드에서만)
const getRuntimeApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
      return '/api/opendata';
    }
  }
  return null; // 서버 사이드에서는 null 반환
};

const API_BASE_URL = getApiBaseUrl();

const CLIENT_TOKEN = process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN || process.env.CLIENT_OPENDATA_TOKEN || "";

/**
 * 공공데이터 API 클라이언트
 */
export class ApiClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    // 런타임에 Vercel 배포인지 다시 확인 (클라이언트 사이드)
    const runtimeUrl = getRuntimeApiBaseUrl();
    this.baseUrl = runtimeUrl || API_BASE_URL;
    this.token = CLIENT_TOKEN;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    // Render Free 플랜 콜드 스타트(~50초)를 고려해 70초로 설정
    const timeoutId = setTimeout(() => controller.abort(), 70000);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Client-Token": this.token,
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }

        return {
          ok: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorMessage,
          },
        };
      }

      const responseData = await response.json();
      
      // 백엔드 응답 구조: { ok: true, data: [...], meta: {} }
      // 이미 표준 형식이므로 그대로 반환
      if (responseData.ok !== undefined) {
        return responseData;
      }
      
      // 백엔드가 표준 형식이 아닌 경우 래핑
      return {
        ok: true,
        data: responseData,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          ok: false,
          error: {
            code: "TIMEOUT_ERROR",
            message: "서버 응답 시간이 초과되었습니다. 서버가 시작 중일 수 있습니다. 잠시 후 다시 시도해주세요.",
          },
        };
      }

      return {
        ok: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * 지역 정보 조회 (행정안전부 법정동코드)
   */
  async getRegions(sido?: string): Promise<ApiResponse> {
    const params = sido ? `?sido=${encodeURIComponent(sido)}` : "";
    return this.request(`/regions${params}`);
  }

  /**
   * 병원 목록 조회
   */
  async getHospitals(params: {
    sido?: string;
    sigungu?: string;
    type?: string;
    hospitalName?: string;
  }): Promise<ApiResponse> {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        },
        {} as Record<string, string>
      )
    ).toString();
    return this.request(`/hospitals?${queryString}`);
  }

  /**
   * 비급여 가격 정보 조회
   */
  async getNonCoveredPricing(hospitalIds: string[], hospitals?: Array<{ id: string; name: string }>): Promise<ApiResponse> {
    return this.request("/pricing", {
      method: "POST",
      body: JSON.stringify({ hospitalIds, hospitals }),
    });
  }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient();

