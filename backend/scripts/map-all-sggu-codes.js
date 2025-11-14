/**
 * 모든 시도의 시군구 코드 매핑 생성 스크립트
 * 행정안전부 코드와 HIRA 코드를 매칭
 */

import dotenv from 'dotenv';
import { regionsAdapter } from '../src/adapters/regionsAdapter.js';

dotenv.config();

const serviceKey = process.env.api_key || '';
const key = encodeURIComponent(serviceKey);

/**
 * HIRA API에서 시군구 코드와 이름 추출
 */
async function getHIRASgguCodes(sidoHiraCode) {
  const sgguMap = new Map();
  
  // 여러 페이지에서 데이터 수집
  for (let page = 1; page <= 5; page++) {
    try {
      const url = `https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList?serviceKey=${key}&sidoCd=${sidoHiraCode}&pageNo=${page}&numOfRows=100`;
      const response = await fetch(url);
      const text = await response.text();
      
      // XML 파싱
      const sgguCdMatches = text.matchAll(/<sgguCd>(.*?)<\/sgguCd>/g);
      const sgguCdNmMatches = text.matchAll(/<sgguCdNm>(.*?)<\/sgguCdNm>/g);
      
      const sgguCds = Array.from(sgguCdMatches).map(m => m[1]);
      const sgguCdNms = Array.from(sgguCdNmMatches).map(m => m[1]);
      
      for (let i = 0; i < sgguCds.length && i < sgguCdNms.length; i++) {
        const code = sgguCds[i];
        const name = sgguCdNms[i];
        if (code && name && code !== '0' && name !== '') {
          sgguMap.set(code, name);
        }
      }
      
      // totalCount 확인
      const totalMatch = text.match(/<totalCount>(\d+)<\/totalCount>/);
      if (totalMatch && parseInt(totalMatch[1], 10) <= page * 100) {
        break; // 마지막 페이지
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`페이지 ${page} 에러:`, error.message);
    }
  }
  
  return sgguMap;
}

/**
 * 행정안전부 코드와 HIRA 코드 매칭
 */
async function matchCodes(adminCode, hiraName, hiraSgguMap) {
  // 이름에서 시도명 제거
  const cleanName = hiraName
    .replace(/^.*?광역시\s*/, '')
    .replace(/^.*?특별시\s*/, '')
    .replace(/^.*?특별자치시\s*/, '')
    .replace(/^.*?도\s*/, '')
    .trim();
  
  // HIRA 맵에서 매칭 찾기
  for (const [hiraCode, hiraName] of hiraSgguMap.entries()) {
    const hiraClean = hiraName
      .replace(/^.*?광역시\s*/, '')
      .replace(/^.*?특별시\s*/, '')
      .replace(/^.*?특별자치시\s*/, '')
      .trim();
    
    if (hiraClean === cleanName || hiraClean.includes(cleanName) || cleanName.includes(hiraClean)) {
      return hiraCode;
    }
  }
  
  return null;
}

/**
 * 시도별 시군구 매핑 생성
 */
async function generateAllMappings() {
  const sidoList = [
    { adminCode: '27', hiraCode: '270000', name: '대구광역시' },
    { adminCode: '28', hiraCode: '280000', name: '인천광역시' },
    { adminCode: '29', hiraCode: '290000', name: '광주광역시' },
    { adminCode: '30', hiraCode: '300000', name: '대전광역시' },
    { adminCode: '36', hiraCode: '360000', name: '세종특별자치시' },
  ];

  const allMappings = {};

  for (const sido of sidoList) {
    console.log(`\n=== ${sido.name} (${sido.adminCode}) ===`);
    
    try {
      // HIRA 시군구 코드 수집
      console.log('HIRA 시군구 코드 수집 중...');
      const hiraSgguMap = await getHIRASgguCodes(sido.hiraCode);
      console.log(`HIRA 시군구 ${hiraSgguMap.size}개 발견`);
      
      // 행정안전부 시군구 목록 가져오기
      const sigunguList = await regionsAdapter.getSigunguList(sido.adminCode);
      const sigungus = sigunguList.data || [];
      console.log(`행정안전부 시군구 ${sigungus.length}개 발견`);
      
      // 매칭
      for (const sigungu of sigungus) {
        const adminCode = sigungu.code;
        const name = sigungu.name;
        
        const hiraCode = await matchCodes(adminCode, name, hiraSgguMap);
        
        if (hiraCode) {
          allMappings[adminCode] = hiraCode;
          console.log(`  ${adminCode} (${name}) -> ${hiraCode}`);
        } else {
          console.log(`  ${adminCode} (${name}) -> 매핑 실패`);
        }
      }
    } catch (error) {
      console.error(`에러: ${error.message}`);
    }
  }

  console.log('\n=== 최종 매핑 테이블 ===');
  console.log(JSON.stringify(allMappings, null, 2));
  
  // JavaScript 코드 형식으로 출력
  console.log('\n=== JavaScript 코드 형식 ===');
  const entries = Object.entries(allMappings)
    .map(([k, v]) => `      '${k}': '${v}',`)
    .join('\n');
  console.log(entries);
}

// 실행
generateAllMappings().catch(console.error);

