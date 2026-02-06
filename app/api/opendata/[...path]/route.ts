import { NextRequest, NextResponse } from 'next/server';

// 백엔드 URL 설정 (환경변수 우선, 없으면 기본값)
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://54.180.251.93:3001';
// 클라이언트 토큰 설정
const CLIENT_TOKEN = process.env.CLIENT_OPENDATA_TOKEN ||
                     process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN ||
                     'dev-client-token-12345';

// 공공데이터 API 키 (Vercel 환경변수에서 읽기)
const API_SERVICE_KEY = process.env.api_key || process.env.HIRA_SERVICE_KEY || '';
const ADMIN_SERVICE_KEY = process.env.api_key || process.env.ADMINISTRATIVE_CODE_SERVICE_KEY || '';
const PRICING_SERVICE_KEY = process.env.api_key || process.env.HIRA_PRICING_SERVICE_KEY || process.env.HIRA_SERVICE_KEY || '';

// ============================================================
// Mock / Fallback Data
// ============================================================

const MOCK_SIDO_LIST = [
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
  { code: '46', name: '전라남도' },
  { code: '47', name: '경상북도' },
  { code: '48', name: '경상남도' },
  { code: '50', name: '제주특별자치도' },
  { code: '51', name: '강원특별자치도' },
  { code: '52', name: '전북특별자치도' },
];

