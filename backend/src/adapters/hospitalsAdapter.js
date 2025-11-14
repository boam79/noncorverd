import { BaseAdapter } from './baseAdapter.js';
import { API_ENDPOINTS } from '../config/apiEndpoints.js';

/**
 * 건강보험심사평가원 병원정보서비스 어댑터
 * API 문서: https://www.data.go.kr/data/15001699/openapi.do
 * 
 * 주의: 실제 API 엔드포인트와 파라미터는 API 상세 페이지에서 확인 후 수정 필요
 */
class HospitalsAdapter extends BaseAdapter {
  constructor() {
    // 단일 API 키 사용 (모든 API가 동일한 키 사용)
    const serviceKey = process.env.api_key || process.env.HIRA_SERVICE_KEY || '';
    super('건강보험심사평가원', serviceKey);
    this.apiEndpoint = API_ENDPOINTS.HOSPITAL_INFO;
    
    // 디버깅용 로그
    if (serviceKey) {
      console.log('✅ HospitalsAdapter: Service Key 설정됨 (길이:', serviceKey.length, ')');
    } else {
      console.warn('⚠️ HospitalsAdapter: Service Key 미설정');
    }
  }

  /**
   * 행정안전부 시도 코드를 HIRA API 시도 코드로 변환
   * 프론트엔드에서 받은 행정안전부 코드(예: 26=부산)를 HIRA 코드(예: 21=부산)로 변환
   */
  convertSidoCodeToHIRA(sidoCode) {
    if (!sidoCode) {
      return null;
    }

    // 행정안전부 시도 코드 → HIRA 시도 코드 매핑 테이블
    // 주의: 행정안전부와 HIRA의 시도 코드 체계가 다릅니다!
    const sidoMap = {
      '11': '110000', // 서울특별시
      '21': '210000', // 부산광역시 (행정안전부에서는 26이지만 HIRA는 21)
      '26': '210000', // 부산광역시 (행정안전부 코드 26 → HIRA 코드 21)
      '27': '230000', // 대구광역시 (행정안전부 코드 27 → HIRA 코드 23)
      '28': '220000', // 인천광역시 (행정안전부 코드 28 → HIRA 코드 22)
      '29': '240000', // 광주광역시 (행정안전부 코드 29 → HIRA 코드 24)
      '30': '250000', // 대전광역시 (행정안전부 코드 30 → HIRA 코드 25)
      '31': '260000', // 울산광역시 (행정안전부 코드 31 → HIRA 코드 26)
      '36': '360000', // 세종특별자치시
      '41': '310000', // 경기도 (행정안전부 코드 41 → HIRA 코드 31)
      '43': '330000', // 충청북도 (행정안전부 코드 43 → HIRA 코드 33)
      '44': '340000', // 충청남도 (행정안전부 코드 44 → HIRA 코드 34)
      '45': '350000', // 전북특별자치도 (행정안전부 코드 45 → HIRA 코드 35)
      '46': '360000', // 전라남도 (행정안전부 코드 46 → HIRA 코드 36)
      '47': '370000', // 경상북도 (행정안전부 코드 47 → HIRA 코드 37)
      '48': '380000', // 경상남도 (행정안전부 코드 48 → HIRA 코드 38)
      '50': '390000', // 제주특별자치도 (행정안전부 코드 50 → HIRA 코드 39)
      '51': '320000', // 강원특별자치도 (행정안전부 코드 51 → HIRA 코드 32)
      '52': '350000', // 전북특별자치도 (행정안전부 코드 52 → HIRA 코드 35, 45와 동일)
    };

    const sidoStr = String(sidoCode).padStart(2, '0');
    const hiraCode = sidoMap[sidoStr];

    if (hiraCode) {
      console.log(`🔄 시도 코드 변환: ${sidoStr} (행정안전부) → ${hiraCode} (HIRA)`);
      return hiraCode;
    }

    // 매핑이 없으면 기본 변환 (하위 호환성)
    console.warn(`⚠️ 시도 코드 매핑 없음: ${sidoStr}, 기본 변환 사용`);
    return String(sidoCode).padEnd(6, '0');
  }

