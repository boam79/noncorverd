/**
 * 시도·시군구별 병원 목록 API 건수 감사 (프록시 GET /api/opendata/hospitals)
 *
 * 사용: npx tsx scripts/audit-sigungu-hospitals.ts
 * 환경변수:
 *   AUDIT_BASE_URL — 기본 https://noncorverd.vercel.app
 *   AUDIT_CLIENT_TOKEN — X-Client-Token (기본 dev-client-token-12345)
 *   AUDIT_SIDO — 비우면 전체 시도, 예: 41 (경기만)
 *   AUDIT_DELAY_MS — 요청 간격(기본 180)
 */
import { toHiraSigungu } from '../lib/opendata/codeMap';

type RegionRow = { code: string; name: string };

const BASE =
  process.env.AUDIT_BASE_URL?.replace(/\/$/, '') || 'https://noncorverd.vercel.app';
const TOKEN = process.env.AUDIT_CLIENT_TOKEN || 'dev-client-token-12345';
const ONLY_SIDO = process.env.AUDIT_SIDO?.trim() || '';
const DELAY_MS = Math.max(0, Number(process.env.AUDIT_DELAY_MS) || 180);

const SIDO_LIST: RegionRow[] = [
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
  { code: '52', name: '전북(52)' },
];

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(path: string): Promise<{ ok: boolean; data?: unknown; error?: unknown }> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'X-Client-Token': TOKEN },
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as { ok: boolean; data?: unknown; error?: unknown };
  } catch {
    return { ok: false, error: { message: 'invalid json', snippet: text.slice(0, 200) } };
  }
}

async function main() {
  const rows: string[] = [
    'sido\tsidoName\tsigunguCode\tsigunguName\thiraMapped\tcount\tflag',
  ];
  const sidos = ONLY_SIDO
    ? SIDO_LIST.filter((s) => s.code === ONLY_SIDO)
    : SIDO_LIST;

  if (sidos.length === 0) {
    console.error('AUDIT_SIDO not found:', ONLY_SIDO);
    process.exit(1);
  }

  for (const sido of sidos) {
    const reg = await fetchJson(`/api/opendata/regions?sido=${encodeURIComponent(sido.code)}`);
    if (!reg.ok || !Array.isArray(reg.data)) {
      console.error('regions failed', sido.code, reg);
      continue;
    }
    const sigungus = reg.data as RegionRow[];
    for (const sg of sigungus) {
      const mapped = !!toHiraSigungu(sg.code);
      const h = await fetchJson(
        `/api/opendata/hospitals?sido=${encodeURIComponent(sido.code)}&sigungu=${encodeURIComponent(sg.code)}`
      );
      const count = h.ok && Array.isArray(h.data) ? (h.data as unknown[]).length : -1;
      let flag = '';
      if (!mapped && count >= 190) flag = 'NO_HIRA_MAP_HIGH_COUNT';
      if (mapped && count === 0) flag = 'ZERO';
      rows.push(
        [
          sido.code,
          sido.name,
          sg.code,
          sg.name.replace(/\s+/g, ' '),
          mapped ? 'Y' : 'N',
          String(count),
          flag,
        ].join('\t')
      );
      if (DELAY_MS) await sleep(DELAY_MS);
    }
  }

  console.log(rows.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
