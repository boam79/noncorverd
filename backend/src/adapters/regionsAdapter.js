import { BaseAdapter } from './baseAdapter.js';
import { API_ENDPOINTS } from '../config/apiEndpoints.js';

/**
 * 행정안전부 행정표준코드_법정동코드 어댑터
 * API 문서: https://www.data.go.kr/data/15001699/openapi.do
 * 
 * 주의: 실제 API 엔드포인트와 파라미터는 API 상세 페이지에서 확인 후 수정 필요
 */
class RegionsAdapter extends BaseAdapter {
  constructor() {
    // 환경변수를 런타임에 읽도록 수정
    const serviceKey = process.env.ADMINISTRATIVE_CODE_SERVICE_KEY || '';
    super('행정안전부', serviceKey);
    this.apiEndpoint = API_ENDPOINTS.ADMINISTRATIVE_CODE;
    // 디버깅용
    if (serviceKey) {
      console.log('✅ RegionsAdapter: Service Key 설정됨 (길이:', serviceKey.length, ')');
    } else {
      console.warn('⚠️ RegionsAdapter: Service Key 미설정');
    }
  }

  /**
   * 시도 목록 조회
   * 실제 API가 시도 목록을 직접 제공하지 않을 수 있으므로,
   * 하드코딩된 시도 목록을 반환하거나 전체 조회 후 중복 제거
   */
  async getSidoList() {
    // 공공데이터 API는 보통 전체 법정동을 조회하므로,
    // 시도 코드만 추출하여 반환
    const mockSidoList = [
      { code: '11', name: '서울특별시' },
      { code: '26', name: '부산광역시' },
      { code: '27', name: '대구광역시' },
      { code: '28', name: '인천광역시' },
      { code: '29', name: '광주광역시' },
      { code: '30', name: '대전광역시' },
      { code: '31', name: '울산광역시' },
      { code: '36', name: '세종특별자치시' },
      { code: '41', name: '경기도' },
      { code: '42', name: '강원특별자치도' },
      { code: '43', name: '충청북도' },
      { code: '44', name: '충청남도' },
      { code: '45', name: '전북특별자치도' },
      { code: '46', name: '전라남도' },
      { code: '47', name: '경상북도' },
      { code: '48', name: '경상남도' },
      { code: '50', name: '제주특별자치도' },
    ];

    // Service Key 재확인 (런타임에 환경변수 다시 읽기)
    const serviceKey = process.env.ADMINISTRATIVE_CODE_SERVICE_KEY || this.serviceKey;
    
    if (!serviceKey) {
      console.warn('⚠️ Service Key가 없어 Mock 데이터를 반환합니다.');
      return this.formatResponse(mockSidoList);
    }

    console.log('✅ Service Key 확인됨, 실제 API 호출 시도...');
    // Service Key를 임시로 설정
    this.serviceKey = serviceKey;

    try {
      // 실제 API 호출 시도
      // 주의: 실제 API 엔드포인트와 파라미터는 API 문서에서 확인 필요
      const result = await this.fetchAPI(this.apiEndpoint, {
        // API 문서에 따라 파라미터 조정 필요
        // 예: pageNo: 1, numOfRows: 100
      });

      console.log('📡 API 응답:', result.ok ? '성공' : '실패', result.error?.message || '');

      // API가 시도 목록을 직접 제공하지 않으면 Mock 데이터 사용
      if (!result.ok || !result.data || result.data.length === 0) {
        console.warn('⚠️ API 응답이 비어있어 Mock 데이터를 반환합니다.');
        return this.formatResponse(mockSidoList);
      }

      console.log('✅ 실제 API 데이터 반환:', result.data.length, '개');
      return result;
    } catch (error) {
      console.warn('⚠️ API 호출 실패, Mock 데이터 반환:', error.message);
      return this.formatResponse(mockSidoList);
    }
  }

  /**
   * 시군구 목록 조회
   */
  async getSigunguList(sido) {
    if (!sido) {
      return this.formatError('MISSING_PARAM', 'sido 파라미터가 필요합니다.');
    }

    // Service Key가 없으면 Mock 데이터 반환
    if (!this.serviceKey) {
      console.warn('⚠️ Service Key가 없어 Mock 데이터를 반환합니다.');
      const mockData = this.getMockSigunguList(sido);
      return this.formatResponse(mockData);
    }

    try {
      const result = await this.fetchAPI(this.apiEndpoint, {
        sido: sido,
        // API 문서에 따라 파라미터 조정 필요
      });

      // API 호출 실패 시 Mock 데이터 사용
      if (!result.ok || !result.data || result.data.length === 0) {
        const mockData = this.getMockSigunguList(sido);
        return this.formatResponse(mockData);
      }

      return result;
    } catch (error) {
      console.warn('⚠️ API 호출 실패, Mock 데이터 반환:', error.message);
      const mockData = this.getMockSigunguList(sido);
      return this.formatResponse(mockData);
    }
  }

  /**
   * Mock 시군구 데이터 (API 실패 시 사용)
   */
  getMockSigunguList(sido) {
    const mockData = {
      '11': [ // 서울
        { code: '110', name: '종로구' },
        { code: '140', name: '중구' },
        { code: '170', name: '용산구' },
        { code: '200', name: '성동구' },
        { code: '215', name: '광진구' },
        { code: '230', name: '동대문구' },
        { code: '260', name: '중랑구' },
        { code: '290', name: '성북구' },
        { code: '305', name: '강북구' },
        { code: '320', name: '도봉구' },
        { code: '350', name: '노원구' },
        { code: '380', name: '은평구' },
        { code: '410', name: '서대문구' },
        { code: '440', name: '마포구' },
        { code: '470', name: '양천구' },
        { code: '500', name: '강서구' },
        { code: '530', name: '구로구' },
        { code: '545', name: '금천구' },
        { code: '560', name: '영등포구' },
        { code: '590', name: '동작구' },
        { code: '620', name: '관악구' },
        { code: '650', name: '서초구' },
        { code: '680', name: '강남구' },
        { code: '710', name: '송파구' },
        { code: '740', name: '강동구' },
      ],
      '26': [ // 부산
        { code: '110', name: '중구' },
        { code: '140', name: '서구' },
        { code: '170', name: '동구' },
        { code: '200', name: '영도구' },
        { code: '230', name: '부산진구' },
        { code: '260', name: '동래구' },
        { code: '290', name: '남구' },
        { code: '320', name: '북구' },
        { code: '350', name: '해운대구' },
        { code: '380', name: '사하구' },
        { code: '410', name: '금정구' },
        { code: '440', name: '강서구' },
        { code: '470', name: '연제구' },
        { code: '500', name: '수영구' },
        { code: '530', name: '사상구' },
        { code: '710', name: '기장군' },
      ],
    };

    return mockData[sido] || [];
  }

  /**
   * 통합 지역 정보 조회
   */
  async getRegions(sido) {
    if (!sido) {
      return this.getSidoList();
    }
    return this.getSigunguList(sido);
  }
}

export const regionsAdapter = new RegionsAdapter();