  /**
   * 행정안전부 시군구 코드를 HIRA API 코드로 변환
   * 프론트엔드에서 받은 행정안전부 코드(예: 111100)를 HIRA 코드(예: 110016)로 변환
   */
  convertSigunguCodeToHIRA(sigunguCode, sidoCode) {
    if (!sigunguCode || !sidoCode) {
      return null;
    }

    // 행정안전부 코드 → HIRA 코드 매핑 테이블
    // 형식: { '행정안전부코드': 'HIRA코드' }
    const codeMap = {
      // 서울특별시 (sido=11)
      '111100': '110016', // 종로구
      '111400': '110017', // 중구
      '111700': '110014', // 용산구
      '112000': '110011', // 성동구
      '112150': '110023', // 광진구
      '112300': '110007', // 동대문구
      '112600': '110019', // 중랑구
      '112900': '110012', // 성북구
      '113050': '110024', // 강북구
      '113200': '110006', // 도봉구
      '113500': '110022', // 노원구
      '113800': '110015', // 은평구
      '114100': '110010', // 서대문구
      '114400': '110009', // 마포구
      '114700': '110020', // 양천구
      '115000': '110003', // 강서구
      '115300': '110005', // 구로구
      '115450': '110025', // 금천구
      '115600': '110013', // 영등포구
      '115900': '110008', // 동작구
      '116200': '110004', // 관악구
      '116500': '110021', // 서초구
      '116800': '110001', // 강남구
      '117100': '110018', // 송파구
      '117400': '110002', // 강동구
      // 부산광역시 (sido=26, 행정안전부 코드)
      '261100': '210008', // 중구
      '261400': '210006', // 서구
      '261700': '210002', // 동구
      '262000': '210007', // 영도구
      '262300': '210004', // 부산진구
      '262600': '210003', // 동래구
      '262900': '210001', // 남구
      '263200': '210005', // 북구
      '263500': '210009', // 해운대구
      '263800': '210010', // 사하구
      '264100': '210011', // 금정구
      '264400': '210012', // 강서구
      '264700': '210013', // 연제구
      '265000': '210014', // 수영구
      '265300': '210015', // 사상구
      '267100': '210016', // 기장군
      // 울산광역시 (sido=31, 행정안전부 코드)
      '311100': '260003', // 중구
      '311400': '260001', // 남구
      '311700': '260002', // 동구
      '312000': '260004', // 북구
      '317100': '260005', // 울주군
      // 대구광역시 (sido=27, 행정안전부 코드 → HIRA sidoCd=230000)
      '271100': '230006', // 중구 (HIRA sgguCd=230006)
      '271400': '230002', // 동구 (HIRA sgguCd=230002)
      '271700': '230003', // 서구 (HIRA sgguCd=230003)
      '272000': '230004', // 남구 (HIRA sgguCd=230004)
      '272300': '230005', // 북구 (HIRA sgguCd=230005)
      '272600': '230007', // 수성구 (HIRA sgguCd=230007)
      '272900': '230008', // 달서구 (HIRA sgguCd=230008)
      '277100': '230009', // 달성군 (HIRA sgguCd=230009)
      '277200': '230010', // 군위군 (HIRA sgguCd=230010, 추정)
      // 인천광역시 (sido=28, 행정안전부 코드)
      '281100': '280001', // 중구
      '281400': '280002', // 동구
      '281770': '280003', // 미추홀구
      '281850': '280004', // 연수구
      '282000': '280005', // 남동구
      '282370': '280006', // 부평구
      '282450': '280007', // 계양구
      '282600': '280008', // 서구
      // 주의: 강화군과 옹진군은 HIRA API에서 제대로 필터링되지 않을 수 있음
      // '287100': '280009', // 강화군 (주석 처리 - HIRA API 문제로 인해 비활성화)
      // '287200': '280010', // 옹진군 (주석 처리 - HIRA API 문제로 인해 비활성화)
      // 광주광역시 (sido=29, 행정안전부 코드 → HIRA sidoCd=240000)
      '291100': '240001', // 동구 (HIRA sgguCd=240001)
      '291400': '240002', // 서구 (HIRA sgguCd=240002)
      '291550': '240003', // 남구 (HIRA sgguCd=240003)
      '291700': '240004', // 북구 (HIRA sgguCd=240004)
      '292000': '240005', // 광산구 (HIRA sgguCd=240005)
      // 대전광역시 (sido=30, 행정안전부 코드 → HIRA sidoCd=250000)
      '301100': '250004', // 동구 (HIRA sgguCd=250004)
      '301400': '250005', // 중구 (HIRA sgguCd=250005)
      '301700': '250003', // 서구 (HIRA sgguCd=250003)
      '302000': '250001', // 유성구 (HIRA sgguCd=250001)
      '302300': '250002', // 대덕구 (HIRA sgguCd=250002)
      // 세종특별자치시 (sido=36, 행정안전부 코드)
      // 주의: HIRA API에서 세종은 제대로 지원하지 않을 수 있음
      // '361100': '360001', // 세종시 (주석 처리 - HIRA API 문제로 인해 비활성화)
      // 제주특별자치도 (sido=50, 행정안전부 코드 → HIRA sidoCd=390000)
      '501100': '390200', // 제주시 (HIRA sgguCd=390200)
      '501300': '390100', // 서귀포시 (HIRA sgguCd=390100)
      // 경기도 주요 시군구 (sido=41, 행정안전부 코드)
      '413100': '311000', // 구리시
      // 추가 경기도 시군구는 실제 API 응답에서 확인 후 추가 필요
    };

    // 행정안전부 코드는 이미 전체 코드 (예: 111100)
    // 매핑 테이블에서 직접 찾기
    const fullCode = String(sigunguCode).padEnd(6, '0');
    const hiraCode = codeMap[fullCode];
    
    if (hiraCode) {
      console.log(`🔄 시군구 코드 변환: ${fullCode} (행정안전부) → ${hiraCode} (HIRA)`);
      return hiraCode;
    }

    // 매핑이 없으면 원본 코드 반환 (시도해볼 수 있음)
    // 하지만 HIRA API가 행정안전부 코드를 직접 인식하지 못할 수 있으므로,
    // 매핑이 없는 경우 null을 반환하여 시군구 필터를 사용하지 않도록 함
    console.warn(`⚠️ 시군구 코드 매핑 없음: ${fullCode}, 시군구 필터 비활성화`);
    return null; // null을 반환하면 시군구 필터를 사용하지 않음
  }

