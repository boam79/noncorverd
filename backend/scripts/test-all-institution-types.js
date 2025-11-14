/**
 * 모든 시도/시군구에서 의료기관 종별 필터링 테스트 스크립트
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://54.180.251.93:3000';
const CLIENT_TOKEN = process.env.CLIENT_OPENDATA_TOKEN || 'dev-client-token-12345';

// 주요 시도 목록
const sidoList = [
  { code: '11', name: '서울특별시', testSigungu: '111100' }, // 종로구
  { code: '26', name: '부산광역시', testSigungu: '261100' }, // 중구
  { code: '27', name: '대구광역시', testSigungu: '271100' }, // 중구
  { code: '28', name: '인천광역시', testSigungu: '281100' }, // 중구
  { code: '29', name: '광주광역시', testSigungu: '291100' }, // 동구
  { code: '30', name: '대전광역시', testSigungu: '301100' }, // 동구
  { code: '31', name: '울산광역시', testSigungu: '311100' }, // 중구
  { code: '41', name: '경기도', testSigungu: '411100' }, // 수원시
  { code: '43', name: '충청북도', testSigungu: '431100' }, // 청주시
  { code: '44', name: '충청남도', testSigungu: '441100' }, // 천안시
  { code: '45', name: '전북특별자치도', testSigungu: '451100' }, // 전주시
  { code: '46', name: '전라남도', testSigungu: '461100' }, // 목포시
  { code: '47', name: '경상북도', testSigungu: '471100' }, // 포항시
  { code: '48', name: '경상남도', testSigungu: '481100' }, // 창원시
  { code: '50', name: '제주특별자치도', testSigungu: '501100' }, // 제주시
  { code: '51', name: '강원특별자치도', testSigungu: '511100' }, // 춘천시
];

// 의료기관 종별 목록
const institutionTypes = [
  { code: '종합병원', name: '종합병원' },
  { code: '병원', name: '병원' },
  { code: '의원', name: '의원' },
  { code: '요양병원', name: '요양병원' },
  { code: '치과', name: '치과' },
  { code: '한의원', name: '한의원' },
];

async function testInstitutionTypeFilter(sido, sigungu, type) {
  try {
    const params = new URLSearchParams({ sido });
    if (sigungu) {
      params.set('sigungu', sigungu);
    }
    if (type) {
      params.set('type', type);
    }
    
    const response = await axios.get(`${BACKEND_URL}/opendata/hospitals?${params.toString()}`, {
      headers: {
        'X-Client-Token': CLIENT_TOKEN,
      },
    });
    
    const count = response.data?.data?.length || 0;
    const hospitals = response.data?.data || [];
    
    // 모든 병원이 선택한 종별인지 확인
    const allMatch = hospitals.every(h => h.type === type);
    const types = [...new Set(hospitals.map(h => h.type))];
    const clCdNms = [...new Set(hospitals.map(h => h.clCdNm).filter(Boolean))];
    
    // 첫 번째 병원 정보
    const firstHospital = count > 0 ? {
      name: hospitals[0].name,
      type: hospitals[0].type,
      clCdNm: hospitals[0].clCdNm,
    } : null;
    
    return {
      success: response.data?.ok === true,
      count,
      allMatch,
      types,
      clCdNms,
      firstHospital,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error.message,
    };
  }
}

async function main() {
  console.log('=== 모든 시도/시군구 의료기관 종별 필터링 테스트 ===\n');
  
  const results = [];
  
  // 1. 시도별 의원 검색 테스트
  console.log('1. 시도별 의원 검색 테스트:');
  for (const sido of sidoList) {
    const result = await testInstitutionTypeFilter(sido.code, null, '의원');
    results.push({
      sido: sido.name,
      sigungu: '전체',
      type: '의원',
      ...result,
    });
    
    if (result.success && result.count > 0) {
      if (result.allMatch) {
        console.log(`   ✅ ${sido.name}: ${result.count}개 (모두 의원)`);
      } else {
        console.log(`   ⚠️  ${sido.name}: ${result.count}개 (일부 불일치: ${result.types.join(', ')})`);
        if (result.firstHospital) {
          console.log(`      예: ${result.firstHospital.name} (type=${result.firstHospital.type}, clCdNm=${result.firstHospital.clCdNm})`);
        }
      }
    } else {
      console.log(`   ❌ ${sido.name}: 검색 실패 또는 결과 없음`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 2. 시군구별 의원 검색 테스트
  console.log('\n2. 시군구별 의원 검색 테스트:');
  for (const sido of sidoList) {
    if (!sido.testSigungu) continue;
    
    const result = await testInstitutionTypeFilter(sido.code, sido.testSigungu, '의원');
    results.push({
      sido: sido.name,
      sigungu: sido.testSigungu,
      type: '의원',
      ...result,
    });
    
    if (result.success && result.count > 0) {
      if (result.allMatch) {
        console.log(`   ✅ ${sido.name} (시군구): ${result.count}개 (모두 의원)`);
      } else {
        console.log(`   ⚠️  ${sido.name} (시군구): ${result.count}개 (일부 불일치: ${result.types.join(', ')})`);
        if (result.firstHospital) {
          console.log(`      예: ${result.firstHospital.name} (type=${result.firstHospital.type}, clCdNm=${result.firstHospital.clCdNm})`);
        }
      }
    } else {
      console.log(`   ⚠️  ${sido.name} (시군구): 검색 실패 또는 결과 없음`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 3. 서울특별시에서 모든 종별 테스트
  console.log('\n3. 서울특별시에서 모든 종별 필터링 테스트:');
  for (const type of institutionTypes) {
    const result = await testInstitutionTypeFilter('11', null, type.code);
    
    if (result.success && result.count > 0) {
      if (result.allMatch) {
        console.log(`   ✅ ${type.name}: ${result.count}개 (모두 일치)`);
      } else {
        console.log(`   ⚠️  ${type.name}: ${result.count}개 (일부 불일치: ${result.types.join(', ')})`);
        if (result.firstHospital) {
          console.log(`      예: ${result.firstHospital.name} (type=${result.firstHospital.type}, clCdNm=${result.firstHospital.clCdNm})`);
        }
      }
    } else {
      console.log(`   ❌ ${type.name}: 검색 실패 또는 결과 없음`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 결과 요약
  console.log('\n=== 검증 결과 요약 ===');
  const failedSido = results.filter(r => !r.success || r.count === 0);
  const mismatchedTypes = results.filter(r => r.success && r.count > 0 && !r.allMatch);
  
  if (mismatchedTypes.length > 0) {
    console.log('\n⚠️  종별 필터링 불일치:');
    mismatchedTypes.forEach(r => {
      console.log(`   ${r.sido}${r.sigungu !== '전체' ? ` (${r.sigungu})` : ''} - ${r.type}:`);
      console.log(`      실제 종별: ${r.types.join(', ')}`);
      console.log(`      clCdNm: ${r.clCdNms.join(', ')}`);
      if (r.firstHospital) {
        console.log(`      예: ${r.firstHospital.name} (type=${r.firstHospital.type}, clCdNm=${r.firstHospital.clCdNm})`);
      }
    });
  }
  
  if (failedSido.length > 0) {
    console.log('\n⚠️  검색 실패:');
    failedSido.forEach(r => {
      console.log(`   ${r.sido}${r.sigungu !== '전체' ? ` (${r.sigungu})` : ''} - ${r.type}: ${r.error || '결과 없음'}`);
    });
  }
  
  if (mismatchedTypes.length === 0 && failedSido.length === 0) {
    console.log('\n✅ 모든 종별 필터링이 정상 작동합니다!');
  }
}

main().catch(console.error);

