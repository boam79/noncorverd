import type { ApiResponse } from "@/types";

// Vercel 배포 시 API 프록시 사용, 로컬 개발 시 직접 연결
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? '/api/opendata'  // Vercel 배포 시 프록시 사용
    : 'http://localhost:3001/opendata');  // 로컬 개발 시 직접 연결

const CLIENT_TOKEN = process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN || process.env.CLIENT_OPENDATA_TOKEN || "";

/**
 * 공공데이터 API 클라이언트
 */
export class ApiClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = CLIENT_TOKEN;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃 (더 빠른 피드백)

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
            message: "요청 시간이 초과되었습니다.",
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
  async getNonCoveredPricing(hospitalIds: string[]): Promise<ApiResponse> {
    return this.request("/pricing", {
      method: "POST",
      body: JSON.stringify({ hospitalIds }),
    });
  }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient();

