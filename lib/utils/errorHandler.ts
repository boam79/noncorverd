/**
 * 클라이언트 사이드 에러 핸들링 유틸리티
 */

export type ErrorSeverity = 'info' | 'warning' | 'error';
export type ErrorCategory =
  | 'network'
  | 'auth'
  | 'rate_limit'
  | 'server'
  | 'timeout'
  | 'data'
  | 'unknown';

const QUERY_META_KEY = '__ncQueryErrMeta__';

export interface QueryErrorMeta {
  code: string;
  retryable: boolean;
}

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  severity: ErrorSeverity;
  category: ErrorCategory;
  /** 사용자에게 보조 안내 */
  hint?: string;
}

export function attachQueryErrorMeta(
  error: Error,
  meta: QueryErrorMeta
): Error {
  (error as Error & Record<string, QueryErrorMeta>)[QUERY_META_KEY] = meta;
  return error;
}

export function readQueryErrorMeta(error: unknown): QueryErrorMeta | null {
  if (!(error instanceof Error)) return null;
  const rec = error as Error & Record<string, unknown>;
  const m = rec[QUERY_META_KEY];
  if (
    m &&
    typeof m === 'object' &&
    typeof (m as QueryErrorMeta).code === 'string' &&
    typeof (m as QueryErrorMeta).retryable === 'boolean'
  ) {
    return m as QueryErrorMeta;
  }
  return null;
}

/** API error.code 기반 재시도 가능 여부 */
export function isRetryableApiCode(code: string | undefined): boolean {
  if (!code) return true;
  if (
    code === 'HTTP_401' ||
    code === 'HTTP_403' ||
    code === 'HTTP_404' ||
    code === 'HTTP_400' ||
    code === 'HTTP_422'
  ) {
    return false;
  }
  if (code === 'HTTP_429') return true;
  if (/^HTTP_5\d\d$/.test(code)) return true;
  if (code === 'NETWORK_ERROR' || code === 'TIMEOUT_ERROR') return true;
  return true;
}

function mapHttpCodeToInfo(
  code: string,
  message: string
): Pick<ErrorInfo, 'userMessage' | 'retryable' | 'severity' | 'category' | 'hint'> {
  if (code === 'HTTP_401' || code === 'HTTP_403') {
    return {
      userMessage: '접근이 거부되었습니다. API 토큰·환경 설정을 확인해주세요.',
      retryable: false,
      severity: 'warning',
      category: 'auth',
      hint: '관리자에게 클라이언트 토큰 또는 배포 환경 변수 설정을 문의하세요.',
    };
  }
  if (code === 'HTTP_429') {
    return {
      userMessage: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      retryable: true,
      severity: 'warning',
      category: 'rate_limit',
      hint: '동시에 여러 검색을 줄이면 완화될 수 있습니다.',
    };
  }
  if (/^HTTP_5\d\d$/.test(code)) {
    return {
      userMessage: '서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.',
      retryable: true,
      severity: 'error',
      category: 'server',
    };
  }
  if (code === 'HTTP_404') {
    return {
      userMessage: '요청한 정보를 찾을 수 없습니다.',
      retryable: false,
      severity: 'warning',
      category: 'data',
    };
  }
  if (code === 'TIMEOUT_ERROR') {
    return {
      userMessage: '응답 시간이 초과되었습니다. 서버가 준비 중일 수 있습니다.',
      retryable: true,
      severity: 'warning',
      category: 'timeout',
    };
  }
  if (code === 'NETWORK_ERROR') {
    return {
      userMessage: '네트워크 연결을 확인해주세요.',
      retryable: true,
      severity: 'error',
      category: 'network',
    };
  }
  return {
    userMessage: message || '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    retryable: isRetryableApiCode(code),
    severity: 'error',
    category: 'unknown',
  };
}

export function getErrorInfo(error: unknown): ErrorInfo {
  const meta = readQueryErrorMeta(error);
  if (meta) {
    const msg =
      error instanceof Error ? error.message : '오류가 발생했습니다.';
    const mapped = mapHttpCodeToInfo(meta.code, msg);
    return {
      code: meta.code,
      message: msg,
      userMessage: mapped.userMessage,
      retryable: meta.retryable,
      severity: mapped.severity,
      category: mapped.category,
      hint: mapped.hint,
    };
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return {
        code: 'ABORTED',
        message: error.message,
        userMessage: '요청이 중단되었습니다.',
        retryable: true,
        severity: 'info',
        category: 'timeout',
      };
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: '네트워크 연결을 확인해주세요.',
        retryable: true,
        severity: 'error',
        category: 'network',
      };
    }

    if (error.message.toLowerCase().includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: error.message,
        userMessage: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
        retryable: true,
        severity: 'warning',
        category: 'timeout',
      };
    }

    const httpMatch = /HTTP_(\d{3})/u.exec(error.message);
    if (httpMatch) {
      const code = `HTTP_${httpMatch[1]}`;
      const mapped = mapHttpCodeToInfo(code, error.message);
      return {
        code,
        message: error.message,
        userMessage: mapped.userMessage,
        retryable: mapped.retryable,
        severity: mapped.severity,
        category: mapped.category,
        hint: mapped.hint,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      retryable: true,
      severity: 'error',
      category: 'unknown',
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: '알 수 없는 오류',
    userMessage: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    retryable: true,
    severity: 'error',
    category: 'unknown',
  };
}

/**
 * 에러 로깅 (향후 Sentry 연동 시 사용)
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error, context);
  }
}
