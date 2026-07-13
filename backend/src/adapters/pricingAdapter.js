import { BaseAdapter } from './baseAdapter.js';
import { API_ENDPOINTS } from '../config/apiEndpoints.js';

/**
 * 건강보험심사평가원 비급여진료비정보조회서비스 어댑터
 * API 문서: https://www.data.go.kr/data/15001699/openapi.do
 * 
 * 주의: 실제 API 엔드포인트와 파라미터는 API 상세 페이지에서 확인 후 수정 필요
 */
class PricingAdapter extends BaseAdapter {
  constructor() {
    // 단일 API 키 사용 (모든 API가 동일한 키 사용)
    const serviceKey = process.env.api_key || process.env.HIRA_PRICING_SERVICE_KEY || process.env.HIRA_SERVICE_KEY || '';
    super('건강보험심사평가원', serviceKey);
    this.apiEndpoint = API_ENDPOINTS.NON_PAYMENT_PRICING;
    
    // 캐시 설정 (in-memory)
    this.pricingCache = new Map();
    this.cacheTTL = 1000 * 60 * 60 * 12; // 12시간
    
    // 디버깅용 로그
    if (serviceKey) {
      console.log('✅ PricingAdapter: Service Key 설정됨 (길이:', serviceKey.length, ')');
    } else {
      console.warn('⚠️ PricingAdapter: Service Key 미설정');
    }
  }

  /**
   * 병원별 비급여 가격 정보 조회
   */
  async getPricing(hospitalIds, hospitals = []) {
    if (!Array.isArray(hospitalIds) || hospitalIds.length === 0) {
      return this.formatError('INVALID_REQUEST', 'hospitalIds는 배열이어야 합니다.');
    }

    // 병원 정보 맵 생성 (hospitalId -> hospitalName)
    const hospitalMap = new Map();
    if (Array.isArray(hospitals)) {
      hospitals.forEach((h) => {
        if (h.id && h.name) {
          hospitalMap.set(h.id, h.name);
        }
      });
    }

    // Service Key 재확인 (런타임에 환경변수 다시 읽기) - 단일 API 키 사용
    const serviceKey = process.env.api_key || process.env.HIRA_PRICING_SERVICE_KEY || this.serviceKey;
    
    if (!serviceKey) {
      console.error('❌ Service Key가 없어 가격 정보를 조회할 수 없습니다.');
      return this.formatError('MISSING_SERVICE_KEY', '공공데이터 API 키가 설정되지 않았습니다.');
    }

    // Service Key를 임시로 설정
    this.serviceKey = serviceKey;

    try {
      const settled = await Promise.allSettled(
        hospitalIds.map((hospitalId) =>
          this.getHospitalPricing(hospitalId, false, hospitalMap.get(hospitalId))
        )
      );

      const data = hospitalIds.map((hospitalId, i) => {
        const result = settled[i];
        if (result.status === 'fulfilled' && result.value?.ok && result.value.data) {
          const row = result.value.data;
          return {
            hospitalId: row.hospitalId || hospitalId,
            hospitalName: row.hospitalName || hospitalMap.get(hospitalId) || '',
            items: row.items || [],
            averagePrice: row.averagePrice ?? 0,
            totalItems: row.totalItems ?? (row.items?.length ?? 0),
            ok: true,
          };
        }
        return {
          hospitalId,
          hospitalName: hospitalMap.get(hospitalId) || '',
          items: [],
          averagePrice: 0,
          totalItems: 0,
          ok: false,
        };
      });

      if (data.every((row) => row.ok === false)) {
        return this.formatError('API_ERROR', '선택한 병원의 가격 정보를 불러오지 못했습니다.');
      }

      return this.formatResponse(data);
    } catch (error) {
      console.warn('⚠️ API 호출 실패:', error.message);
      return this.formatError('API_ERROR', error.message || '가격 정보 조회에 실패했습니다.');
    }
  }

