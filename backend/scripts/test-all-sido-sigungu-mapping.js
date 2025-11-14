/**
 * 모든 시도/시군구 매핑 테스트
 */
import { HospitalsAdapter } from '../src/adapters/hospitalsAdapter.js';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new HospitalsAdapter();

// 대구 서구 테스트
console.log('=== 대구 서구 매핑 테스트 ===');
const result = await adapter.getHospitals({ sido: '27', sigungu: '271400' });
console.log(`검색 결과: ${result.data?.length || 0}개`);
if (result.data && result.data.length > 0) {
  console.log('\n주소 샘플:');
  result.data.slice(0, 5).forEach((h, i) => {
    console.log(`${i + 1}. ${h.name}: ${h.address}`);
  });
}