const MOCK_SIGUNGU: Record<string, Array<{ code: string; name: string }>> = {
  '11': [
    { code: '110000', name: '종로구' }, { code: '140000', name: '중구' },
    { code: '170000', name: '용산구' }, { code: '200000', name: '성동구' },
    { code: '215000', name: '광진구' }, { code: '230000', name: '동대문구' },
    { code: '260000', name: '중랑구' }, { code: '290000', name: '성북구' },
    { code: '305000', name: '강북구' }, { code: '320000', name: '도봉구' },
    { code: '350000', name: '노원구' }, { code: '380000', name: '은평구' },
    { code: '410000', name: '서대문구' }, { code: '440000', name: '마포구' },
    { code: '470000', name: '양천구' }, { code: '500000', name: '강서구' },
    { code: '530000', name: '구로구' }, { code: '545000', name: '금천구' },
    { code: '560000', name: '영등포구' }, { code: '590000', name: '동작구' },
    { code: '620000', name: '관악구' }, { code: '650000', name: '서초구' },
    { code: '680000', name: '강남구' }, { code: '710000', name: '송파구' },
    { code: '740000', name: '강동구' },
  ],
  '26': [
    { code: '261100', name: '중구' }, { code: '261400', name: '서구' },
    { code: '261700', name: '동구' }, { code: '262000', name: '영도구' },
    { code: '262300', name: '부산진구' }, { code: '262600', name: '동래구' },
    { code: '262900', name: '남구' }, { code: '263200', name: '북구' },
    { code: '263500', name: '해운대구' }, { code: '263800', name: '사하구' },
    { code: '264100', name: '금정구' }, { code: '264400', name: '강서구' },
    { code: '264700', name: '연제구' }, { code: '265000', name: '수영구' },
    { code: '265300', name: '사상구' }, { code: '267100', name: '기장군' },
  ],
  '27': [
    { code: '271100', name: '중구' }, { code: '271400', name: '동구' },
    { code: '271700', name: '서구' }, { code: '272000', name: '남구' },
    { code: '272300', name: '북구' }, { code: '272600', name: '수성구' },
    { code: '272900', name: '달서구' }, { code: '277100', name: '달성군' },
    { code: '277200', name: '군위군' },
  ],
  '28': [
    { code: '281100', name: '중구' }, { code: '281400', name: '동구' },
    { code: '281770', name: '미추홀구' }, { code: '281850', name: '연수구' },
    { code: '282000', name: '남동구' }, { code: '282370', name: '부평구' },
    { code: '282450', name: '계양구' }, { code: '282600', name: '서구' },
    { code: '287100', name: '강화군' }, { code: '287200', name: '옹진군' },
  ],
  '29': [
    { code: '291100', name: '동구' }, { code: '291400', name: '서구' },
    { code: '291550', name: '남구' }, { code: '291700', name: '북구' },
    { code: '292000', name: '광산구' },
  ],
  '30': [
    { code: '301100', name: '동구' }, { code: '301400', name: '중구' },
    { code: '301700', name: '서구' }, { code: '302000', name: '유성구' },
    { code: '302300', name: '대덕구' },
  ],
  '31': [
    { code: '311100', name: '중구' }, { code: '311400', name: '남구' },
    { code: '311700', name: '동구' }, { code: '312000', name: '북구' },
    { code: '317100', name: '울주군' },
  ],
  '36': [
    { code: '361100', name: '세종시' },
  ],
  '41': [
    { code: '411100', name: '수원시' }, { code: '411300', name: '성남시' },
    { code: '411500', name: '의정부시' }, { code: '411700', name: '안양시' },
    { code: '411900', name: '부천시' }, { code: '412100', name: '광명시' },
    { code: '412200', name: '평택시' }, { code: '412500', name: '동두천시' },
    { code: '412700', name: '안산시' }, { code: '412900', name: '고양시' },
    { code: '413100', name: '과천시' }, { code: '413300', name: '구리시' },
    { code: '413500', name: '남양주시' }, { code: '413700', name: '오산시' },
    { code: '413900', name: '시흥시' }, { code: '414100', name: '군포시' },
    { code: '414300', name: '의왕시' }, { code: '414500', name: '하남시' },
    { code: '414700', name: '용인시' }, { code: '414900', name: '파주시' },
    { code: '415000', name: '이천시' }, { code: '415100', name: '안성시' },
    { code: '415300', name: '김포시' }, { code: '415500', name: '화성시' },
    { code: '415700', name: '광주시' }, { code: '415900', name: '양주시' },
    { code: '416100', name: '포천시' }, { code: '416300', name: '여주시' },
    { code: '418000', name: '양평군' }, { code: '417000', name: '가평군' },
    { code: '417200', name: '연천군' },
  ],
  '43': [
    { code: '431100', name: '청주시' }, { code: '431300', name: '충주시' },
    { code: '431500', name: '제천시' }, { code: '437200', name: '보은군' },
    { code: '437300', name: '옥천군' }, { code: '437400', name: '영동군' },
    { code: '437500', name: '증평군' }, { code: '437600', name: '진천군' },
    { code: '437700', name: '괴산군' }, { code: '437800', name: '음성군' },
    { code: '438000', name: '단양군' },
  ],
  '44': [
    { code: '441100', name: '천안시' }, { code: '441300', name: '공주시' },
    { code: '441500', name: '보령시' }, { code: '441700', name: '아산시' },
    { code: '441800', name: '서산시' }, { code: '442000', name: '논산시' },
    { code: '442100', name: '계룡시' }, { code: '442200', name: '당진시' },
    { code: '447100', name: '금산군' }, { code: '447600', name: '부여군' },
    { code: '447700', name: '서천군' }, { code: '447900', name: '청양군' },
    { code: '448000', name: '홍성군' }, { code: '448100', name: '예산군' },
    { code: '448200', name: '태안군' },
  ],
  '46': [
    { code: '461100', name: '목포시' }, { code: '461300', name: '여수시' },
    { code: '461500', name: '순천시' }, { code: '461700', name: '나주시' },
    { code: '461900', name: '광양시' }, { code: '467100', name: '담양군' },
    { code: '467200', name: '곡성군' }, { code: '467300', name: '구례군' },
    { code: '467500', name: '고흥군' }, { code: '467600', name: '보성군' },
    { code: '467700', name: '화순군' }, { code: '467800', name: '장흥군' },
    { code: '467900', name: '강진군' }, { code: '468000', name: '해남군' },
    { code: '468100', name: '영암군' }, { code: '468200', name: '무안군' },
    { code: '468400', name: '함평군' }, { code: '468600', name: '영광군' },
    { code: '468700', name: '장성군' }, { code: '468800', name: '완도군' },
    { code: '468900', name: '진도군' }, { code: '469000', name: '신안군' },
  ],
  '47': [
    { code: '471100', name: '포항시' }, { code: '471300', name: '경주시' },
    { code: '471500', name: '김천시' }, { code: '471700', name: '안동시' },
    { code: '471900', name: '구미시' }, { code: '472100', name: '영주시' },
    { code: '472300', name: '영천시' }, { code: '472500', name: '상주시' },
    { code: '472700', name: '문경시' }, { code: '472900', name: '경산시' },
  ],
  '48': [
    { code: '481100', name: '창원시' }, { code: '481700', name: '진주시' },
    { code: '482200', name: '통영시' }, { code: '482400', name: '사천시' },
    { code: '482500', name: '김해시' }, { code: '482700', name: '밀양시' },
    { code: '483100', name: '거제시' }, { code: '483200', name: '양산시' },
  ],
  '50': [
    { code: '501100', name: '제주시' }, { code: '501300', name: '서귀포시' },
  ],
  '51': [
    { code: '511100', name: '춘천시' }, { code: '511300', name: '원주시' },
    { code: '511500', name: '강릉시' }, { code: '511700', name: '동해시' },
    { code: '511900', name: '태백시' }, { code: '512100', name: '속초시' },
    { code: '512300', name: '삼척시' }, { code: '517200', name: '홍천군' },
    { code: '517300', name: '횡성군' }, { code: '517500', name: '영월군' },
    { code: '517600', name: '평창군' }, { code: '517700', name: '정선군' },
    { code: '517800', name: '철원군' }, { code: '517900', name: '화천군' },
    { code: '518000', name: '양구군' }, { code: '518100', name: '인제군' },
    { code: '518200', name: '고성군' }, { code: '518300', name: '양양군' },
  ],
  '52': [
    { code: '521100', name: '전주시' }, { code: '521300', name: '군산시' },
    { code: '521400', name: '익산시' }, { code: '518000', name: '정읍시' },
    { code: '521800', name: '남원시' }, { code: '521900', name: '김제시' },
    { code: '527100', name: '완주군' }, { code: '527200', name: '진안군' },
    { code: '527300', name: '무주군' }, { code: '527400', name: '장수군' },
    { code: '527500', name: '임실군' }, { code: '527600', name: '순창군' },
    { code: '527900', name: '부안군' },
  ],
};

