/**
 * 공공데이터포털 API 공통 클라이언트
 * Vercel 인천(icn1) 리전에서 직접 호출 → 한국 IP로 API 접근
 */

const API_BASE = 'https://apis.data.go.kr';
const SERVICE_KEY = process.env.OPENDATA_API_KEY || '';

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string };
}

/** 공공데이터 API 호출 + JSON/XML 자동 파싱 */
export async function fetchPublicData(
  endpoint: string,
  params: Record<string, string | number>
): Promise<{ items: unknown[]; total: number }> {
  const qs = new URLSearchParams();
  qs.append('serviceKey', SERVICE_KEY);
  qs.append('numOfRows', String(params.numOfRows ?? 100));
  qs.append('pageNo', String(params.pageNo ?? 1));
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'numOfRows' && k !== 'pageNo') qs.append(k, String(v));
  }

  const url = `${API_BASE}${endpoint}?${qs.toString()}`;
  const revalidate = params._cache ? Number(params._cache) : 0;
  const res = await fetch(url, {
    headers: { 'Accept': '*/*', 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate },
  });

  const text = await res.text();

  // JSON 응답
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    const json = JSON.parse(text);

    // 행정표준코드 형식: { StanReginCd: [...] }
    if (json.StanReginCd) {
      const sections = Array.isArray(json.StanReginCd) ? json.StanReginCd : [json.StanReginCd];
      const rowSection = sections.find((s: Record<string, unknown>) => s.row);
      const headSection = sections.find((s: Record<string, unknown>) => s.head);
      const items = rowSection ? (Array.isArray(rowSection.row) ? rowSection.row : [rowSection.row]) : [];
      let total = items.length;
      if (headSection?.head) {
        const heads = Array.isArray(headSection.head) ? headSection.head : [headSection.head];
        const tc = heads.find((h: Record<string, unknown>) => h.totalCount);
        if (tc) total = Number(tc.totalCount);
      }
      return { items, total };
    }

    // 공공데이터 표준 형식: { response: { header, body } }
    if (json.response) {
      const { header, body } = json.response;
      if (header?.resultCode && header.resultCode !== '00') {
        throw new Error(header.resultMsg || 'API 오류');
      }
      const raw = body?.items?.item;
      const items = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
      return { items, total: Number(body?.totalCount ?? items.length) };
    }

    return { items: Array.isArray(json) ? json : [], total: 0 };
  }

  // XML 응답 (간단한 정규식 파서 — xml2js 의존성 없이 처리)
  if (text.includes('<?xml') || text.includes('<response>')) {
    const resultCode = text.match(/<resultCode>(\d+)<\/resultCode>/)?.[1];
    if (resultCode && resultCode !== '00') {
      const msg = text.match(/<resultMsg>([^<]*)<\/resultMsg>/)?.[1] ?? 'API 오류';
      throw new Error(msg);
    }
    const totalCount = Number(text.match(/<totalCount>(\d+)<\/totalCount>/)?.[1] ?? 0);
    const itemBlocks = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    const items = itemBlocks.map((m) => parseXmlItem(m[1]));
    return { items, total: totalCount || items.length };
  }

  throw new Error(`알 수 없는 응답 형식: ${text.substring(0, 100)}`);
}

/** XML <item> 블록을 키-값 객체로 변환 */
function parseXmlItem(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const matches = xml.matchAll(/<(\w+)>([^<]*)<\/\1>/g);
  for (const m of matches) result[m[1]] = m[2].trim();
  return result;
}

/** 인증 토큰 검증 */
export function validateToken(req: Request): boolean {
  const token = req.headers.get('x-client-token') || req.headers.get('X-Client-Token');
  const expected = process.env.CLIENT_OPENDATA_TOKEN || process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN || 'dev-client-token-12345';
  return token === expected;
}

export function unauthorizedResponse() {
  return Response.json({ ok: false, error: { code: 'UNAUTHORIZED', message: '인증 토큰이 유효하지 않습니다.' } }, { status: 401 });
}
