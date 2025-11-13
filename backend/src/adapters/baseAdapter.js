import axios from 'axios';
import { API_BASE_URL } from '../config/apiEndpoints.js';

/**
 * 공공데이터 API 어댑터 기본 클래스
 * 모든 어댑터는 이 클래스를 상속받아 구현
 */
export class BaseAdapter {
  constructor(provider, serviceKey) {
    this.provider = provider;
    this.serviceKey = serviceKey;
    this.baseUrl = API_BASE_URL;
  }

  /**
   * 표준 응답 포맷으로 변환
   */
  formatResponse(data, meta = {}) {
    return {
      ok: true,
      data,
      meta,
    };
  }

  /**
   * 에러 응답 포맷
   */
  formatError(code, message) {
    return {
      ok: false,
      error: {
        code,
        message,
      },
    };
  }

  /**
   * API 호출 (공통 로직)
   */
  async fetchAPI(endpoint, params = {}) {
    if (!this.serviceKey) {
      console.warn(`⚠️ [${this.provider}] Service Key가 설정되지 않았습니다.`);
      return this.formatError('MISSING_SERVICE_KEY', 'Service Key가 설정되지 않았습니다.');
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const requestParams = {
        ...params,
        serviceKey: this.serviceKey,
        numOfRows: params.numOfRows || 100,
        pageNo: params.pageNo || 1,
      };

      console.log(`📡 [${this.provider}] API 호출: ${url}`, {
        ...requestParams,
        serviceKey: '***',
      });

      // Service Key URL 인코딩 (공공데이터 API는 인코딩된 키를 요구할 수 있음)
      const encodedServiceKey = encodeURIComponent(this.serviceKey);
      const finalParams = {
        ...requestParams,
        serviceKey: encodedServiceKey,
      };

      const response = await axios.get(url, {
        params: finalParams,
        timeout: 30000, // 30초 타임아웃
        headers: {
          'Accept': 'application/json',
        },
      });

      // 응답 데이터 검증
      if (response.data && response.data.response) {
        const responseData = response.data.response;
        
        // 에러 체크
        if (responseData.header && responseData.header.resultCode !== '00') {
          return this.formatError(
            'API_ERROR',
            responseData.header.resultMsg || 'API 호출 실패'
          );
        }

        // 성공 응답
        const items = responseData.body?.items || [];
        return this.formatResponse(items, {
          total: responseData.body?.totalCount || items.length,
          page: requestParams.pageNo,
          limit: requestParams.numOfRows,
        });
      }

      // XML 응답인 경우 (일부 API는 XML만 지원)
      if (typeof response.data === 'string' && response.data.includes('<?xml')) {
        console.warn(`⚠️ [${this.provider}] XML 응답을 받았습니다. JSON 파서가 필요합니다.`);
        // TODO: XML 파싱 로직 추가 (xml2js 등)
        return this.formatError('XML_RESPONSE', 'XML 응답은 아직 지원하지 않습니다.');
      }

      return this.formatResponse(response.data);
    } catch (error) {
      console.error(`❌ [${this.provider}] API 오류:`, error.message);
      
      if (error.code === 'ECONNABORTED') {
        return this.formatError('TIMEOUT_ERROR', '요청 시간이 초과되었습니다.');
      }
      
      if (error.response) {
        // 에러 응답 본문 로깅
        console.error(`❌ [${this.provider}] API 에러 응답:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
        
        // 에러 메시지 추출
        let errorMessage = error.response.statusText || 'API 호출 실패';
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data.substring(0, 200);
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        }
        
        return this.formatError(
          `HTTP_${error.response.status}`,
          errorMessage
        );
      }

      return this.formatError('NETWORK_ERROR', error.message || '네트워크 오류가 발생했습니다.');
    }
  }
}
