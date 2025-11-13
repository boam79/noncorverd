#!/usr/bin/env node

/**
 * 비급여 가격 API 테스트 스크립트
 * 
 * 실행 방법:
 *   cd backend
 *   node scripts/test-pricing-api.js [ykiho]
 * 
 * 예시:
 *   node scripts/test-pricing-api.js A1234567890
 */

import dotenv from 'dotenv';
import { pricingAdapter } from '../src/adapters/pricingAdapter.js';
import { hospitalsAdapter } from '../src/adapters/hospitalsAdapter.js';

// 환경변수 로드 (가장 먼저)
dotenv.config({ path: '.env' });

async function testPricingAPI() {
  const args = process.argv.slice(2);
  let ykiho = args[0];

  console.log('🧪 비급여 가격 API 테스트 시작\n');

  // ykiho가 제공되지 않은 경우, 실제 병원 목록에서 가져오기
  if (!ykiho) {
    console.log('📋 ykiho가 제공되지 않아 서울 지역 병원 목록에서 가져옵니다...\n');
    
    try {
      const hospitalResult = await hospitalsAdapter.getHospitals({
        sido: '11', // 서울
        type: '종합병원',
      });

      if (!hospitalResult.ok || !hospitalResult.data || hospitalResult.data.length === 0) {
        console.error('❌ 병원 목록을 가져올 수 없습니다.');
        process.exit(1);
      }

      const hospitals = hospitalResult.data;
      const hospitalWithYkiho = hospitals.find((h) => h.ykiho);

      if (!hospitalWithYkiho || !hospitalWithYkiho.ykiho) {
        console.error('❌ ykiho가 있는 병원을 찾을 수 없습니다.');
        console.log('📋 첫 번째 병원 정보:', hospitals[0]);
        process.exit(1);
      }

      ykiho = hospitalWithYkiho.ykiho;
      console.log(`✅ 병원 선택: ${hospitalWithYkiho.name} (ykiho: ${ykiho})\n`);
    } catch (error) {
      console.error('❌ 병원 목록 조회 실패:', error.message);
      process.exit(1);
    }
  }

  // 비급여 가격 조회 테스트
  console.log(`💰 비급여 가격 조회 테스트 (ykiho: ${ykiho})\n`);
  console.log('─'.repeat(60));

  try {
    const result = await pricingAdapter.getHospitalPricing(ykiho);

    if (!result.ok) {
      console.error('❌ API 호출 실패');
      console.error('에러 코드:', result.error?.code);
      console.error('에러 메시지:', result.error?.message);
      if (result.error?.details) {
        console.error('상세 정보:', result.error.details);
      }
      process.exit(1);
    }

    const pricing = result.data;
    console.log('✅ API 호출 성공!\n');
    console.log('📊 응답 데이터 구조:');
    console.log(`  - 병원 ID: ${pricing.hospitalId}`);
    console.log(`  - 병원명: ${pricing.hospitalName}`);
    console.log(`  - 항목 수: ${pricing.items?.length || 0}개`);
    console.log(`  - 평균 가격: ${pricing.averagePrice?.toLocaleString() || 0}원\n`);

    if (pricing.items && pricing.items.length > 0) {
      console.log('📋 비급여 항목 목록 (최대 10개):');
      console.log('─'.repeat(60));
      pricing.items.slice(0, 10).forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}`);
        console.log(`   가격: ${item.price?.toLocaleString() || 0}원 ${item.unit || ''}`);
        console.log(`   ID: ${item.id}`);
        console.log('');
      });

      if (pricing.items.length > 10) {
        console.log(`... 외 ${pricing.items.length - 10}개 항목\n`);
      }
    } else {
      console.log('⚠️ 비급여 항목이 없습니다.\n');
    }

    console.log('─'.repeat(60));
    console.log('✅ 테스트 완료!');
  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPricingAPI();