const MOCK_HOSPITALS: Record<string, Array<Record<string, unknown>>> = {
  '11': [
    { id: 'hosp_001', name: '서울대학교병원', address: '서울특별시 종로구 대학로 101', type: '종합병원', departments: ['내과', '외과', '정형외과'], phone: '02-2072-2114', rating: 4.8 },
    { id: 'hosp_002', name: '세브란스병원', address: '서울특별시 서대문구 연세로 50-1', type: '종합병원', departments: ['내과', '외과', '산부인과'], phone: '02-2228-5800', rating: 4.7 },
    { id: 'hosp_003', name: '삼성서울병원', address: '서울특별시 강남구 일원로 81', type: '종합병원', departments: ['내과', '외과', '정형외과', '신경외과'], phone: '02-3410-2114', rating: 4.9 },
    { id: 'hosp_004', name: '서울아산병원', address: '서울특별시 송파구 올림픽로43길 88', type: '종합병원', departments: ['내과', '외과', '심장내과'], phone: '02-3010-3114', rating: 4.9 },
    { id: 'hosp_005', name: '고려대학교안암병원', address: '서울특별시 성북구 고려대로 73', type: '종합병원', departments: ['내과', '외과'], phone: '02-920-5114', rating: 4.6 },
  ],
  '26': [
    { id: 'hosp_026_001', name: '부산대학교병원', address: '부산광역시 서구 구덕로 179', type: '종합병원', departments: ['내과', '외과', '정형외과'], phone: '051-240-7000', rating: 4.7 },
    { id: 'hosp_026_002', name: '인제대학교 해운대백병원', address: '부산광역시 해운대구 해운대로 875', type: '종합병원', departments: ['내과', '외과', '산부인과'], phone: '051-797-0100', rating: 4.6 },
  ],
  '27': [
    { id: 'hosp_027_001', name: '경북대학교병원', address: '대구광역시 중구 동덕로 130', type: '종합병원', departments: ['내과', '외과'], phone: '053-200-5114', rating: 4.6 },
  ],
  '28': [
    { id: 'hosp_028_001', name: '가천대 길병원', address: '인천광역시 남동구 남동대로774번길 21', type: '종합병원', departments: ['내과', '외과', '정형외과'], phone: '032-460-3114', rating: 4.6 },
    { id: 'hosp_028_002', name: '인하대학교병원', address: '인천광역시 중구 인항로 27', type: '종합병원', departments: ['내과', '외과', '산부인과'], phone: '032-890-2114', rating: 4.5 },
  ],
  '41': [
    { id: 'hosp_041_001', name: '분당서울대학교병원', address: '경기도 성남시 분당구 구미로 173번길 82', type: '종합병원', departments: ['내과', '외과', '정형외과'], phone: '031-787-7000', rating: 4.8 },
    { id: 'hosp_041_002', name: '아주대학교병원', address: '경기도 수원시 영통구 월드컵로 164', type: '종합병원', departments: ['내과', '외과', '산부인과'], phone: '031-219-5114', rating: 4.7 },
  ],
};

