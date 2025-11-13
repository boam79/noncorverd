import axios from 'axios';
import xml2js from 'xml2js';
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
        console.log(`📄 [${this.provider}] XML 응답을 받았습니다. 파싱 중...`);
        try {
          const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
            ignoreAttrs: false,
          });
          
          const parsed = await parser.parseStringPromise(response.data);
          
          // 공공데이터 API 표준 응답 구조: response.header, response.body
          if (parsed.response) {
            const header = parsed.response.header || {};
            const body = parsed.response.body || {};
            
            // 에러 체크
            if (header.resultCode && header.resultCode !== '00') {
              return this.formatError(
                'API_ERROR',
                header.resultMsg || 'API 호출 실패'
              );
            }
            
            // items 추출 (단일 객체 또는 배열)
            let items = [];
            if (body.items) {
              if (Array.isArray(body.items.item)) {
                items = body.items.item;
              } else if (body.items.item) {
                items = [body.items.item];
              }
            }
            
            console.log(`✅ [${this.provider}] XML 파싱 성공: ${items.length}개 항목`);
            
            return this.formatResponse(items, {
              total: body.totalCount || items.length,
              page: body.pageNo || requestParams.pageNo,
              limit: body.numOfRows || requestParams.numOfRows,
            });
          }
          
          // 표준 구조가 아닌 경우 전체 반환
          return this.formatResponse(parsed);
        } catch (xmlError) {
          console.error(`❌ [${this.provider}] XML 파싱 오류:`, xmlError.message);
          return this.formatError('XML_PARSE_ERROR', `XML 파싱 실패: ${xmlError.message}`);
        }
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