  /**
   * 병원 목록 조회
   */
  async getHospitals({ sido, sigungu, type }) {
    // Service Key 재확인 (런타임에 환경변수 다시 읽기) - 단일 API 키 사용
    const serviceKey = process.env.api_key || process.env.HIRA_SERVICE_KEY || this.serviceKey;
    
    if (!serviceKey) {
      console.warn('⚠️ Service Key가 없어 Mock 데이터를 반환합니다.');
      return this.formatResponse(this.getMockHospitals({ sido, sigungu, type }));
    }

    // Service Key를 임시로 설정
    this.serviceKey = serviceKey;
    console.log('✅ Service Key 확인됨, 실제 API 호출 시도...');

    try {
      const params = {};
      
      // 지역 필터 (공공데이터 API 파라미터명)
      // sido: 시도 코드 (2자리: 11=서울, 26=부산(행정안전부), 21=부산(HIRA))
      // 주의: 행정안전부 코드와 HIRA 코드 체계가 다릅니다!
      if (sido) {
        // 행정안전부 시도 코드를 HIRA 시도 코드로 변환
        const hiraSidoCode = this.convertSidoCodeToHIRA(sido);
        if (hiraSidoCode) {
          params.sidoCd = hiraSidoCode;
          console.log('📍 지역 필터 적용:', { sido, sidoCd: params.sidoCd });
        } else {
          // 변환 실패 시 기본 변환 사용 (하위 호환성)
          const sidoCode = String(sido).padEnd(6, '0');
          params.sidoCd = sidoCode;
          console.log('📍 지역 필터 적용 (기본 변환):', { sido, sidoCd: params.sidoCd });
        }
      }
      if (sigungu) {
        // 행정안전부 코드를 HIRA 코드로 변환
        const hiraSgguCd = this.convertSigunguCodeToHIRA(sigungu, sido);
        if (hiraSgguCd) {
          params.sgguCd = hiraSgguCd;
          console.log('📍 시군구 필터 적용:', { sigungu, sgguCd: params.sgguCd });
        } else {
          // 변환 실패 시 시군구 필터를 사용하지 않음
          // (HIRA API가 행정안전부 코드를 직접 인식하지 못하므로)
          console.warn('⚠️ 시군구 코드 매핑 실패, 시군구 필터 비활성화:', { sigungu, sido });
          // params.sgguCd를 설정하지 않음 = 시군구 필터 없이 검색
        }
      }

      // 의료기관 종별 필터
      // 주의: HIRA API의 clCd 코드 체계가 예상과 다를 수 있음
      // clCd=21은 실제로 "병원"으로 분류됨
      // 실제 의원은 clCdNm으로 필터링해야 할 수 있음
      if (type) {
        // HIRA API 실제 코드 체계 (API 응답 확인 결과):
        // 종합병원: 01, 병원: 11, 병원(소규모): 21, 요양병원: 31, 치과: 41, 한의원: 51
        // 주의: clCd=21은 "병원"으로 분류되므로, 의원은 clCdNm으로 필터링 필요
        const typeMap = {
          '종합병원': '01',
          '병원': '11',
          '의원': null, // clCd로 필터링 불가, clCdNm으로 필터링 필요
          '요양병원': '31',
          '치과': '41',
          '한의원': '51',
        };
        
        // 여러 종별이 쉼표로 구분된 경우 처리
        if (type.includes(',')) {
          const types = type.split(',').map(t => t.trim());
          // HIRA API는 단일 clCd만 지원하므로, 첫 번째 종별만 사용
          const firstType = types[0];
          const clCd = typeMap[firstType];
          if (clCd) {
            params.clCd = clCd;
          }
          console.log(`📍 여러 종별 선택됨: ${types.join(', ')}, 첫 번째 종별만 적용: ${firstType}`);
        } else {
          const clCd = typeMap[type];
          if (clCd) {
            params.clCd = clCd;
          }
          // 의원의 경우 clCd로 필터링하지 않고, 나중에 clCdNm으로 필터링
        }
      }

      // 페이지네이션을 위한 전체 데이터 수집
      let allHospitals = [];
      let pageNo = 1;
      const pageSize = 100;
      let totalCount = Infinity;
      let hasMore = true;

      while (hasMore && pageNo <= 50) { // 최대 50페이지 (5000개 병원)
        params.pageNo = pageNo;
        params.numOfRows = pageSize;

        console.log(`📡 병원 목록 API 호출 파라미터 (페이지 ${pageNo}):`, { ...params, serviceKey: '***' });
        const result = await this.fetchAPI(this.apiEndpoint, params);

        console.log(`📡 API 응답 (페이지 ${pageNo}):`, result.ok ? '성공' : '실패', result.error?.message || '');

        // API 호출 실패 시
        if (!result.ok) {
          if (pageNo === 1) {
            // 첫 페이지 실패 시 Mock 데이터 반환
            console.warn('⚠️ API 호출 실패, Mock 데이터 반환:', result.error?.message);
            return this.formatResponse(this.getMockHospitals({ sido, sigungu, type }));
          }
          // 이후 페이지 실패 시 기존 데이터 반환
          break;
        }

        // 데이터가 없는 경우
        if (!result.data || result.data.length === 0) {
          if (pageNo === 1) {
            console.warn('⚠️ API 응답에 데이터가 없습니다. Mock 데이터 반환');
            return this.formatResponse(this.getMockHospitals({ sido, sigungu, type }));
          }
          break;
        }

        // totalCount 업데이트 (첫 페이지에서만 또는 업데이트가 필요한 경우)
        if (result.meta?.total) {
          const newTotalCount = Number(result.meta.total);
          if (newTotalCount > 0 && (totalCount === Infinity || newTotalCount !== totalCount)) {
            totalCount = newTotalCount;
            console.log(`📊 총 병원 수: ${totalCount}개`);
          }
        }

        // API 응답을 표준 형식으로 변환
        // 디버깅: 첫 번째 항목의 원본 데이터 확인
        if (result.data && result.data.length > 0 && pageNo === 1) {
          console.log(`🔍 [디버깅] 첫 번째 항목 원본 데이터 필드명:`, Object.keys(result.data[0]).slice(0, 15).join(', '));
          console.log(`🔍 [디버깅] 첫 번째 항목 clCdNm:`, result.data[0].clCdNm);
          console.log(`🔍 [디버깅] 첫 번째 항목 clCd:`, result.data[0].clCd);
        }
        const hospitals = this.transformHospitalData(result.data);
        allHospitals = allHospitals.concat(hospitals);
        
        console.log(`📄 페이지 ${pageNo}: ${hospitals.length}개 병원 수집 (누적: ${allHospitals.length}개)`);

        // 마지막 페이지 확인
        if (hospitals.length < pageSize || (totalCount !== Infinity && allHospitals.length >= totalCount)) {
          hasMore = false;
          console.log(`✅ 페이지네이션 완료: 총 ${allHospitals.length}개 병원 수집`);
        } else {
          pageNo += 1;
        }
      }

      // 의원 필터링: clCdNm으로 필터링 (clCd=21은 실제로 "병원"이므로)
      if (type === '의원' || (type && type.includes('의원'))) {
        allHospitals = allHospitals.filter((h) => {
          // clCdNm이 정확히 "의원"인 경우만 필터링
          return h.clCdNm === '의원';
        });
        console.log(`📍 의원 필터링 적용: ${allHospitals.length}개 의원 (clCdNm="의원"만)`);
      }
      
      // 한의원 필터링: clCd=51은 실제로 "치과의원"이므로 clCdNm으로 필터링
      // clCd로 검색하지 않고 전체 검색 후 clCdNm으로 필터링
      if (type === '한의원' || (type && type.includes('한의원'))) {
        // clCd=51로 검색하지 않았으므로 (typeMap에서 null), 전체 검색 결과에서 필터링
        const beforeCount = allHospitals.length;
        allHospitals = allHospitals.filter((h) => {
          // clCdNm이 "한의원" 또는 "한방병원"인 경우 필터링
          return h.clCdNm === '한의원' || h.clCdNm === '한방병원';
        });
        if (beforeCount > 0) {
          console.log(`📍 한의원 필터링 적용: ${allHospitals.length}개 한의원 (${beforeCount}개 → ${allHospitals.length}개, clCdNm="한의원" 또는 "한방병원")`);
        }
      }
      
      // 종합병원 필터링: clCd=01로 검색했을 때 결과가 없는 경우를 대비
      // clCdNm으로 추가 필터링하여 정확도 향상 (clCd=01로 검색했어도 clCdNm 확인)
      if (type === '종합병원' || (type && type.includes('종합병원'))) {
        const beforeCount = allHospitals.length;
        allHospitals = allHospitals.filter((h) => {
          // clCdNm이 없으면 통과 (clCd=01로 이미 필터링됨)
          if (!h.clCdNm) return true;
          // clCdNm이 "종합병원" 또는 "상급종합"인 경우만 필터링
          return h.clCdNm === '종합병원' || h.clCdNm === '상급종합';
        });
        if (beforeCount > 0 && beforeCount !== allHospitals.length) {
          console.log(`📍 종합병원 필터링 적용: ${allHospitals.length}개 종합병원 (${beforeCount}개 → ${allHospitals.length}개)`);
        }
      }

      console.log(`✅ 실제 API 데이터 반환: ${allHospitals.length}개 병원 (총 ${totalCount}개 중)`);
      return this.formatResponse(allHospitals, { total: String(totalCount), page: '1', limit: String(allHospitals.length) });
    } catch (error) {
      console.warn('⚠️ API 호출 실패, Mock 데이터 반환:', error.message);
      return this.formatResponse(this.getMockHospitals({ sido, sigungu, type }));
    }
  }

