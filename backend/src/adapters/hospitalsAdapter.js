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
      // sido: 시도 코드 (2자리: 11=서울, 26=부산, 28=인천, 41=경기)
      // API는 6자리 코드를 요구하므로 변환 필요 (예: 11 → 110000)
      if (sido) {
        // 2자리 코드를 6자리로 변환 (예: "11" → "110000")
        const sidoCode = String(sido).padEnd(6, '0');
        params.sidoCd = sidoCode;
        console.log('📍 지역 필터 적용:', { sido, sidoCd: params.sidoCd });
      }
      if (sigungu) {
        // 시군구 코드도 6자리로 변환 (예: "110" → "110000")
        const sigunguCode = String(sigungu).padEnd(6, '0');
        params.sgguCd = sigunguCode;
        console.log('📍 시군구 필터 적용:', { sigungu, sgguCd: params.sgguCd });
      }

      // 의료기관 종별 필터
      if (type) {
        // 종합병원: 01, 병원: 11, 의원: 21, 요양병원: 31, 치과: 41, 한의원: 51
        const typeMap = {
          '종합병원': '01',
          '병원': '11',
          '의원': '21',
          '요양병원': '31',
          '치과': '41',
          '한의원': '51',
        };
        params.clCd = typeMap[type] || type;
      }

      console.log('📡 병원 목록 API 호출 파라미터:', { ...params, serviceKey: '***' });
      const result = await this.fetchAPI(this.apiEndpoint, params);

      console.log('📡 API 응답:', result.ok ? '성공' : '실패', result.error?.message || '');

      // API 호출 실패 시 Mock 데이터 사용
      if (!result.ok) {
        console.warn('⚠️ API 호출 실패, Mock 데이터 반환:', result.error?.message);
        return this.formatResponse(this.getMockHospitals({ sido, sigungu, type }));
      }

      // 데이터가 없는 경우 (totalCount=0 등)
      if (!result.data || result.data.length === 0) {
        console.warn('⚠️ API 응답에 데이터가 없습니다. Mock 데이터 반환');
        return this.formatResponse(this.getMockHospitals({ sido, sigungu, type }));
      }

      // API 응답을 표준 형식으로 변환
      const hospitals = this.transformHospitalData(result.data);
      console.log(`✅ 실제 API 데이터 반환: ${hospitals.length}개 병원`);
      return this.formatResponse(hospitals, result.meta);
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
        id: item.ykiho || item.hospCd || item.ykihoEncpt || `hosp_${Date.now()}_${Math.random()}`,
        name: item.yadmNm || item.hospNm || item.yadmNm || '병원명 없음',
        address: item.addr || item.roadAddr || item.addr || '',
        type: this.mapHospitalType(item.clCd || item.hospTyCd || item.clCdNm),
        departments: this.parseDepartments(item.dgsbjtCd || item.deptCd),
        phone: item.telno || item.tel || item.telno || '',
        rating: item.evalScore ? parseFloat(item.evalScore) : undefined,
        // 추가 필드 (XML 응답에서 확인된 필드)
        sidoCd: item.sidoCd,
        sgguCd: item.sgguCd,
        clCdNm: item.clCdNm, // 의료기관 종별명 (예: "상급종합")
      };
    });
  }

  /**
   * 병원 종별 코드를 텍스트로 변환
   */
  mapHospitalType(code) {
    const typeMap = {
      '01': '종합병원',
      '11': '병원',
      '21': '의원',
      '31': '요양병원',
      '41': '치과',
      '51': '한의원',
    };
    return typeMap[code] || '병원';
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
