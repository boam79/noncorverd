/**
 * 공공데이터 API 연동 테스트 스크립트
 * 
 * 사용법:
 * node test-api.js
 * 
 * 환경변수 설정:
 * - ADMINISTRATIVE_CODE_SERVICE_KEY
 * - HIRA_SERVICE_KEY
 * - HIRA_PRICING_SERVICE_KEY
 */

import dotenv from 'dotenv';

// 환경변수를 먼저 로드
dotenv.config();

// 환경변수 로드 후 어댑터 import
import { regionsAdapter } from './src/adapters/regionsAdapter.js';
import { hospitalsAdapter } from './src/adapters/hospitalsAdapter.js';
import { pricingAdapter } from './src/adapters/pricingAdapter.js';

async function testRegionsAPI() {
  console.log('\n📋 [테스트 1] 지역 정보 API 테스트');
  console.log('='.repeat(50));

  // 시도 목록 조회
  console.log('\n1. 시도 목록 조회:');
  const sidoResult = await regionsAdapter.getSidoList();
  console.log('결과:', JSON.stringify(sidoResult, null, 2));

  // 시군구 목록 조회 (서울)
  console.log('\n2. 시군구 목록 조회 (서울특별시):');
  const sigunguResult = await regionsAdapter.getSigunguList('11');
  console.log('결과:', JSON.stringify(sigunguResult, null, 2));
}

async function testHospitalsAPI() {
  console.log('\n🏥 [테스트 2] 병원 정보 API 테스트');
  console.log('='.repeat(50));

  // 서울 종로구 병원 조회
  console.log('\n1. 서울 종로구 병원 조회:');
  const hospitalsResult = await hospitalsAdapter.getHospitals({
    sido: '11',
    sigungu: '110',
    type: '종합병원',
  });
  console.log('결과:', JSON.stringify(hospitalsResult, null, 2));
}

async function testPricingAPI() {
  console.log('\n💰 [테스트 3] 비급여 가격 정보 API 테스트');
  console.log('='.repeat(50));

  // 병원 가격 정보 조회
  console.log('\n1. 병원 가격 정보 조회:');
  const pricingResult = await pricingAdapter.getPricing([
    'hosp_001',
    'hosp_002',
  ]);
  console.log('결과:', JSON.stringify(pricingResult, null, 2));
}

async function runTests() {
  console.log('🚀 공공데이터 API 연동 테스트 시작\n');
  console.log('환경변수 확인:');
  console.log('- ADMINISTRATIVE_CODE_SERVICE_KEY:', 
    process.env.ADMINISTRATIVE_CODE_SERVICE_KEY ? '✅ 설정됨' : '❌ 미설정');
  console.log('- HIRA_SERVICE_KEY:', 
    process.env.HIRA_SERVICE_KEY ? '✅ 설정됨' : '❌ 미설정');
  console.log('- HIRA_PRICING_SERVICE_KEY:', 
    process.env.HIRA_PRICING_SERVICE_KEY ? '✅ 설정됨' : '❌ 미설정');

  try {
    await testRegionsAPI();
    await testHospitalsAPI();
    await testPricingAPI();

    console.log('\n✅ 모든 테스트 완료!');
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    process.exit(1);
  }
}

// 테스트 실행
runTests();

