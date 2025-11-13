/**
 * 공공데이터 API 엔드포인트 설정
 * 
 * 실제 API 엔드포인트는 각 API의 상세 페이지에서 확인:
 * https://www.data.go.kr/data/15001699/openapi.do
 */

export const API_ENDPOINTS = {
  // 행정안전부 행정표준코드_법정동코드
  // 참고: 실제 엔드포인트는 API 상세 페이지에서 확인 필요
  ADMINISTRATIVE_CODE: '/B552584/AdministrativeCodeService/getAdministrativeCode',

  // 건강보험심사평가원 병원정보서비스
  // 참고: 실제 엔드포인트는 API 상세 페이지에서 확인 필요
  HOSPITAL_INFO: '/B551182/hospInfoServicev2/getHospBasisList',

  // 건강보험심사평가원 비급여진료비정보조회서비스
  // 참고: 실제 엔드포인트는 API 상세 페이지에서 확인 필요
  NON_PAYMENT_PRICING: '/B551182/nonPaymentDamtInfoService/getNonPaymentItemHospDtlList',
};

/**
 * 공공데이터 API 기본 URL
 */
export const API_BASE_URL = 'https://apis.data.go.kr';

/**
 * API 응답 형식 (JSON 또는 XML)
 */
export const API_RESPONSE_FORMAT = {
  JSON: 'json',
  XML: 'xml',
};