  /**
   * 단일 병원의 비급여 가격 정보 조회
   * 
   * API 문서: https://www.data.go.kr/data/15001700/openapi.do
   * 필수 파라미터: ykiho (암호화된 요양기호)
   * 옵션 파라미터: clCd (종별코드), sidoCd (시도코드), sgguCd (시군구코드), yadmNm (병원명)
   */
  async getHospitalPricing(hospitalId, forceRefresh = false, hospitalName = null) {
    try {
      console.log(`💰 비급여 가격 조회: 병원 ID=${hospitalId}`);
      
      // 캐시 확인
      if (!forceRefresh) {
        const cached = this.pricingCache.get(hospitalId);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
          console.log(`✅ 캐시에서 비급여 가격 반환: ${hospitalId}`);
          return this.formatResponse(cached.data);
        }
      }
      
      // Service Key 재확인 (런타임에 환경변수 다시 읽기) - 단일 API 키 사용
      const serviceKey = process.env.api_key || process.env.HIRA_PRICING_SERVICE_KEY || this.serviceKey;
      
      if (!serviceKey) {
        console.error('❌ Service Key가 없어 가격 정보를 조회할 수 없습니다.');
        return this.formatError('MISSING_SERVICE_KEY', '공공데이터 API 키가 설정되지 않았습니다.');
      }

      // Service Key를 임시로 설정
      this.serviceKey = serviceKey;
      
      // 페이지네이션을 고려하여 모든 항목 가져오기
      let allItems = [];
      let pageNo = 1;
      const pageSize = 100;
      let totalCount = Infinity;

      while (allItems.length < totalCount && pageNo <= 10) { // 최대 10페이지 (1000개 항목)
        const result = await this.fetchAPI(this.apiEndpoint, {
          ykiho: hospitalId,
          pageNo: pageNo,
          numOfRows: pageSize,
        });
        
        if (!result.ok) {
          if (pageNo === 1) {
            console.warn('⚠️ API 호출 실패');
            return this.formatError(
              'API_ERROR',
              result.error?.message || '가격 정보 조회에 실패했습니다.'
            );
          }
          // 이후 페이지 실패 시 기존 데이터 반환
          break;
        }

        const items = Array.isArray(result.data) ? result.data : [];
        allItems = allItems.concat(items);

        // totalCount 업데이트
        if (result.meta?.total) {
          totalCount = Number(result.meta.total);
        } else if (items.length < pageSize) {
          // 마지막 페이지
          totalCount = allItems.length;
        }

        if (items.length < pageSize) {
          break;
        }

        pageNo += 1;
      }
      
      console.log(`💰 비급여 가격 API 응답: 성공 (${allItems.length}개 항목, ${pageNo}페이지)`);

      // API 응답을 표준 형식으로 변환
      const pricing = this.transformPricingData(hospitalId, allItems, hospitalName);
      
      // 캐시에 저장
      this.pricingCache.set(hospitalId, {
        data: pricing,
        timestamp: Date.now(),
      });
      
      return this.formatResponse(pricing);
    } catch (error) {
      console.error('❌ 비급여 가격 조회 오류:', error.message);
      return this.formatError('API_ERROR', error.message);
    }
  }

  /**
   * API 응답 데이터를 표준 형식으로 변환
   * 
   * API 응답 필드:
   * - ykiho: 암호화된 요양기호
   * - yadmNm: 병원명
   * - npayKorNm: 비급여한글명 (항목명)
   * - yadmNpayCdNm: 요양기관비급여코드명 (병원별 항목명)
   * - curAmt: 현재금액 (가격, 문자열)
   * - npayCd: 비급여코드
   * - adtFrDd: 적용시작일 (YYYYMMDD)
   * - adtEndDd: 적용종료일 (YYYYMMDD, 99991231은 무기한)
   * - urlAddr: 비급여 정보 URL
   */
  transformPricingData(hospitalId, apiData, hospitalName = null) {
    if (!Array.isArray(apiData) || apiData.length === 0) {
      return {
        hospitalId,
        hospitalName: hospitalName || '병원명 없음',
        items: [],
        averagePrice: 0,
        totalItems: 0,
      };
    }

    // 병원명 우선순위: 전달받은 병원명 > API 응답의 병원명 > 기본값
    const resolvedHospitalName = hospitalName || apiData[0]?.yadmNm || '병원명 없음';

    // 현재 날짜 기준으로 유효한 항목만 필터링 (선택적)
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    const normalizeDate = (value) => {
      if (!value) {
        return undefined;
      }
      const str = String(value);
      if (str.length !== 8) {
        return str;
      }
      return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
    };

    const items = apiData
      .filter((item) => {
        // 적용 종료일이 99991231이거나 오늘 이후인 항목만 포함
        const endDate = item.adtEndDd || '99991231';
        return endDate === '99991231' || endDate >= todayStr;
      })
      .map((item) => {
        // 항목명 우선순위: npayKorNm > yadmNpayCdNm
        const itemName = item.npayKorNm || item.yadmNpayCdNm || '항목명 없음';
        
        // 가격 파싱 (문자열 → 숫자)
        const price = parseInt(item.curAmt || item.amt || '0', 10);
        
        // 단위 추정 (항목명에서 추출하거나 기본값 사용)
        const resolvedUnit = (() => {
          if (itemName.includes('일') || itemName.includes('일당')) {
            return '일';
          }
          if (itemName.includes('건')) {
            return '건';
          }
          if (itemName.includes('회')) {
            return '회';
          }
          return item.unit || '회';
        })();

        return {
          id: item.npayCd || item.sno || `item_${Date.now()}_${Math.random()}`,
          name: itemName,
          price: price,
          unit: resolvedUnit,
          // 추가 메타데이터 (선택적)
          code: item.npayCd,
          url: item.urlAddr,
          startDate: normalizeDate(item.adtFrDd),
          endDate: normalizeDate(item.adtEndDd),
        };
      })
      .filter((item) => item.price > 0); // 가격이 0인 항목 제외

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    const averagePrice = items.length > 0 ? Math.round(totalPrice / items.length) : 0;

    return {
      hospitalId,
      hospitalName: resolvedHospitalName,
      items,
      averagePrice,
      totalItems: items.length,
    };
  }

  /**
   * Mock 비급여 가격 데이터 (API 실패 시 사용)
   */
  getMockPricing(hospitalIds, hospitalMap = new Map()) {
    // 병원 ID와 이름 매핑 (실제 병원 정보와 연동)
    const hospitalNameMap = {
      'hosp_001': '서울대학교병원',
      'hosp_002': '세브란스병원',
      'hosp_003': '삼성서울병원',
      'hosp_028_001': '인천성모병원',
      'hosp_028_002': '가톨릭의과학대학교 인천성모병원',
      'hosp_028_003': '인천광역시의료원',
      'hosp_026_001': '부산대학교병원',
      'hosp_026_002': '부산아산병원',
      'hosp_041_001': '분당서울대학교병원',
      'hosp_041_002': '아산병원',
    };

    // 비급여 항목별 기본 가격 (실제 데이터 기반)
    const basePricing = {
      '초음파검사': { base: 50000, variation: 10000 },
      'CT 촬영': { base: 150000, variation: 20000 },
      'MRI 촬영': { base: 300000, variation: 30000 },
      '내시경 검사': { base: 200000, variation: 25000 },
      '혈액검사': { base: 30000, variation: 5000 },
      '초음파 (복부)': { base: 60000, variation: 10000 },
      '초음파 (갑상선)': { base: 45000, variation: 8000 },
      'CT (뇌)': { base: 180000, variation: 25000 },
      'CT (복부)': { base: 160000, variation: 20000 },
      'MRI (뇌)': { base: 350000, variation: 40000 },
      'MRI (척추)': { base: 320000, variation: 35000 },
      '상부내시경': { base: 180000, variation: 20000 },
      '대장내시경': { base: 250000, variation: 30000 },
      '일반혈액검사': { base: 25000, variation: 5000 },
      '종합건강검진': { base: 500000, variation: 100000 },
    };

    // 병원별 가격 변동 계수 (0.8 ~ 1.2)
    const getPriceVariation = (hospitalId) => {
      // 병원 ID 기반으로 일관된 가격 변동 생성
      const hash = hospitalId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return 0.8 + (hash % 40) / 100; // 0.8 ~ 1.2
    };

    return hospitalIds.map((hospitalId, index) => {
      // 병원명 우선순위: 전달받은 맵 > 기본 맵 > 기본값
      const hospitalName = hospitalMap.get(hospitalId) || hospitalNameMap[hospitalId] || `병원 ${index + 1}`;
      const priceVariation = getPriceVariation(hospitalId);
      
      // 병원별로 다른 항목 조합 생성
      const itemKeys = Object.keys(basePricing);
      const selectedItems = itemKeys.slice(0, 5 + (index % 3)); // 5~7개 항목
      
      const items = selectedItems.map((itemName) => {
        const { base, variation } = basePricing[itemName];
        const price = Math.round(base * priceVariation + (Math.random() * variation - variation / 2));
        return {
          id: `item_${hospitalId}_${itemName}`,
          name: itemName,
          price: price,
          unit: '회',
          code: itemName.toUpperCase().replace(/\s+/g, '_'),
        };
      });

      const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
      const averagePrice = Math.round(totalPrice / items.length);

      return {
        hospitalId,
        hospitalName,
        items,
        averagePrice,
        totalItems: items.length,
      };
    });
  }
}

export const pricingAdapter = new PricingAdapter();
