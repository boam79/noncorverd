/**
 * 모든 시도의 HIRA API 코드 검증 스크립트
 * 실제 API 응답을 확인하여 올바른 sidoCd를 찾습니다.
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SERVICE_KEY = process.env.api_key || process.env.HIRA_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ Service Key가 설정되지 않았습니다.');
  process.exit(1);
}

// 시도 코드와 이름 매핑
const sidoList = [
  { code: '11', name: '서울특별시', currentHira: '110000' },
  { code: '26', name: '부산광역시', currentHira: '210000' },
  { code: '27', name: '대구광역시', currentHira: '270000' },
  { code: '28', name: '인천광역시', currentHira: '280000' },
  { code: '29', name: '광주광역시', currentHira: '290000' },
  { code: '30', name: '대전광역시', currentHira: '250000' },
  { code: '31', name: '울산광역시', currentHira: '260000' },
  { code: '36', name: '세종특별자치시', currentHira: '360000' },
  { code: '41', name: '경기도', currentHira: '310000' },
  { code: '43', name: '충청북도', currentHira: '430000' },
  { code: '44', name: '충청남도', currentHira: '440000' },
  { code: '45', name: '전북특별자치도', currentHira: '520000' },
  { code: '46', name: '전라남도', currentHira: '460000' },
  { code: '47', name: '경상북도', currentHira: '470000' },
  { code: '48', name: '경상남도', currentHira: '480000' },
  { code: '50', name: '제주특별자치도', currentHira: '500000' },
  { code: '51', name: '강원특별자치도', currentHira: '510000' },
];

// 검색 키워드 (병원명으로 검색하여 실제 sidoCd 확인)
const searchKeywords = {
  '27': '대구',
  '28': '인천',
  '29': '광주',
  '43': '청주',
  '44': '천안',
  '45': '전주',
  '46': '목포',
  '47': '포항',
  '48': '창원',
  '50': '제주',
  '51': '춘천',
};

async function checkSidoCode(sido) {
  const { code, name, currentHira } = sido;
  
  console.log(`\n📍 ${name} (${code})`);
  console.log(`   현재 HIRA 코드: ${currentHira}`);
  
  // 1. 현재 코드로 검색
  try {
    const url = new URL('https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList');
    url.searchParams.set('serviceKey', SERVICE_KEY);
    url.searchParams.set('sidoCd', currentHira);
    url.searchParams.set('numOfRows', '5');
    url.searchParams.set('pageNo', '1');
    
    const response = await axios.get(url.toString(), {
      responseType: 'text',
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
    
    const totalCountMatch = response.data.match(/<totalCount>(\d+)<\/totalCount>/);
    const totalCount = totalCountMatch ? parseInt(totalCountMatch[1]) : 0;
    
    if (totalCount > 0) {
      console.log(`   ✅ 현재 코드 정상: 병원 수 ${totalCount}개`);
      return { code, name, hiraCode: currentHira, count: totalCount, status: 'ok' };
    } else {
      console.log(`   ⚠️  현재 코드로 검색 결과 없음 (병원 수: 0)`);
    }
  } catch (error) {
    console.log(`   ❌ API 호출 오류: ${error.message}`);
  }
  
  // 2. 병원명으로 검색하여 실제 sidoCd 확인
  const keyword = searchKeywords[code];
  if (keyword) {
    try {
      const encodedKeyword = encodeURIComponent(keyword);
      const url = new URL('https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList');
      url.searchParams.set('serviceKey', SERVICE_KEY);
      url.searchParams.set('yadmNm', encodedKeyword);
      url.searchParams.set('numOfRows', '3');
      url.searchParams.set('pageNo', '1');
      
      const response = await axios.get(url.toString(), {
        responseType: 'text',
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });
      
      const sidoCdMatch = response.data.match(/<sidoCd>(\d+)<\/sidoCd>/);
      const sidoCdNmMatch = response.data.match(/<sidoCdNm>([^<]+)<\/sidoCdNm>/);
      const totalCountMatch = response.data.match(/<totalCount>(\d+)<\/totalCount>/);
      
      if (sidoCdMatch) {
        const actualHiraCode = sidoCdMatch[1];
        const sidoCdNm = sidoCdNmMatch ? sidoCdNmMatch[1] : '';
        const totalCount = totalCountMatch ? parseInt(totalCountMatch[1]) : 0;
        
        if (actualHiraCode !== currentHira) {
          console.log(`   🔄 실제 HIRA 코드: ${actualHiraCode} (${sidoCdNm})`);
          console.log(`   ⚠️  코드 불일치! 수정 필요: ${currentHira} → ${actualHiraCode}`);
          return { code, name, hiraCode: actualHiraCode, count: totalCount, status: 'mismatch' };
        } else {
          console.log(`   ✅ 코드 일치: ${actualHiraCode}`);
          return { code, name, hiraCode: actualHiraCode, count: totalCount, status: 'ok' };
        }
      }
    } catch (error) {
      console.log(`   ❌ 병원명 검색 오류: ${error.message}`);
    }
  }
  
  return { code, name, hiraCode: currentHira, count: 0, status: 'unknown' };
}

async function main() {
  console.log('=== 모든 시도의 HIRA API 코드 검증 ===\n');
  
  const results = [];
  
  for (const sido of sidoList) {
    const result = await checkSidoCode(sido);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // API 호출 간격
  }
  
  console.log('\n=== 검증 결과 요약 ===');
  const mismatches = results.filter(r => r.status === 'mismatch');
  const zeros = results.filter(r => r.count === 0 && r.status !== 'ok');
  
  if (mismatches.length > 0) {
    console.log('\n⚠️  코드 불일치 시도:');
    mismatches.forEach(r => {
      console.log(`   ${r.name} (${r.code}): ${r.hiraCode}`);
    });
  }
  
  if (zeros.length > 0) {
    console.log('\n⚠️  검색 결과 없는 시도:');
    zeros.forEach(r => {
      console.log(`   ${r.name} (${r.code}): ${r.hiraCode}`);
    });
  }
  
  if (mismatches.length === 0 && zeros.length === 0) {
    console.log('\n✅ 모든 시도 코드가 정상입니다!');
  }
}

main().catch(console.error);

