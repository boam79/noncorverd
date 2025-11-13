#!/usr/bin/env node

/**
 * 비급여 가격 API 응답 구조 상세 분석 스크립트
 * 
 * 실행 방법:
 *   cd backend
 *   node scripts/inspect-pricing-response.js [ykiho]
 */

import dotenv from 'dotenv';
import { pricingAdapter } from '../src/adapters/pricingAdapter.js';
import { hospitalsAdapter } from '../src/adapters/hospitalsAdapter.js';

dotenv.config({ path: '.env' });

async function inspectResponse() {
  const args = process.argv.slice(2);
  let ykiho = args[0];

  console.log('🔍 비급여 가격 API 응답 구조 분석\n');

  if (!ykiho) {
    console.log('📋 ykiho가 제공되지 않아 서울 지역 병원 목록에서 가져옵니다...\n');
    
    try {
      const hospitalResult = await hospitalsAdapter.getHospitals({
        sido: '11',
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
        process.exit(1);
      }

      ykiho = hospitalWithYkiho.ykiho;
      console.log(`✅ 병원 선택: ${hospitalWithYkiho.name} (ykiho: ${ykiho})\n`);
    } catch (error) {
      console.error('❌ 병원 목록 조회 실패:', error.message);
      process.exit(1);
    }
  }

  try {
    // BaseAdapter의 fetchAPI를 직접 호출하여 raw 응답 확인
    const serviceKey = process.env.api_key || process.env.HIRA_PRICING_SERVICE_KEY || '';
    if (!serviceKey) {
      console.error('❌ Service Key가 설정되지 않았습니다.');
      process.exit(1);
    }

    pricingAdapter.serviceKey = serviceKey;
    
    const result = await pricingAdapter.fetchAPI(pricingAdapter.apiEndpoint, {
      ykiho: ykiho,
      pageNo: 1,
      numOfRows: 5, // 샘플로 5개만
    });

    if (!result.ok) {
      console.error('❌ API 호출 실패:', result.error?.message);
      process.exit(1);
    }

    console.log('📊 Raw API 응답 데이터 구조:\n');
    console.log('─'.repeat(60));
    
    if (Array.isArray(result.data) && result.data.length > 0) {
      const firstItem = result.data[0];
      console.log('첫 번째 항목의 필드 구조:');
      console.log(JSON.stringify(firstItem, null, 2));
      
      console.log('\n─'.repeat(60));
      console.log('\n모든 항목의 필드 목록:');
      const allFields = new Set();
      result.data.forEach((item) => {
        Object.keys(item).forEach((key) => allFields.add(key));
      });
      console.log(Array.from(allFields).sort().join(', '));
      
      console.log('\n─'.repeat(60));
      console.log('\n샘플 데이터 (첫 3개 항목):');
      result.data.slice(0, 3).forEach((item, index) => {
        console.log(`\n항목 ${index + 1}:`);
        console.log(JSON.stringify(item, null, 2));
      });
    } else {
      console.log('응답 데이터가 배열이 아니거나 비어있습니다.');
      console.log('응답 타입:', typeof result.data);
      console.log('응답 데이터:', result.data);
    }

    console.log('\n─'.repeat(60));
    console.log('✅ 분석 완료!');
  } catch (error) {
    console.error('❌ 오류:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

inspectResponse();