  /**
   * API 응답 데이터를 표준 형식으로 변환
   */
  transformHospitalData(apiData) {
    if (!Array.isArray(apiData)) {
      return [];
    }

    return apiData.map((item) => {
      // XML 파싱 후 데이터 구조에 맞게 필드 매핑
      // 공공데이터 API XML 응답 필드명 확인 필요
      return {
        // ykiho는 암호화된 요양기호로, 비급여 가격 API에서 필수 파라미터로 사용됨
        id: item.ykiho || item.hospCd || item.ykihoEncpt || `hosp_${Date.now()}_${Math.random()}`,
        name: item.yadmNm || item.hospNm || item.yadmNm || '병원명 없음',
        address: item.addr || item.roadAddr || item.addr || '',
        // 종별 매핑: clCdNm (종별명) 우선, 없으면 clCd (숫자 코드) 사용
        // clCdNm이 있으면 그대로 사용하여 정확한 종별 매핑
        type: item.clCdNm ? this.mapHospitalType(item.clCdNm) : this.mapHospitalType(item.clCd || item.hospTyCd),
        departments: this.parseDepartments(item.dgsbjtCd || item.deptCd),
        phone: item.telno || item.tel || item.telno || '',
        rating: item.evalScore ? parseFloat(item.evalScore) : undefined,
        // 추가 필드 (XML 응답에서 확인된 필드)
        sidoCd: item.sidoCd,
        sgguCd: item.sgguCd,
        clCdNm: item.clCdNm, // 의료기관 종별명 (예: "상급종합")
        // ykiho를 별도로 저장 (비급여 가격 API에서 사용)
        ykiho: item.ykiho, // 암호화된 요양기호
      };
    });
  }

