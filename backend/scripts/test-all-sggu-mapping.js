/**
 * 모든 시도의 시군구 코드 매핑 테스트 스크립트
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BACKEND_URL = 'http://54.180.251.93:3000';
const CLIENT_TOKEN = 'dev-client-token-12345';

/**
 * 시도별 시군구 검색 테스트
 */
async function testSigunguMapping(sidoCode, sidoName) {
  console.log(`\n=== ${sidoName} (${sidoCode}) ===`);
  
  try {
    // 시군구 목록 가져오기
    const regionsResponse = await fetch(`${BACKEND_URL}/opendata/regions?sido=${sidoCode}`, {
      headers: { 'X-Client-Token': CLIENT_TOKEN },
    });
    const regionsData = await regionsResponse.json();
    
    if (!regionsData.ok || !Array.isArray(regionsData.data) || regionsData.data.length === 0) {
      console.log(`  ⚠️ 시군구 목록을 가져올 수 없습니다.`);
      return { total: 0, success: 0, failed: 0, issues: [] };
    }
    
    const sigunguList = regionsData.data;
    console.log(`  시군구 ${sigunguList.length}개 발견`);
    
    let successCount = 0;
    let failedCount = 0;
    const issues = [];
    
    // 각 시군구별로 병원 검색 테스트 (최대 5개만)
    const testSigungus = sigunguList.slice(0, 5);
    
    for (const sigungu of testSigungus) {
      const sigunguCode = sigungu.code;
      const sigunguName = sigungu.name;
      
      try {
        // 병원 검색 (의료기관 종별 없이)
        const hospitalsResponse = await fetch(
          `${BACKEND_URL}/opendata/hospitals?sido=${sidoCode}&sigungu=${sigunguCode}`,
          { headers: { 'X-Client-Token': CLIENT_TOKEN } }
        );
        const hospitalsData = await hospitalsResponse.json();
        
        if (hospitalsData.ok && Array.isArray(hospitalsData.data) && hospitalsData.data.length > 0) {
          const hospitalCount = hospitalsData.data.length;
          const firstHospital = hospitalsData.data[0];
          
          // 주소에 시군구명이 포함되어 있는지 확인
          const addressMatch = firstHospital.address?.includes(sigunguName.replace(/.*?특별시\s*/, '').replace(/.*?광역시\s*/, '').replace(/.*?도\s*/, '').trim());
          
          if (addressMatch) {
            console.log(`  ✅ ${sigunguName} (${sigunguCode}): ${hospitalCount}개 병원, 주소 일치`);
            successCount++;
          } else {
            console.log(`  ⚠️ ${sigunguName} (${sigunguCode}): ${hospitalCount}개 병원, 주소 불일치`);
            issues.push({
              sigungu: sigunguName,
              code: sigunguCode,
              issue: '주소 불일치',
              firstAddress: firstHospital.address,
            });
            failedCount++;
          }
        } else {
          console.log(`  ❌ ${sigunguName} (${sigunguCode}): 검색 결과 없음`);
          issues.push({
            sigungu: sigunguName,
            code: sigunguCode,
            issue: '검색 결과 없음',
          });
          failedCount++;
        }
      } catch (error) {
        console.log(`  ❌ ${sigunguName} (${sigunguCode}): 에러 - ${error.message}`);
        issues.push({
          sigungu: sigunguName,
          code: sigunguCode,
          issue: `에러: ${error.message}`,
        });
        failedCount++;
      }
      
      // API 호출 제한을 피하기 위해 딜레이
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return {
      total: testSigungus.length,
      success: successCount,
      failed: failedCount,
      issues,
    };
  } catch (error) {
    console.error(`  ❌ 에러: ${error.message}`);
    return { total: 0, success: 0, failed: 0, issues: [{ issue: `에러: ${error.message}` }] };
  }
}

/**
 * 모든 시도 테스트
 */
async function testAllSidos() {
  try {
    // 시도 목록 가져오기
    const sidoResponse = await fetch(`${BACKEND_URL}/opendata/regions`, {
      headers: { 'X-Client-Token': CLIENT_TOKEN },
    });
    const sidoData = await sidoResponse.json();
    
    if (!sidoData.ok || !Array.isArray(sidoData.data)) {
      console.error('시도 목록을 가져올 수 없습니다.');
      return;
    }
    
    const sidoList = sidoData.data;
    console.log(`총 ${sidoList.length}개 시도 발견\n`);
    
    const results = [];
    
    for (const sido of sidoList) {
      const result = await testSigunguMapping(sido.code, sido.name);
      results.push({
        sido: sido.name,
        code: sido.code,
        ...result,
      });
      
      // API 호출 제한을 피하기 위해 딜레이
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 결과 요약
    console.log('\n=== 테스트 결과 요약 ===');
    const totalSidos = results.length;
    const totalTests = results.reduce((sum, r) => sum + r.total, 0);
    const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    
    console.log(`총 시도: ${totalSidos}개`);
    console.log(`총 테스트: ${totalTests}개`);
    console.log(`성공: ${totalSuccess}개`);
    console.log(`실패: ${totalFailed}개`);
    
    // 문제가 있는 시도 목록
    const problematicSidos = results.filter(r => r.failed > 0);
    if (problematicSidos.length > 0) {
      console.log('\n=== 문제가 있는 시도 ===');
      problematicSidos.forEach((r) => {
        console.log(`\n${r.sido} (${r.code}):`);
        r.issues.forEach((issue) => {
          console.log(`  - ${issue.sigungu} (${issue.code}): ${issue.issue}`);
          if (issue.firstAddress) {
            console.log(`    첫 번째 병원 주소: ${issue.firstAddress}`);
          }
        });
      });
    }
  } catch (error) {
    console.error('테스트 실행 중 에러:', error);
  }
}

// 실행
testAllSidos().catch(console.error);

