/**
 * 시군구 코드 매핑 테이블 자동 생성 스크립트
 * 행정안전부 시군구 코드를 HIRA API 코드로 변환하는 매핑 테이블 생성
 */

import dotenv from 'dotenv';
import { regionsAdapter } from '../src/adapters/regionsAdapter.js';
import { BaseAdapter } from '../src/adapters/baseAdapter.js';

dotenv.config();

const serviceKey = process.env.api_key || '';
const baseAdapter = new BaseAdapter('HIRA', serviceKey);

/**
 * HIRA API에서 시군구 코드로 병원 검색하여 실제 코드 확인
 */
async function findHIRACode(sidoCd, sgguName) {
  // HIRA API는 시군구 이름으로 직접 검색할 수 없으므로,
  // 모든 가능한 시군구 코드를 시도해봐야 합니다.
  // 하지만 이건 너무 많은 API 호출이 필요하므로,
  // 실제 API 응답에서 sgguCdNm을 확인하는 방법을 사용합니다.
  
  // 시군구 코드 범위: sidoCd + 001 ~ 999
  for (let i = 1; i <= 999; i++) {
    const sgguCd = `${sidoCd}${String(i).padStart(3, '0')}`;
    try {
      const url = `https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList`;
      const params = new URLSearchParams({
        serviceKey: serviceKey,
        sidoCd: sidoCd,
        sgguCd: sgguCd,
        pageNo: '1',
        numOfRows: '1',
      });

      const response = await fetch(`${url}?${params.toString()}`);
      const text = await response.text();
      
      // XML 파싱
      const sgguCdNmMatch = text.match(/<sgguCdNm>(.*?)<\/sgguCdNm>/);
      const totalCountMatch = text.match(/<totalCount>(\d+)<\/totalCount>/);
      
      if (sgguCdNmMatch && totalCountMatch && parseInt(totalCountMatch[1], 10) > 0) {
        const foundName = sgguCdNmMatch[1];
        // 이름이 일치하는지 확인 (부산동구 vs 부산동구 등)
        if (foundName.includes(sgguName.replace('광역시', '').replace('특별시', '').replace('특별자치시', '').trim())) {
          return sgguCd;
        }
      }
    } catch (error) {
      // 에러 무시하고 계속
    }
    
    // API 호출 제한을 피하기 위해 짧은 딜레이
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return null;
}

/**
 * 모든 시도의 시군구 코드 매핑 생성
 */
async function generateMapping() {
  const sidoList = [
    { code: '11', name: '서울특별시', hiraCode: '110000' },
    { code: '26', name: '부산광역시', hiraCode: '210000' },
    { code: '27', name: '대구광역시', hiraCode: '270000' },
    { code: '28', name: '인천광역시', hiraCode: '280000' },
    { code: '29', name: '광주광역시', hiraCode: '290000' },
    { code: '30', name: '대전광역시', hiraCode: '300000' },
    { code: '31', name: '울산광역시', hiraCode: '260000' },
    { code: '36', name: '세종특별자치시', hiraCode: '360000' },
    { code: '41', name: '경기도', hiraCode: '310000' },
  ];

  const mapping = {};

  for (const sido of sidoList) {
    console.log(`\n=== ${sido.name} (${sido.code}) ===`);
    
    try {
      const sigunguList = await regionsAdapter.getSigunguList(sido.code);
      const sigungus = sigunguList.data || [];
      
      console.log(`시군구 ${sigungus.length}개 발견`);
      
      for (const sigungu of sigungus.slice(0, 20)) { // 처음 20개만 테스트
        const adminCode = sigungu.code;
        const name = sigungu.name;
        
        // HIRA 코드 찾기
        const hiraCode = await findHIRACode(sido.hiraCode, name);
        
        if (hiraCode) {
          mapping[adminCode] = hiraCode;
          console.log(`  ${adminCode} (${name}) -> ${hiraCode}`);
        } else {
          console.log(`  ${adminCode} (${name}) -> 매핑 실패`);
        }
        
        // API 호출 제한을 피하기 위해 딜레이
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`에러: ${error.message}`);
    }
  }

  console.log('\n=== 생성된 매핑 테이블 ===');
  console.log(JSON.stringify(mapping, null, 2));
}

// 스크립트 실행
generateMapping().catch(console.error);

