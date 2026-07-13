/**
 * 비교 화면 공유용 URL 페이로드 (짧은 JSON → Base64URL)
 * v1: { v: 1, i: ykiho[] }
 * 선택적 q: 항목명 → 횟수 (비용 시뮬레이터)
 */

export const SHARE_PARAM = 's';

export interface SharePayloadV1 {
  v: 1;
  i: string[];
  q?: Record<string, number>;
}

export type SharePayload = SharePayloadV1;

function utf8ToBase64Url(json: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(json, 'utf8').toString('base64url');
  }
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function base64UrlToUtf8(b64url: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64url, 'base64url').toString('utf8');
  }
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const b64 = padded + '='.repeat(padLen);
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSharePayload(payload: SharePayload): string {
  const normalized: SharePayloadV1 = {
    v: 1,
    i: payload.i.slice(0, 5),
  };
  if (payload.q) normalized.q = payload.q;
  return utf8ToBase64Url(JSON.stringify(normalized));
}

export function decodeSharePayload(raw: string): SharePayload | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const text = base64UrlToUtf8(raw.trim());
    const data = JSON.parse(text) as unknown;
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;
    if (obj.v !== 1 || !Array.isArray(obj.i)) return null;
    const ids = obj.i.filter((x): x is string => typeof x === 'string' && x.length > 0);
    if (ids.length === 0) return null;
    const out: SharePayloadV1 = { v: 1, i: ids.slice(0, 5) };
    if (obj.q && typeof obj.q === 'object' && obj.q !== null) {
      const q: Record<string, number> = {};
      for (const [k, v] of Object.entries(obj.q as Record<string, unknown>)) {
        if (typeof k === 'string' && k.length > 0 && typeof v === 'number' && Number.isFinite(v)) {
          q[k] = Math.min(99, Math.max(0, Math.floor(v)));
        }
      }
      if (Object.keys(q).length > 0) out.q = q;
    }
    return out;
  } catch {
    return null;
  }
}