  /**
   * 병원 종별 코드를 텍스트로 변환
   * 
   * @param {string} code - 종별 코드 (숫자: "01", "11" 등) 또는 종별명 (문자열: "종합병원", "요양병원" 등)
   * @returns {string} 표준화된 종별명
   */
  mapHospitalType(code) {
    if (!code) {
      return '병원';
    }

    const codeStr = String(code).trim();
    
    // 숫자 코드 매핑 (clCd 필드)
    const codeMap = {
      '01': '종합병원',
      '11': '병원',
      '21': '의원',
      '31': '요양병원',
      '41': '치과',
      '51': '한의원',
    };
    
    // 숫자 코드인 경우
    if (codeMap[codeStr]) {
      return codeMap[codeStr];
    }
    
    // 문자열 종별명인 경우 (clCdNm 필드)
    const nameMap = {
      '종합병원': '종합병원',
      '상급종합': '종합병원', // 상급종합병원도 종합병원으로 처리
      '병원': '병원',
      '의원': '의원',
      '요양병원': '요양병원',
      '치과': '치과',
      '한의원': '한의원',
      '한방병원': '한의원', // 한방병원도 한의원으로 처리
    };
    
    // 정확한 매칭
    if (nameMap[codeStr]) {
      return nameMap[codeStr];
    }
    
    // 부분 매칭 (예: "요양병원"이 포함된 경우)
    const lowerCode = codeStr.toLowerCase();
    if (lowerCode.includes('종합') || lowerCode.includes('상급')) {
      return '종합병원';
    }
    if (lowerCode.includes('요양')) {
      return '요양병원';
    }
    if (lowerCode.includes('한의') || lowerCode.includes('한방')) {
      return '한의원';
    }
    if (lowerCode.includes('치과')) {
      return '치과';
    }
    if (lowerCode.includes('의원')) {
      return '의원';
    }
    if (lowerCode.includes('병원')) {
      return '병원';
    }
    
    // 기본값
    return '병원';
  }

