import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateToken } from '@/lib/opendata/client';

function makeRequest(token?: string): Request {
  const headers = new Headers();
  if (token !== undefined) headers.set('x-client-token', token);
  return new Request('https://example.com/api/opendata/regions', { headers });
}

describe('validateToken', () => {
  const originalServerToken = process.env.CLIENT_OPENDATA_TOKEN;
  const originalPublicToken = process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN;

  beforeEach(() => {
    delete process.env.CLIENT_OPENDATA_TOKEN;
    delete process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN;
  });

  afterEach(() => {
    if (originalServerToken === undefined) delete process.env.CLIENT_OPENDATA_TOKEN;
    else process.env.CLIENT_OPENDATA_TOKEN = originalServerToken;
    if (originalPublicToken === undefined) delete process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN;
    else process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN = originalPublicToken;
  });

  it('rejects when no server-side token is configured, even with the historical default string', () => {
    // 과거 하드코딩 폴백값이었던 문자열을 보내더라도 서버에 토큰이 설정되지 않았다면 거부해야 함(fail-closed).
    expect(validateToken(makeRequest('dev-client-token-12345'))).toBe(false);
  });

  it('rejects when no token header is sent, even if a server token is configured', () => {
    process.env.CLIENT_OPENDATA_TOKEN = 'secret-token';
    expect(validateToken(makeRequest())).toBe(false);
  });

  it('accepts when the header matches the configured server token', () => {
    process.env.CLIENT_OPENDATA_TOKEN = 'secret-token';
    expect(validateToken(makeRequest('secret-token'))).toBe(true);
  });

  it('accepts when the header matches the configured public token fallback', () => {
    process.env.NEXT_PUBLIC_CLIENT_OPENDATA_TOKEN = 'public-secret';
    expect(validateToken(makeRequest('public-secret'))).toBe(true);
  });

  it('rejects mismatched tokens', () => {
    process.env.CLIENT_OPENDATA_TOKEN = 'secret-token';
    expect(validateToken(makeRequest('wrong-token'))).toBe(false);
  });
});
