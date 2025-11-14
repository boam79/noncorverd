/**
 * 모든 의료기관 종별 필터링 상세 테스트 스크립트
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://54.180.251.93:3000';
const CLIENT_TOKEN = process.env.CLIENT_OPENDATA_TOKEN || 'dev-client-token-12345';

// 의료기관 종별 목록
const institutionTypes = [
  { code: '종합병원', name: '종합병원' },
  { code: '병원', name: '병원' },
  { code: '의원', name: '의원' },
  { code: '요양병원', name: '요양병원' },
  { code: '치과', name: '치과' },
  { code: '한의원', name: '한의원' },
];

// 테스트할 시도 목록 (주요 시도만)
const sidoList = [
  { code: '11', name: '서울특별시' },
  { code: '26', name: '부산광역시' },
  { code: '47', name: '경상북도' },
  { code: '50', name: '제주특별자치도' },
];

async function testInstitutionTypeFilter(sido, type) {
  try {
    const params = new URLSearchParams({ sido, type });
    
    const response = await axios.get(`${BACKEND_URL}/opendata/hospitals?${params.toString()}`, {
      headers: {
        'X-Client-Token': CLIENT_TOKEN,
      },
    });
    
    const count = response.data?.data?.length || 0;
    const hospitals = response.data?.data || [];
    
    // 종별별 통계
    const typeStats = {};
    const clCdNmStats = {};
    
    hospitals.forEach((h) => {
      const t = h.type || 'unknown';
      const c = h.clCdNm || 'unknown';
      typeStats[t] = (typeStats[t] || 0) + 1;
      clCdNmStats[c] = (clCdNmStats[c] || 0) + 1;
    });
    
    // 모든 병원이 선택한 종별인지 확인
    const allMatch = hospitals.every(h => h.type === type);
    const types = Object.keys(typeStats);
    const clCdNms = Object.keys(clCdNmStats);
    
    // 샘플 병원 정보
    const samples = hospitals.slice(0, 3).map(h => ({
      name: h.name,
      type: h.type,
      clCdNm: h.clCdNm,
    }));
    
    return {
      success: response.data?.ok === true,
      count,
      allMatch,
      typeStats,
      clCdNmStats,
      types,
      clCdNms,
      samples,
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
  console.log('=== 모든 의료기관 종별 필터링 상세 테스트 ===\n');
  
  const results = [];
  
  for (const sido of sidoList) {
    console.log(`\n📍 ${sido.name} (${sido.code}):`);
    
    for (const type of institutionTypes) {
      const result = await testInstitutionTypeFilter(sido.code, type.code);
      results.push({
        sido: sido.name,
        type: type.name,
        ...result,
      });
      
      if (result.success && result.count > 0) {
        if (result.allMatch) {
          console.log(`   ✅ ${type.name}: ${result.count}개 (모두 일치)`);
        } else {
          console.log(`   ⚠️  ${type.name}: ${result.count}개 (일부 불일치)`);
          console.log(`      type 분포: ${JSON.stringify(result.typeStats)}`);
          console.log(`      clCdNm 분포: ${JSON.stringify(result.clCdNmStats)}`);
          if (result.samples && result.samples.length > 0) {
            console.log(`      샘플:`);
            result.samples.forEach((s, i) => {
              console.log(`        ${i + 1}. ${s.name} (type=${s.type}, clCdNm=${s.clCdNm})`);
            });
          }
        }
      } else {
        console.log(`   ❌ ${type.name}: 검색 실패 또는 결과 없음`);
        if (result.error) {
          console.log(`      오류: ${result.error}`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // 결과 요약
  console.log('\n=== 검증 결과 요약 ===');
  const failed = results.filter(r => !r.success || r.count === 0);
  const mismatched = results.filter(r => r.success && r.count > 0 && !r.allMatch);
  
  if (mismatched.length > 0) {
    console.log('\n⚠️  종별 필터링 불일치:');
    mismatched.forEach(r => {
      console.log(`\n   ${r.sido} - ${r.type} (${r.count}개):`);
      console.log(`      type 분포: ${JSON.stringify(r.typeStats)}`);
      console.log(`      clCdNm 분포: ${JSON.stringify(r.clCdNmStats)}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️  검색 실패:');
    failed.forEach(r => {
      console.log(`   ${r.sido} - ${r.type}: ${r.error || '결과 없음'}`);
    });
  }
  
  if (mismatched.length === 0 && failed.length === 0) {
    console.log('\n✅ 모든 종별 필터링이 정상 작동합니다!');
  } else {
    console.log(`\n📊 통계:`);
    console.log(`   총 테스트: ${results.length}개`);
    console.log(`   성공: ${results.length - failed.length - mismatched.length}개`);
    console.log(`   불일치: ${mismatched.length}개`);
    console.log(`   실패: ${failed.length}개`);
  }
}

main().catch(console.error);

