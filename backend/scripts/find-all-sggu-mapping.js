/**
 * 모든 시도의 시군구 코드를 HIRA API 코드로 매핑하는 스크립트
 */

import dotenv from 'dotenv';
import { regionsAdapter } from '../src/adapters/regionsAdapter.js';

dotenv.config();

const serviceKey = process.env.api_key || '';
const key = encodeURIComponent(serviceKey);

/**
 * HIRA API에서 시군구 코드 찾기
 */
async function findHIRASgguCode(sidoHiraCode, sgguName) {
  // 시군구 이름에서 시도명 제거
  const cleanName = sgguName
    .replace(/^.*?광역시\s*/, '')
    .replace(/^.*?특별시\s*/, '')
    .replace(/^.*?특별자치시\s*/, '')
    .replace(/^.*?도\s*/, '')
    .trim();

  // HIRA API에서 시군구 코드 범위 검색 (001~999)
  for (let i = 1; i <= 999; i++) {
    const sgguCd = `${sidoHiraCode.slice(0, 2)}${String(i).padStart(3, '0')}`;
    
    try {
      const url = `https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList?serviceKey=${key}&sidoCd=${sidoHiraCode}&sgguCd=${sgguCd}&pageNo=1&numOfRows=1`;
      const response = await fetch(url);
      const text = await response.text();
      
      const sgguCdNmMatch = text.match(/<sgguCdNm>(.*?)<\/sgguCdNm>/);
      const totalMatch = text.match(/<totalCount>(\d+)<\/totalCount>/);
      
      if (sgguCdNmMatch && totalMatch && parseInt(totalMatch[1], 10) > 0) {
        const foundName = sgguCdNmMatch[1];
        // 이름 매칭 (예: "부산동구" vs "동구")
        const foundClean = foundName.replace(/^.*?광역시\s*/, '').replace(/^.*?특별시\s*/, '').trim();
        
        if (foundClean === cleanName || foundName.includes(cleanName) || cleanName.includes(foundClean)) {
          return sgguCd;
        }
      }
    } catch (error) {
      // 에러 무시
    }
    
    // API 호출 제한을 피하기 위해 딜레이
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return null;
}

/**
 * 시도별 시군구 매핑 생성
 */
async function generateSgguMapping() {
  const sidoList = [
    { adminCode: '11', hiraCode: '110000', name: '서울특별시' },
    { adminCode: '26', hiraCode: '210000', name: '부산광역시' },
    { adminCode: '27', hiraCode: '270000', name: '대구광역시' },
    { adminCode: '28', hiraCode: '280000', name: '인천광역시' },
    { adminCode: '29', hiraCode: '290000', name: '광주광역시' },
    { adminCode: '30', hiraCode: '300000', name: '대전광역시' },
    { adminCode: '31', hiraCode: '260000', name: '울산광역시' },
    { adminCode: '36', hiraCode: '360000', name: '세종특별자치시' },
    { adminCode: '41', hiraCode: '310000', name: '경기도' },
  ];

  const allMappings = {};

  for (const sido of sidoList) {
    console.log(`\n=== ${sido.name} (${sido.adminCode}) ===`);
    
    try {
      const sigunguList = await regionsAdapter.getSigunguList(sido.adminCode);
      const sigungus = sigunguList.data || [];
      
      console.log(`시군구 ${sigungus.length}개 발견`);
      
      for (const sigungu of sigungus) {
        const adminCode = sigungu.code;
        const name = sigungu.name;
        
        const hiraCode = await findHIRASgguCode(sido.hiraCode, name);
        
        if (hiraCode) {
          allMappings[adminCode] = hiraCode;
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
generateSgguMapping().catch(console.error);

