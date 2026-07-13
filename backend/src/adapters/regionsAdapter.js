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
    // 단일 API 키 사용 (모든 API가 동일한 키 사용)
    const serviceKey = process.env.api_key || process.env.ADMINISTRATIVE_CODE_SERVICE_KEY || '';
    super('행정안전부', serviceKey);
    this.apiEndpoint = API_ENDPOINTS.ADMINISTRATIVE_CODE;
    this.regionCache = null;
    this.regionCacheTimestamp = 0;
    this.regionCacheTTL = 1000 * 60 * 60 * 12; // 12시간 캐시 유지
    // 디버깅용
    if (serviceKey) {
      console.log('✅ RegionsAdapter: Service Key 설정됨 (길이:', serviceKey.length, ')');
    } else {
      console.warn('⚠️ RegionsAdapter: Service Key 미설정');
    }
  }

  async loadRegionData(force = false) {
    if (!this.serviceKey) {
      throw new Error('Service Key가 설정되지 않았습니다.');
    }

    const now = Date.now();
    if (!force && this.regionCache && now - this.regionCacheTimestamp < this.regionCacheTTL) {
      return this.regionCache;
    }

    const allRows = [];
    const pageSize = 1000;
    let pageNo = 1;
    let total = Infinity;

    while (allRows.length < total) {
      const result = await this.fetchAPI(this.apiEndpoint, {
        type: 'json',
        pageNo,
        numOfRows: pageSize,
      });

      if (!result.ok) {
        throw new Error(result.error?.message || '행정표준코드 API 호출 실패');
      }

      const items = Array.isArray(result.data) ? result.data : [];
      allRows.push(...items);

      total = Number(result.meta?.total || items.length);
      if (items.length < pageSize) {
        break;
      }

      pageNo += 1;
    }

    this.regionCache = allRows;
    this.regionCacheTimestamp = now;

    console.log(`✅ RegionsAdapter: 행정표준코드 ${allRows.length}건 로드 완료 (pageNo=${pageNo - 1})`);

    return this.regionCache;
  }

  /**
   * 시도 목록 조회
   * 실제 API가 시도 목록을 직접 제공하지 않을 수 있으므로,
   * 하드코딩된 시도 목록을 반환하거나 전체 조회 후 중복 제거
   */
  async getSidoList() {
    // 공공데이터 API는 보통 전체 법정동을 조회하므로,
    // 시도 코드만 추출하여 반환
    // 최신 행정코드 체계 (2024년 기준)
    // 실제 API 응답과 일치하도록 최신 코드로 갱신
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
      { code: '43', name: '충청북도' },
      { code: '44', name: '충청남도' },
      { code: '46', name: '전라남도' },
      { code: '47', name: '경상북도' },
      { code: '48', name: '경상남도' },
      { code: '50', name: '제주특별자치도' },
      { code: '51', name: '강원특별자치도' },
      { code: '52', name: '전북특별자치도' },
    ];

    try {
      const rows = await this.loadRegionData();
      const sidoMap = new Map();

      rows.forEach((row) => {
        const sidoCd = row.sido_cd ? String(row.sido_cd).padStart(2, '0') : null;
        const isSidoLevel = (
          row.sgg_cd === '000' && row.umd_cd === '000' && row.ri_cd === '00'
        ) || row.locathigh_cd === '0000000000';

        if (!sidoCd || !isSidoLevel) {
          return;
        }

        if (!sidoMap.has(sidoCd)) {
          const name = row.locatadd_nm || row.locallow_nm || '';
          sidoMap.set(sidoCd, name);
        }
      });

      const ALLOWED_SIDO = new Set(mockSidoList.map((s) => s.code));

      const sidoList = Array.from(sidoMap.entries())
        .map(([code, name]) => ({ code, name }))
        // 행정 API 원본에 간헐적으로 등장하는 비표준 코드(예: 12 전남광주통합특별시)를 걸러
        // 광주(29)·전남(46) 등 정상 시도가 누락·오염되지 않게 합니다.
        .filter((item) => ALLOWED_SIDO.has(item.code))
        .sort((a, b) => Number(a.code) - Number(b.code));

      // 필터 후 비어 있거나 일부만 있으면 정적 목록으로 보강(누락 시도 채움)
      if (sidoList.length >= mockSidoList.length) {
        return this.formatResponse(sidoList);
      }
      if (sidoList.length > 0) {
        const found = new Set(sidoList.map((s) => s.code));
        const merged = [
          ...sidoList,
          ...mockSidoList.filter((s) => !found.has(s.code)),
        ].sort((a, b) => Number(a.code) - Number(b.code));
        return this.formatResponse(merged);
      }

      console.warn('⚠️ 시도 목록 API 응답이 비어 있어 Mock 데이터를 사용합니다.');
      return this.formatResponse(mockSidoList, { degraded: true, source: 'fallback-sido' });
    } catch (error) {
      console.warn('⚠️ 시도 목록 조회 실패, Mock 데이터 반환:', error.message);
      return this.formatResponse(mockSidoList, { degraded: true, source: 'fallback-sido' });
    }
  }

  /**
   * 시군구 목록 조회
   */
  async getSigunguList(sido) {
    if (!sido) {
      return this.formatError('MISSING_PARAM', 'sido 파라미터가 필요합니다.');
    }

    const mockData = this.getMockSigunguList(sido);
    const targetSido = String(sido).padStart(2, '0');

    try {
      const rows = await this.loadRegionData();
      const sigunguMap = new Map();

      rows.forEach((row) => {
        const { sido_cd, sgg_cd, umd_cd, ri_cd } = row;
        if (!sido_cd || !sgg_cd) {
          return;
        }

        const isSigunguLevel = sgg_cd !== '000' && umd_cd === '000' && ri_cd === '00';
        const matchesSido = String(sido_cd).padStart(2, '0') === targetSido;

        if (!matchesSido || !isSigunguLevel) {
          return;
        }

        const code = `${String(sido_cd).padStart(2, '0')}${String(sgg_cd).padStart(3, '0')}`.padEnd(6, '0');

        if (!sigunguMap.has(code)) {
          const name = row.locatadd_nm || row.locallow_nm || '';
          sigunguMap.set(code, {
            code,
            name,
            regionCode: row.region_cd,
          });
        }
      });

      const sigunguList = Array.from(sigunguMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, 'ko')
      );

      if (sigunguList.length === 0) {
        console.warn(`⚠️ 시군구 데이터가 없어 오류를 반환합니다. (sido=${sido})`);
        if (mockData.length > 0) {
          return this.formatResponse(mockData, { degraded: true, source: 'fallback-sigungu' });
        }
        return this.formatError('API_ERROR', '시군구 목록을 불러오지 못했습니다.');
      }

      console.log(`✅ 시군구 목록 반환: ${sigunguList.length}개 (sido=${sido})`);
      return this.formatResponse(sigunguList);
    } catch (error) {
      console.warn('⚠️ 시군구 조회 실패:', error.message);
      if (mockData.length > 0) {
        return this.formatResponse(mockData, { degraded: true, source: 'fallback-sigungu' });
      }
      return this.formatError('API_ERROR', error.message || '시군구 목록 조회에 실패했습니다.');
    }
  }

  /**
   * Mock 시군구 데이터 (API 실패 시 사용) — 행정안전부 6자리 코드
   */
  getMockSigunguList(sido) {
    const mockData = {
      '11': [ // 서울특별시
        { code: '111100', name: '서울특별시 종로구' },
        { code: '111400', name: '서울특별시 중구' },
        { code: '116800', name: '서울특별시 강남구' },
      ],
      '26': [ // 부산광역시
        { code: '261100', name: '부산광역시 중구' },
        { code: '263500', name: '부산광역시 해운대구' },
      ],
      '31': [ // 울산광역시
        { code: '311100', name: '울산광역시 중구' },
        { code: '317100', name: '울산광역시 울주군' },
      ],
      '36': [ // 세종특별자치시
        { code: '361100', name: '세종특별자치시' },
      ],
      '41': [ // 경기도
        { code: '411100', name: '경기도 수원시' },
        { code: '413100', name: '경기도 구리시' },
      ],
    };

    return mockData[String(sido).padStart(2, '0')] || [];
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
