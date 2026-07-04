import { describe, expect, it } from 'vitest';
import {
  attachQueryErrorMeta,
  getErrorInfo,
  isRetryableApiCode,
  readQueryErrorMeta,
} from '@/lib/utils/errorHandler';

describe('attachQueryErrorMeta / readQueryErrorMeta', () => {
  it('round-trips metadata attached to an error', () => {
    const error = attachQueryErrorMeta(new Error('boom'), { code: 'HTTP_500', retryable: true });
    expect(readQueryErrorMeta(error)).toEqual({ code: 'HTTP_500', retryable: true });
  });

  it('returns null when no metadata was attached', () => {
    expect(readQueryErrorMeta(new Error('plain'))).toBeNull();
    expect(readQueryErrorMeta('not an error')).toBeNull();
  });
});

describe('isRetryableApiCode', () => {
  it('treats client errors (4xx except 429) as non-retryable', () => {
    expect(isRetryableApiCode('HTTP_401')).toBe(false);
    expect(isRetryableApiCode('HTTP_403')).toBe(false);
    expect(isRetryableApiCode('HTTP_404')).toBe(false);
    expect(isRetryableApiCode('HTTP_400')).toBe(false);
    expect(isRetryableApiCode('HTTP_422')).toBe(false);
  });

  it('treats rate limiting and 5xx as retryable', () => {
    expect(isRetryableApiCode('HTTP_429')).toBe(true);
    expect(isRetryableApiCode('HTTP_500')).toBe(true);
    expect(isRetryableApiCode('HTTP_503')).toBe(true);
  });

  it('defaults to retryable for unknown/undefined codes', () => {
    expect(isRetryableApiCode(undefined)).toBe(true);
    expect(isRetryableApiCode('SOMETHING_ELSE')).toBe(true);
  });
});

describe('getErrorInfo', () => {
  it('prefers attached query error metadata when present', () => {
    const error = attachQueryErrorMeta(new Error('nope'), { code: 'HTTP_401', retryable: false });
    const info = getErrorInfo(error);
    expect(info).toMatchObject({ code: 'HTTP_401', category: 'auth', retryable: false, severity: 'warning' });
  });

  it('classifies AbortError as an info-level, retryable timeout', () => {
    const abortError = new DOMException('aborted', 'AbortError');
    const info = getErrorInfo(abortError);
    expect(info).toMatchObject({ code: 'ABORTED', severity: 'info', retryable: true });
  });

  it('extracts an HTTP_xxx code embedded in the error message', () => {
    const info = getErrorInfo(new Error('요청 실패: HTTP_429'));
    expect(info).toMatchObject({ code: 'HTTP_429', category: 'rate_limit', retryable: true });
  });

  it('classifies network-related messages as network errors', () => {
    const info = getErrorInfo(new Error('failed to fetch'));
    expect(info).toMatchObject({ code: 'NETWORK_ERROR', category: 'network', retryable: true });
  });

  it('classifies timeout-related messages as timeout errors', () => {
    const info = getErrorInfo(new Error('Request timeout exceeded'));
    expect(info).toMatchObject({ code: 'TIMEOUT_ERROR', category: 'timeout', retryable: true });
  });

  it('falls back to UNKNOWN_ERROR for unrecognized errors', () => {
    expect(getErrorInfo(new Error('무언가 이상함'))).toMatchObject({
      code: 'UNKNOWN_ERROR',
      category: 'unknown',
      retryable: true,
    });
  });

  it('falls back to UNKNOWN_ERROR for non-Error values', () => {
    expect(getErrorInfo('a plain string')).toMatchObject({ code: 'UNKNOWN_ERROR' });
    expect(getErrorInfo(null)).toMatchObject({ code: 'UNKNOWN_ERROR' });
  });
});