  /**
   * 진료과 코드 파싱
   */
  parseDepartments(deptCode) {
    if (!deptCode) return [];
    // 코드를 배열로 변환 (실제 형식에 따라 조정 필요)
    return Array.isArray(deptCode) ? deptCode : [deptCode];
  }

  /**
   * Mock 병원 데이터 (API 실패 시 사용)
   */
  getMockHospitals({ sido, sigungu, type }) {
    // 지역별 Mock 데이터
    const mockHospitalsByRegion = {
      '11': [ // 서울특별시
        {
          id: 'hosp_001',
          name: '서울대학교병원',
          address: '서울특별시 종로구 대학로 101',
          type: '종합병원',
          departments: ['내과', '외과', '정형외과'],
          phone: '02-2072-2114',
          rating: 4.8,
        },
        {
          id: 'hosp_002',
          name: '세브란스병원',
          address: '서울특별시 서대문구 연세로 50-1',
          type: '종합병원',
          departments: ['내과', '외과', '산부인과'],
          phone: '02-2228-5800',
          rating: 4.7,
        },
        {
          id: 'hosp_003',
          name: '삼성서울병원',
          address: '서울특별시 강남구 일원로 81',
          type: '종합병원',
          departments: ['내과', '외과', '정형외과', '신경외과'],
          phone: '02-3410-2114',
          rating: 4.9,
        },
      ],
      '28': [ // 인천광역시
        {
          id: 'hosp_028_001',
          name: '인천성모병원',
          address: '인천광역시 미추홀구 경인로 365',
          type: '종합병원',
          departments: ['내과', '외과', '정형외과'],
          phone: '032-280-5000',
          rating: 4.6,
        },
        {
          id: 'hosp_028_002',
          name: '가톨릭의과학대학교 인천성모병원',
          address: '인천광역시 미추홀구 인하로 100',
          type: '종합병원',
          departments: ['내과', '외과', '산부인과'],
          phone: '032-890-1114',
          rating: 4.5,
        },
        {
          id: 'hosp_028_003',
          name: '인천광역시의료원',
          address: '인천광역시 남동구 구월로 120',
          type: '종합병원',
          departments: ['내과', '외과', '정형외과', '신경외과'],
          phone: '032-460-3114',
          rating: 4.4,
        },
      ],
      '26': [ // 부산광역시
        {
          id: 'hosp_026_001',
          name: '부산대학교병원',
          address: '부산광역시 양산시 물금읍 금오로 20',
          type: '종합병원',
          departments: ['내과', '외과', '정형외과'],
          phone: '055-360-2000',
          rating: 4.7,
        },
        {
          id: 'hosp_026_002',
          name: '부산아산병원',
          address: '부산광역시 해운대구 아산병원길 26',
          type: '종합병원',
          departments: ['내과', '외과', '산부인과'],
          phone: '051-610-5114',
          rating: 4.6,
        },
      ],
      '41': [ // 경기도
        {
          id: 'hosp_041_001',
          name: '분당서울대학교병원',
          address: '경기도 성남시 분당구 구미로 173번길 82',
          type: '종합병원',
          departments: ['내과', '외과', '정형외과'],
          phone: '031-787-7000',
          rating: 4.8,
        },
        {
          id: 'hosp_041_002',
          name: '아산병원',
          address: '경기도 성남시 분당구 아산로 88',
          type: '종합병원',
          departments: ['내과', '외과', '산부인과'],
          phone: '031-787-7000',
          rating: 4.7,
        },
      ],
    };

    // 지역별 데이터 선택
    let hospitals = [];
    if (sido && mockHospitalsByRegion[sido]) {
      hospitals = mockHospitalsByRegion[sido];
    } else if (sido) {
      // 해당 지역에 Mock 데이터가 없으면 빈 배열 반환
      hospitals = [];
    } else {
      // sido가 없으면 모든 지역 데이터 합치기 (기본값)
      hospitals = Object.values(mockHospitalsByRegion).flat();
    }

    // 시군구 필터링 (주소에서 시군구 확인)
    if (sigungu && hospitals.length > 0) {
      // 시군구 코드를 이름으로 변환 (지역별 매핑)
      // 서울: 110(종로구), 140(중구), 170(용산구), 200(성동구), 215(광진구), 230(동대문구), 260(중랑구), 290(성북구), 305(강북구), 320(도봉구), 350(노원구), 380(은평구), 410(서대문구), 440(마포구), 470(양천구), 500(강서구), 530(구로구), 545(금천구), 560(영등포구), 590(동작구), 620(관악구), 650(서초구), 680(강남구), 710(송파구), 740(강동구)
      // 인천: 110(중구), 140(동구), 170(미추홀구), 200(연수구), 237(남동구), 245(부평구), 260(계양구), 280(서구), 310(강화군), 320(옹진군)
      const sigunguNameMap = {
        // 서울
        '110': '종로구', '140': '중구', '170': '용산구', '200': '성동구',
        '215': '광진구', '230': '동대문구', '260': '중랑구', '290': '성북구',
        '305': '강북구', '320': '도봉구', '350': '노원구', '380': '은평구',
        '410': '서대문구', '440': '마포구', '470': '양천구', '500': '강서구',
        '530': '구로구', '545': '금천구', '560': '영등포구', '590': '동작구',
        '620': '관악구', '650': '서초구', '680': '강남구', '710': '송파구',
        '740': '강동구',
        // 인천
        '280110': '중구', '280140': '동구', '280170': '미추홀구', '280200': '연수구',
        '280237': '남동구', '280245': '부평구', '280260': '계양구', '280280': '서구',
        '280310': '강화군', '280320': '옹진군',
      };
      
      // 시군구 코드가 sido 코드를 포함하는 경우 (예: 280110)와 포함하지 않는 경우 (예: 110) 처리
      let sigunguName = sigunguNameMap[sigungu] || sigunguNameMap[`${sido}${sigungu}`];
      
      if (sigunguName) {
        hospitals = hospitals.filter((h) => h.address.includes(sigunguName));
      } else {
        // 매핑이 없으면 시군구 코드로 직접 필터링하지 않음 (전체 표시)
        console.warn(`⚠️ 시군구 코드 ${sigungu}에 대한 매핑이 없습니다.`);
      }
    }

    // 의료기관 종별 필터링
    if (type) {
      hospitals = hospitals.filter((h) => h.type === type);
    }

    return hospitals;
  }
}

export const hospitalsAdapter = new HospitalsAdapter();
