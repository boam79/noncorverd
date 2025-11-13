#!/usr/bin/env node

/**
 * 비급여 가격 통합 테스트 스크립트
 * 
 * 여러 병원의 가격 정보를 한 번에 조회하여 비교 테이블에 사용할 수 있는지 검증
 * 
 * 실행 방법:
 *   cd backend
 *   node scripts/test-pricing-integration.js [--sido 11] [--type 종합병원] [--count 3]
 * 
 * 예시:
 *   node scripts/test-pricing-integration.js --sido 11 --type 종합병원 --count 3
 */

import dotenv from 'dotenv';
import { pricingAdapter } from '../src/adapters/pricingAdapter.js';
import { hospitalsAdapter } from '../src/adapters/hospitalsAdapter.js';

dotenv.config({ path: '.env' });

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    sido: '11', // 기본값: 서울
    type: '종합병원',
    count: 3, // 기본값: 3개 병원
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      if (key === 'count') {
        config[key] = parseInt(value, 10) || 3;
      } else {
        config[key] = value;
      }
    }
  }

  return config;
}

async function testPricingIntegration() {
  const config = parseArgs();
  console.log('🧪 비급여 가격 통합 테스트 시작\n');
  console.log('📋 설정:');
  console.log(`  - 시도: ${config.sido}`);
  console.log(`  - 종별: ${config.type}`);
  console.log(`  - 병원 수: ${config.count}개\n`);

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    hospitals: [],
    errors: [],
  };

  try {
    // 1. 병원 목록 조회
    console.log('📋 병원 목록 조회 중...\n');
    const hospitalResult = await hospitalsAdapter.getHospitals({
      sido: config.sido,
      type: config.type,
    });

    if (!hospitalResult.ok || !hospitalResult.data || hospitalResult.data.length === 0) {
      console.error('❌ 병원 목록을 가져올 수 없습니다.');
      process.exit(1);
    }

    const hospitals = hospitalResult.data.filter((h) => h.ykiho);
    const targetHospitals = hospitals.slice(0, config.count);

    console.log(`✅ ${targetHospitals.length}개 병원 선택 완료\n`);
    console.log('─'.repeat(60));

    // 2. 각 병원의 가격 정보 조회
    for (let i = 0; i < targetHospitals.length; i++) {
      const hospital = targetHospitals[i];
      results.total += 1;

      console.log(`\n[${i + 1}/${targetHospitals.length}] ${hospital.name}`);
      console.log(`  ID: ${hospital.id}`);
      console.log(`  ykiho: ${hospital.ykiho?.substring(0, 20)}...`);

      try {
        const startTime = Date.now();
        const pricingResult = await pricingAdapter.getHospitalPricing(hospital.ykiho);
        const duration = Date.now() - startTime;

        if (!pricingResult.ok) {
          results.failed += 1;
          results.errors.push({
            hospital: hospital.name,
            error: pricingResult.error?.message || '알 수 없는 오류',
          });
          console.log(`  ❌ 실패: ${pricingResult.error?.message}`);
          continue;
        }

        const pricing = pricingResult.data;
        const itemCount = pricing.items?.length || 0;
        const avgPrice = pricing.averagePrice || 0;

        results.success += 1;
        results.hospitals.push({
          id: hospital.id,
          name: hospital.name,
          ykiho: hospital.ykiho,
          itemCount,
          averagePrice: avgPrice,
          duration,
          sampleItems: pricing.items?.slice(0, 3).map((item) => ({
            name: item.name,
            price: item.price,
            unit: item.unit,
          })) || [],
        });

        console.log(`  ✅ 성공 (${duration}ms)`);
        console.log(`     항목 수: ${itemCount}개`);
        console.log(`     평균 가격: ${avgPrice.toLocaleString()}원`);
        if (pricing.items && pricing.items.length > 0) {
          console.log(`     샘플 항목:`);
          pricing.items.slice(0, 3).forEach((item) => {
            console.log(`       - ${item.name}: ${item.price.toLocaleString()}원 ${item.unit || ''}`);
          });
        }
      } catch (error) {
        results.failed += 1;
        results.errors.push({
          hospital: hospital.name,
          error: error.message,
        });
        console.log(`  ❌ 예외 발생: ${error.message}`);
      }
    }

    // 3. 결과 요약
    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 테스트 결과 요약\n');
    console.log(`총 병원 수: ${results.total}개`);
    console.log(`성공: ${results.success}개 (${Math.round((results.success / results.total) * 100)}%)`);
    console.log(`실패: ${results.failed}개 (${Math.round((results.failed / results.total) * 100)}%)`);

    if (results.hospitals.length > 0) {
      const totalItems = results.hospitals.reduce((sum, h) => sum + h.itemCount, 0);
      const avgItems = Math.round(totalItems / results.hospitals.length);
      const totalDuration = results.hospitals.reduce((sum, h) => sum + h.duration, 0);
      const avgDuration = Math.round(totalDuration / results.hospitals.length);

      console.log(`\n평균 항목 수: ${avgItems}개`);
      console.log(`평균 응답 시간: ${avgDuration}ms`);

      console.log('\n📋 병원별 상세 정보:');
      results.hospitals.forEach((h, index) => {
        console.log(`\n${index + 1}. ${h.name}`);
        console.log(`   항목 수: ${h.itemCount}개`);
        console.log(`   평균 가격: ${h.averagePrice.toLocaleString()}원`);
        console.log(`   응답 시간: ${h.duration}ms`);
      });
    }

    if (results.errors.length > 0) {
      console.log('\n❌ 실패한 병원:');
      results.errors.forEach((err) => {
        console.log(`  - ${err.hospital}: ${err.error}`);
      });
    }

    // 4. 비교 테이블 검증
    if (results.hospitals.length >= 2) {
      console.log('\n' + '─'.repeat(60));
      console.log('\n🔍 비교 테이블 검증\n');

      const hospitalIds = results.hospitals.map((h) => h.id);
      const pricingResult = await pricingAdapter.getPricing(hospitalIds);

      if (pricingResult.ok && Array.isArray(pricingResult.data)) {
        const pricingData = pricingResult.data;
        console.log(`✅ 비교 데이터 조회 성공: ${pricingData.length}개 병원`);

        // 공통 항목 찾기
        const allItemNames = new Set();
        pricingData.forEach((p) => {
          p.items?.forEach((item) => allItemNames.add(item.name));
        });

        const commonItems = Array.from(allItemNames).filter((itemName) => {
          return pricingData.every((p) =>
            p.items?.some((item) => item.name === itemName)
          );
        });

        console.log(`\n총 고유 항목 수: ${allItemNames.size}개`);
        console.log(`공통 항목 수: ${commonItems.length}개`);

        if (commonItems.length > 0) {
          console.log('\n공통 항목 샘플 (최대 5개):');
          commonItems.slice(0, 5).forEach((itemName) => {
            const prices = pricingData.map((p) => {
              const item = p.items?.find((i) => i.name === itemName);
              return item ? item.price : null;
            }).filter((p) => p !== null);

            if (prices.length > 0) {
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              const avgPrice = Math.round(
                prices.reduce((sum, p) => sum + p, 0) / prices.length
              );

              console.log(`  - ${itemName}`);
              console.log(`    최저: ${minPrice.toLocaleString()}원, 최고: ${maxPrice.toLocaleString()}원, 평균: ${avgPrice.toLocaleString()}원`);
            }
          });
        }
      } else {
        console.log('❌ 비교 데이터 조회 실패');
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ 통합 테스트 완료!\n');

    // 성공률이 80% 이상이면 성공으로 간주
    const successRate = (results.success / results.total) * 100;
    if (successRate >= 80) {
      console.log(`✅ 성공률 ${Math.round(successRate)}% - 기준(80%) 충족\n`);
      process.exit(0);
    } else {
      console.log(`⚠️ 성공률 ${Math.round(successRate)}% - 기준(80%) 미달\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 예상치 못한 오류:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPricingIntegration();