// ============================================================
// HIRA API 시도 코드 매핑 (행정안전부 → HIRA)
// ============================================================

const SIDO_CODE_MAP: Record<string, string> = {
  '11': '110000', '26': '210000', '27': '230000', '28': '220000',
  '29': '240000', '30': '250000', '31': '260000', '36': '360000',
  '41': '310000', '43': '330000', '44': '340000', '46': '360000',
  '47': '370000', '48': '380000', '50': '390000', '51': '320000',
  '52': '350000',
};

// ============================================================
// 직접 공공데이터 API 호출 (EC2 대신 Vercel에서)
// ============================================================

async function callPublicAPI(url: string, timeoutMs = 15000): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': '*/*', 'User-Agent': 'curl/7.79.1' },
      cache: 'no-store',
    });
    clearTimeout(timeoutId);
    const text = await response.text();
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      return JSON.parse(text);
    }
    return text;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

async function fetchRegionsDirect(sido?: string) {
  if (!ADMIN_SERVICE_KEY) return null;
  try {
    const params = new URLSearchParams();
    params.append('serviceKey', ADMIN_SERVICE_KEY);
    params.append('type', 'json');
    params.append('numOfRows', '1000');
    params.append('pageNo', '1');
    const url = `https://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList?${params.toString()}`;
    const data = await callPublicAPI(url) as Record<string, unknown> | null;
    if (!data) return null;

    const stanReginCd = (data as Record<string, unknown>).StanReginCd;
    if (!stanReginCd) return null;

    const sections = Array.isArray(stanReginCd) ? stanReginCd : [stanReginCd];
    const rowSection = sections.find((s: Record<string, unknown>) => s.row);
    if (!rowSection) return null;

    const rows = Array.isArray(rowSection.row) ? rowSection.row : [rowSection.row];

    if (!sido) {
      // 시도 목록
      const sidoMap = new Map<string, string>();
      for (const row of rows) {
        const sidoCd = row.sido_cd ? String(row.sido_cd).padStart(2, '0') : null;
        const isSidoLevel = (row.sgg_cd === '000' && row.umd_cd === '000' && row.ri_cd === '00') || row.locathigh_cd === '0000000000';
        if (sidoCd && isSidoLevel && !sidoMap.has(sidoCd)) {
          sidoMap.set(sidoCd, row.locatadd_nm || row.locallow_nm || '');
        }
      }
      const list = Array.from(sidoMap.entries()).map(([code, name]) => ({ code, name })).sort((a, b) => Number(a.code) - Number(b.code));
      return list.length > 0 ? list : null;
    } else {
      // 시군구 목록
      const target = String(sido).padStart(2, '0');
      const sgMap = new Map<string, { code: string; name: string }>();
      for (const row of rows) {
        const { sido_cd, sgg_cd, umd_cd, ri_cd } = row;
        if (!sido_cd || !sgg_cd) continue;
        const isSigunguLevel = sgg_cd !== '000' && umd_cd === '000' && ri_cd === '00';
        if (String(sido_cd).padStart(2, '0') !== target || !isSigunguLevel) continue;
        const code = `${String(sido_cd).padStart(2, '0')}${String(sgg_cd).padStart(3, '0')}`.padEnd(6, '0');
        if (!sgMap.has(code)) {
          sgMap.set(code, { code, name: row.locatadd_nm || row.locallow_nm || '' });
        }
      }
      const list = Array.from(sgMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      return list.length > 0 ? list : null;
    }
  } catch (e) {
    console.error('[Direct API] regions error:', e);
    return null;
  }
}

async function fetchHospitalsDirect(sido?: string, sigungu?: string, type?: string, hospitalName?: string) {
  if (!API_SERVICE_KEY) return null;
  try {
    const params = new URLSearchParams();
    params.append('serviceKey', API_SERVICE_KEY);
    params.append('numOfRows', '100');
    params.append('pageNo', '1');
    if (sido) {
      const hiraSido = SIDO_CODE_MAP[String(sido).padStart(2, '0')];
      if (hiraSido) params.append('sidoCd', hiraSido);
    }
    if (hospitalName) params.append('yadmNm', hospitalName);
    if (type) {
      const typeMap: Record<string, string> = { '종합병원': '01', '병원': '11', '요양병원': '31', '치과': '41' };
      if (typeMap[type]) params.append('clCd', typeMap[type]);
    }
    const url = `https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList?${params.toString()}`;
    const data = await callPublicAPI(url);
    if (!data || typeof data !== 'object') return null;

    const resp = (data as Record<string, unknown>).response as Record<string, unknown> | undefined;
    if (!resp) return null;
    const header = (resp.header || {}) as Record<string, string>;
    if (header.resultCode && header.resultCode !== '00') return null;
    const body = (resp.body || {}) as Record<string, unknown>;
    const bodyItems = body.items as Record<string, unknown> | undefined;
    let items: Record<string, unknown>[] = [];
    if (bodyItems) {
      if (Array.isArray(bodyItems.item)) items = bodyItems.item;
      else if (bodyItems.item) items = [bodyItems.item as Record<string, unknown>];
    }

    const hospitals = items.map((item: Record<string, unknown>) => ({
      id: item.ykiho || item.hospCd || `hosp_${Math.random().toString(36).slice(2)}`,
      name: item.yadmNm || '병원명 없음',
      address: item.addr || '',
      type: item.clCdNm || '병원',
      departments: item.dgsbjtCd ? [item.dgsbjtCd] : [],
      phone: item.telno || '',
      ykiho: item.ykiho,
      clCdNm: item.clCdNm,
      sidoCd: item.sidoCd,
      sgguCd: item.sgguCd,
    }));

    return { data: hospitals, total: body.totalCount || hospitals.length };
  } catch (e) {
    console.error('[Direct API] hospitals error:', e);
    return null;
  }
}

// ============================================================
// Fallback 응답 생성
// ============================================================

function getRegionsFallback(sido?: string) {
  if (!sido) {
    return { ok: true, data: MOCK_SIDO_LIST, meta: {} };
  }
  const list = MOCK_SIGUNGU[sido] || [];
  return { ok: true, data: list, meta: {} };
}

function getHospitalsFallback(sido?: string, _sigungu?: string, type?: string, hospitalName?: string) {
  let hospitals = sido && MOCK_HOSPITALS[sido]
    ? MOCK_HOSPITALS[sido]
    : Object.values(MOCK_HOSPITALS).flat();

  if (type) {
    hospitals = hospitals.filter(h => h.type === type);
  }
  if (hospitalName) {
    const term = String(hospitalName).toLowerCase();
    hospitals = hospitals.filter(h => String(h.name).toLowerCase().includes(term));
  }
  return { ok: true, data: hospitals, meta: { total: String(hospitals.length) } };
}

function getPricingFallback(hospitalIds: string[], hospitals: Array<{ id: string; name: string }>) {
  const hospitalMap = new Map(hospitals?.map(h => [h.id, h.name]) || []);
  const basePricing: Record<string, { base: number; variation: number }> = {
    '초음파검사': { base: 50000, variation: 10000 },
    'MRI 촬영': { base: 300000, variation: 30000 },
    'CT 촬영': { base: 150000, variation: 20000 },
    '내시경 검사': { base: 200000, variation: 25000 },
    '혈액검사': { base: 30000, variation: 5000 },
  };

  const result = hospitalIds.map((id, index) => {
    const name = hospitalMap.get(id) || `병원 ${index + 1}`;
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const variation = 0.8 + (hash % 40) / 100;
    const items = Object.entries(basePricing).map(([itemName, { base, variation: v }]) => ({
      id: `item_${id}_${itemName}`,
      name: itemName,
      price: Math.round(base * variation + (Math.random() * v - v / 2)),
      unit: '회',
      code: itemName.replace(/\s+/g, '_'),
    }));
    const totalPrice = items.reduce((sum, i) => sum + i.price, 0);
    return {
      hospitalId: id,
      hospitalName: name,
      items,
      averagePrice: Math.round(totalPrice / items.length),
      totalItems: items.length,
    };
  });

  return { ok: true, data: result, meta: {} };
}

// ============================================================
// EC2 프록시 시도 (짧은 타임아웃)
// ============================================================

async function tryBackendProxy(url: string, options: RequestInit): Promise<Response | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
  try {
    const response = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);
    if (response.ok) return response;
    return null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

// ============================================================
// GET 핸들러
// ============================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path ? `/${params.path.join('/')}` : '';
  const searchParams = request.nextUrl.searchParams;

  console.log('[API Route] GET:', { path, params: searchParams.toString() });

  // 1) EC2 백엔드 프록시 시도 (5초 타임아웃)
  const backendUrl = `${BACKEND_URL}/opendata${path}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const proxyResponse = await tryBackendProxy(backendUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Token': CLIENT_TOKEN,
    },
  });

  if (proxyResponse) {
    try {
      const data = await proxyResponse.json();
      console.log('[API Route] EC2 proxy success');
      return NextResponse.json(data);
    } catch { /* fall through */ }
  }

  console.log('[API Route] EC2 unreachable, using direct API / fallback');

  // 2) EC2 실패 → 직접 공공데이터 API 호출 또는 mock 데이터 반환
  if (path === '/regions') {
    const sido = searchParams.get('sido') || undefined;
    const directResult = await fetchRegionsDirect(sido);
    if (directResult) {
      return NextResponse.json({ ok: true, data: directResult, meta: {} });
    }
    return NextResponse.json(getRegionsFallback(sido));
  }

  if (path === '/hospitals') {
    const sido = searchParams.get('sido') || undefined;
    const sigungu = searchParams.get('sigungu') || undefined;
    const type = searchParams.get('type') || undefined;
    const hospitalName = searchParams.get('hospitalName') || undefined;

    const directResult = await fetchHospitalsDirect(sido, sigungu, type, hospitalName);
    if (directResult) {
      return NextResponse.json({
        ok: true,
        data: directResult.data,
        meta: { total: String(directResult.total), page: '1', limit: String(directResult.data.length) },
      });
    }
    return NextResponse.json(getHospitalsFallback(sido, sigungu, type, hospitalName));
  }

  // 알 수 없는 경로
  return NextResponse.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, { status: 404 });
}

// ============================================================
// POST 핸들러
// ============================================================

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const path = params.path ? `/${params.path.join('/')}` : '';
  const body = await request.json();

  console.log('[API Route] POST:', { path });

  // 1) EC2 백엔드 프록시 시도
  const backendUrl = `${BACKEND_URL}/opendata${path}`;
  const proxyResponse = await tryBackendProxy(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Token': CLIENT_TOKEN,
    },
    body: JSON.stringify(body),
  });

  if (proxyResponse) {
    try {
      const data = await proxyResponse.json();
      console.log('[API Route] EC2 proxy success');
      return NextResponse.json(data);
    } catch { /* fall through */ }
  }

  console.log('[API Route] EC2 unreachable, using fallback');

  // 2) EC2 실패 → Fallback
  if (path === '/pricing') {
    const { hospitalIds, hospitals } = body;
    if (!Array.isArray(hospitalIds) || hospitalIds.length === 0) {
      return NextResponse.json({
        ok: false,
        error: { code: 'INVALID_REQUEST', message: 'hospitalIds must be a non-empty array' },
      }, { status: 400 });
    }
    return NextResponse.json(getPricingFallback(hospitalIds, hospitals || []));
  }

  return NextResponse.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, { status: 404 });
}
