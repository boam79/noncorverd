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

      const sidoList = Array.from(sidoMap.entries())
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => Number(a.code) - Number(b.code));

      if (sidoList.length > 0) {
        return this.formatResponse(sidoList);
      }

      console.warn('⚠️ 시도 목록 API 응답이 비어 있어 Mock 데이터를 사용합니다.');
      return this.formatResponse(mockSidoList);
    } catch (error) {
      console.warn('⚠️ 시도 목록 조회 실패, Mock 데이터 반환:', error.message);
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
        console.warn(`⚠️ 시군구 데이터가 없어 Mock 데이터를 반환합니다. (sido=${sido})`);
        return this.formatResponse(mockData);
      }

      console.log(`✅ 시군구 목록 반환: ${sigunguList.length}개 (sido=${sido})`);
      return this.formatResponse(sigunguList);
    } catch (error) {
      console.warn('⚠️ 시군구 조회 실패, Mock 데이터 반환:', error.message);
      return this.formatResponse(mockData);
    }
  }

  /**
   * Mock 시군구 데이터 (API 실패 시 사용)
   */
  getMockSigunguList(sido) {
    const mockData = {
      '11': [ // 서울특별시
        { code: '110000', name: '종로구' },
        { code: '140000', name: '중구' },
        { code: '170000', name: '용산구' },
        { code: '200000', name: '성동구' },
        { code: '215000', name: '광진구' },
        { code: '230000', name: '동대문구' },
        { code: '260000', name: '중랑구' },
        { code: '290000', name: '성북구' },
        { code: '305000', name: '강북구' },
        { code: '320000', name: '도봉구' },
        { code: '350000', name: '노원구' },
        { code: '380000', name: '은평구' },
        { code: '410000', name: '서대문구' },
        { code: '440000', name: '마포구' },
        { code: '470000', name: '양천구' },
        { code: '500000', name: '강서구' },
        { code: '530000', name: '구로구' },
        { code: '545000', name: '금천구' },
        { code: '560000', name: '영등포구' },
        { code: '590000', name: '동작구' },
        { code: '620000', name: '관악구' },
        { code: '650000', name: '서초구' },
        { code: '680000', name: '강남구' },
        { code: '710000', name: '송파구' },
        { code: '740000', name: '강동구' },
      ],
      '21': [ // 부산광역시
        { code: '210001', name: '중구' },
        { code: '210002', name: '서구' },
        { code: '210003', name: '동구' },
        { code: '210004', name: '영도구' },
        { code: '210005', name: '부산진구' },
        { code: '210006', name: '서구' },
        { code: '210007', name: '동래구' },
        { code: '210008', name: '남구' },
        { code: '210009', name: '북구' },
        { code: '210010', name: '해운대구' },
        { code: '210011', name: '사하구' },
        { code: '210012', name: '금정구' },
        { code: '210013', name: '강서구' },
        { code: '210014', name: '연제구' },
        { code: '210015', name: '수영구' },
        { code: '210016', name: '사상구' },
        { code: '210017', name: '기장군' },
      ],
      '26': [ // 울산광역시 (대표 몇 개 구/군)
        { code: '260001', name: '중구' },
        { code: '260002', name: '동구' },
        { code: '260003', name: '북구' },
        { code: '260004', name: '울주군' },
        { code: '260005', name: '남구' },
      ],
      '31': [ // 경기도 (대표 주요 시)
        { code: '310100', name: '광명시' },
        { code: '310200', name: '평택시' },
        { code: '310300', name: '수원시' },
        { code: '310400', name: '용인시' },
        { code: '310500', name: '고양시' },
        { code: '310600', name: '성남시' },
      ],
      '41': [ // 세종특별자치시
        { code: '410000', name: '세종시' },
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
