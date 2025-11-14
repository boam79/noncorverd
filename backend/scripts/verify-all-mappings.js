/**
 * 모든 시도/시군구 및 종별 매핑 검증 스크립트
 */
import { HospitalsAdapter } from '../src/adapters/hospitalsAdapter.js';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new HospitalsAdapter();

// 모든 시도 코드 (행정안전부 기준)
const allSidos = [
  { code: '11', name: '서울특별시' },
  { code: '26', name: '부산광역시' },
  { code: '27', name: '대구광역시' },
  { code: '28', name: '인천광역시' },
  { code: '29', name: '광주광역시' },
  { code: '30', name: '대전광역시' },
  { code: '31', name: '울산광역시' },
  { code: '36', name: '세종특별자치시' },
  { code: '41', name: '경기도' },
  { code: '43', name: '충청북도' },
  { code: '44', name: '충청남도' },
  { code: '45', name: '전북특별자치도' },
  { code: '46', name: '전라남도' },
  { code: '47', name: '경상북도' },
  { code: '48', name: '경상남도' },
  { code: '50', name: '제주특별자치도' },
  { code: '51', name: '강원특별자치도' },
];

// 모든 종별
const allTypes = ['종합병원', '병원', '의원', '요양병원', '치과', '한의원'];

console.log('=== 시도 코드 매핑 검증 ===\n');
for (const sido of allSidos) {
  const hiraCode = adapter.convertSidoCodeToHIRA(sido.code);
  console.log(`${sido.name} (${sido.code}) → HIRA: ${hiraCode || '매핑 없음'}`);
}

console.log('\n=== 종별 매핑 검증 ===\n');
for (const type of allTypes) {
  const result = await adapter.getHospitals({ sido: '11', type });
  console.log(`${type}: ${result.data?.length || 0}개 (서울)`);
}

console.log('\n=== 시군구 매핑 샘플 검증 (대구 서구) ===\n');
// 대구 서구 코드 확인
const daeguSeo = await adapter.getHospitals({ sido: '27', sigungu: '271400' });
console.log(`대구 서구 검색: ${daeguSeo.data?.length || 0}개`);
if (daeguSeo.data && daeguSeo.data.length > 0) {
  console.log('첫 번째 병원 주소:', daeguSeo.data[0].address);
}
